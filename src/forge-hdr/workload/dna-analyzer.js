/**
 * Workload DNA Analyzer
 * Analyzes traffic patterns and workload characteristics
 *
 * Pattern Types:
 * - BURST: Sudden spikes followed by low utilization
 * - SUSTAINED: Consistent high load over time
 * - IDLE: Long periods of low activity with occasional load
 * - BIMODAL: Regular cycles of high/low activity
 */

class WorkloadDNAAnalyzer {
  constructor(config = {}) {
    this.config = {
      historyWindow: config.historyWindow || 7 * 24 * 60 * 60 * 1000, // 7 days
      analysisInterval: config.analysisInterval || 300000, // 5 minutes
      ...config,
    };

    this.patterns = [];
    this.profiles = {
      cpu: {},
      memory: {},
      network: {},
      latency: {},
    };
  }

  /**
   * Analyze workload DNA from metrics, topology, and history
   */
  analyze(data) {
    const { metrics, topology, historicalData } = data;

    // Build metrics history
    const history = this.buildHistory(metrics, historicalData);

    // Detect traffic patterns
    const trafficPatterns = this.detectTrafficPatterns(history);

    // Analyze resource profiles
    const cpuProfile = this.analyzeCPUProfile(history, topology);
    const memoryProfile = this.analyzeMemoryProfile(history, topology);
    const networkProfile = this.analyzeNetworkProfile(history);
    const latencyProfile = this.analyzeLatencyProfile(history);

    // Detect cascade risks
    const cascadeRisk = this.analyzeCascadeRisk(history, topology);

    // Identify inefficiencies
    const nodeAffinity = this.analyzeNodeAffinity(topology);

    return {
      timestamp: new Date(),
      trafficPatterns,
      cpuProfile,
      memoryProfile,
      networkProfile,
      latencyProfile,
      cascadeRisk,
      nodeAffinity,

      // Quick lookup metrics
      peakTrafficSurges: trafficPatterns.filter((p) => p.type === "BURST")
        .length,
      estimatedLatencyReduction: latencyProfile.estimatedReduction || 0,
      recommendedMaxReplicas: cpuProfile.recommendedMaxReplicas || 10,

      // Summary
      overallHealthScore: this.calculateHealthScore(
        trafficPatterns,
        cpuProfile,
        memoryProfile,
        cascadeRisk,
      ),
    };
  }

  /**
   * Build metrics history from raw data
   */
  buildHistory(metrics, historicalData) {
    const history = {
      timestamps: [],
      cpuUtilization: [],
      memoryUtilization: [],
      requestRate: [],
      errorRate: [],
      latencyP99: [],
      activeConnections: [],
      networkBytes: [],
    };

    // Add current metrics
    if (metrics) {
      history.timestamps.push(Date.now());
      history.cpuUtilization.push(metrics.cpu_utilization_percent || 50);
      history.memoryUtilization.push(metrics.memory_utilization_percent || 60);
      history.requestRate.push(metrics.http_request_rate_per_sec || 100);
      history.errorRate.push(metrics.http_requests_error_rate || 0.5);
      history.latencyP99.push(metrics.http_request_latency_p99_ms || 100);
      history.activeConnections.push(metrics.active_connections || 50);
      history.networkBytes.push(metrics.network_bytes_per_sec || 1000000);
    }

    // Add historical patterns from decisions
    if (historicalData && Array.isArray(historicalData)) {
      for (const decision of historicalData.slice(-100)) {
        if (decision.metrics && decision.timestamp) {
          const timestamp = new Date(decision.timestamp).getTime();
          if (Date.now() - timestamp < this.config.historyWindow) {
            history.timestamps.push(timestamp);
            history.cpuUtilization.push(
              decision.metrics.cpu_utilization_percent || 50,
            );
            history.memoryUtilization.push(
              decision.metrics.memory_utilization_percent || 60,
            );
            history.requestRate.push(decision.metrics.request_rate || 100);
            history.errorRate.push(decision.metrics.error_rate || 0.5);
            history.latencyP99.push(decision.metrics.latency_p99_ms || 100);
            history.activeConnections.push(decision.metrics.connections || 50);
            history.networkBytes.push(
              decision.metrics.network_bytes || 1000000,
            );
          }
        }
      }
    }

    return history;
  }

  /**
   * Detect traffic patterns in history
   */
  detectTrafficPatterns(history) {
    const patterns = [];
    const requestRates = history.requestRate;

    if (requestRates.length < 4) return patterns;

    // Calculate statistics
    const avg = requestRates.reduce((a, b) => a + b) / requestRates.length;
    const max = Math.max(...requestRates);
    const min = Math.min(...requestRates);
    const stdDev = Math.sqrt(
      requestRates.reduce((sum, val) => sum + Math.pow(val - avg, 2)) /
        requestRates.length,
    );

    // Detect BURST pattern: high variance, spikes above 2x avg
    const burstCount = requestRates.filter((r) => r > avg * 2).length;
    if (burstCount > requestRates.length * 0.15) {
      patterns.push({
        type: "BURST",
        confidence: 0.85,
        peakMultiplier: max / avg,
        frequency: burstCount,
        recommendation: "Increase HPA max replicas",
      });
    }

    // Detect SUSTAINED pattern: consistently high
    const highCount = requestRates.filter((r) => r > avg * 0.8).length;
    if (highCount > requestRates.length * 0.7) {
      patterns.push({
        type: "SUSTAINED",
        confidence: 0.9,
        avgLoad: avg,
        recommendation: "Consider static replica increase",
      });
    }

    // Detect IDLE pattern: mostly low with occasional spikes
    const lowCount = requestRates.filter((r) => r < avg * 0.3).length;
    if (lowCount > requestRates.length * 0.6) {
      patterns.push({
        type: "IDLE",
        confidence: 0.88,
        idlePercentage: (lowCount / requestRates.length) * 100,
        recommendation: "Reduce base replica count",
      });
    }

    // Detect BIMODAL pattern: two distinct load levels
    if (stdDev > avg * 0.5) {
      patterns.push({
        type: "BIMODAL",
        confidence: 0.82,
        stdDeviation: stdDev,
        recommendation: "Configure time-based scaling",
      });
    }

    return patterns;
  }

  /**
   * Analyze CPU utilization profile
   */
  analyzeCPUProfile(history, topology) {
    const cpuValues = history.cpuUtilization;

    const stats = {
      currentUtilization: cpuValues[cpuValues.length - 1] || 50,
      averageUtilization: cpuValues.reduce((a, b) => a + b) / cpuValues.length,
      p95: this.percentile(cpuValues, 0.95),
      p99: this.percentile(cpuValues, 0.99),
      min: Math.min(...cpuValues),
      max: Math.max(...cpuValues),
    };

    // Current replica estimate
    stats.currentReplicas = topology?.pods?.length || 3;

    // Recommendations
    if (stats.averageUtilization < 30) {
      stats.recommendation = "SCALE_DOWN";
      stats.recommendedReplicas = Math.max(
        2,
        Math.floor(stats.currentReplicas * 0.67),
      );
      stats.estimatedCostSavings = 35;
    } else if (stats.p99 > 85) {
      stats.recommendation = "SCALE_UP";
      stats.recommendedReplicas = Math.ceil(stats.currentReplicas * 1.5);
      stats.recommendedMaxReplicas = stats.recommendedReplicas * 2;
    } else {
      stats.recommendation = "MAINTAIN";
      stats.recommendedMaxReplicas = stats.currentReplicas * 2;
    }

    return stats;
  }

  /**
   * Analyze memory utilization profile
   */
  analyzeMemoryProfile(history, topology) {
    const memValues = history.memoryUtilization;

    const stats = {
      currentUtilization: memValues[memValues.length - 1] || 60,
      averageUtilization: memValues.reduce((a, b) => a + b) / memValues.length,
      p95: this.percentile(memValues, 0.95),
      p99: this.percentile(memValues, 0.99),
      min: Math.min(...memValues),
      max: Math.max(...memValues),
    };

    // Estimate request/limit
    const currentRequest = topology?.pods?.[0]?.memory?.request || 512;
    const currentLimit = topology?.pods?.[0]?.memory?.limit || 1024;

    stats.currentRequest = currentRequest;
    stats.currentLimit = currentLimit;

    // Recommendation
    if (stats.p99 > 90) {
      stats.recommendation = "INCREASE_LIMIT";
      stats.recommendedRequest = Math.round(currentRequest * 1.3);
      stats.recommendedLimit = Math.round(currentLimit * 1.3);
      stats.preventOOM = true;
    } else if (stats.averageUtilization < 40) {
      stats.recommendation = "DECREASE_REQUEST";
      stats.recommendedRequest = Math.max(
        256,
        Math.round(currentRequest * 0.8),
      );
    } else {
      stats.recommendation = "MAINTAIN";
    }

    return stats;
  }

  /**
   * Analyze network profile
   */
  analyzeNetworkProfile(history) {
    const networkValues = history.networkBytes;

    return {
      currentThroughput: networkValues[networkValues.length - 1] || 1000000,
      averageThroughput:
        networkValues.reduce((a, b) => a + b) / networkValues.length,
      p95: this.percentile(networkValues, 0.95),
      max: Math.max(...networkValues),
      bottleneckRisk: Math.max(...networkValues) > 10000000 ? "HIGH" : "LOW",
    };
  }

  /**
   * Analyze latency profile
   */
  analyzeLatencyProfile(history) {
    const latencyValues = history.latencyP99;

    const stats = {
      currentLatency: latencyValues[latencyValues.length - 1] || 100,
      averageLatency:
        latencyValues.reduce((a, b) => a + b) / latencyValues.length,
      p95: this.percentile(latencyValues, 0.95),
      max: Math.max(...latencyValues),
      min: Math.min(...latencyValues),
    };

    // Estimate reduction from optimization
    if (stats.averageLatency > 150) {
      stats.estimatedReduction = Math.round(stats.averageLatency * 0.25);
      stats.recommendation = "Priority: reduce latency";
    } else {
      stats.estimatedReduction = 10;
    }

    return stats;
  }

  /**
   * Analyze cascade failure risk
   */
  analyzeCascadeRisk(history, topology) {
    const errorRates = history.errorRate;
    const connectionCounts = history.activeConnections;

    // Calculate risk factors
    const errorTrend = this.calculateTrend(errorRates.slice(-20));
    const connectionPressure =
      Math.max(...connectionCounts) /
      (connectionCounts.reduce((a, b) => a + b) / connectionCounts.length);

    let score = 0;

    if (errorTrend > 0.1) score += 25; // Increasing errors
    if (connectionPressure > 3) score += 30; // High connection variance
    if (Math.max(...errorRates) > 5) score += 25; // Peak error rate
    if ((topology?.pods?.length || 1) < 3) score += 20; // Low redundancy

    return {
      score: Math.min(100, score),
      errorTrend,
      connectionPressure,
      lowRedundancy: (topology?.pods?.length || 1) < 3,
      recommendation: score > 60 ? "CRITICAL" : score > 40 ? "HIGH" : "MEDIUM",
    };
  }

  /**
   * Analyze node affinity and placement efficiency
   */
  analyzeNodeAffinity(topology) {
    if (!topology?.pods || !topology?.nodes) {
      return { inefficiencies: 0, recommendation: "UNKNOWN" };
    }

    const podsByNode = {};
    for (const pod of topology.pods) {
      const node = pod.nodeName || "unknown";
      podsByNode[node] = (podsByNode[node] || 0) + 1;
    }

    // Measure distribution imbalance
    const distribution = Object.values(podsByNode);
    const avg =
      distribution.length > 0
        ? distribution.reduce((a, b) => a + b) / distribution.length
        : 0;

    let imbalance = 0;
    for (const count of distribution) {
      imbalance += Math.abs(count - avg);
    }

    const inefficiencyPercent = Math.min(
      100,
      (imbalance / distribution.length) * 100,
    );

    return {
      nodeCount: topology.nodes.length,
      podCount: topology.pods.length,
      inefficiencies: Math.round(inefficiencyPercent),
      mostLoaded: Math.max(...distribution),
      leastLoaded: Math.min(...distribution),
      recommendation: inefficiencyPercent > 20 ? "REBALANCE" : "GOOD",
    };
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(patterns, cpuProfile, memoryProfile, cascadeRisk) {
    let score = 100;

    // Penalty for concerning patterns
    for (const pattern of patterns) {
      if (pattern.type === "BURST" && pattern.peakMultiplier > 5) {
        score -= 15;
      }
    }

    // Penalty for high cascade risk
    score -= cascadeRisk.score / 5;

    // Penalty for extreme CPU utilization
    if (cpuProfile.p99 > 90) score -= 10;
    if (cpuProfile.averageUtilization > 80) score -= 5;

    // Penalty for memory contention
    if (memoryProfile.p99 > 90) score -= 15;

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate percentile
   */
  percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate trend (slope) of recent values
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
}

module.exports = { WorkloadDNAAnalyzer };
