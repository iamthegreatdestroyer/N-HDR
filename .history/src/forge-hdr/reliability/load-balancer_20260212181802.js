/**
 * Load Balancer
 * Intelligent request distribution across pods
 */

const { EventEmitter } = require("events");

class LoadBalancer extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      kubernetesClient: config.kubernetesClient,
      prometheusClient: config.prometheusClient,
      circuitBreaker: config.circuitBreaker,
      balancingStrategy: config.balancingStrategy || "least-loaded", // round-robin, least-loaded, health-aware
      healthCheckInterval: config.healthCheckInterval || 5000,
      metricsWindow: config.metricsWindow || 60000, // 1 minute
      ...config,
    };

    this.podMetrics = new Map();
    this.selectedPods = new Map();
    this.roundRobinIndex = 0;
    this.metrics = {
      requestsRouted: 0,
      failedRoutes: 0,
      successfulRoutes: 0,
      totalLatency: 0,
      peakLatency: 0,
      minLatency: Infinity,
    };

    this.isRunning = false;
  }

  /**
   * Start load balancer
   */
  async start() {
    if (this.isRunning) {
      console.warn("Load balancer already running");
      return;
    }

    this.isRunning = true;
    console.log("Load balancer started");
    this.emit("started");

    // Start health check cycle
    this.healthCheckInterval = setInterval(() => {
      this.updatePodMetrics().catch((error) => {
        console.error("Error updating pod metrics:", error);
      });
    }, this.config.healthCheckInterval);

    // Initial metrics update
    await this.updatePodMetrics();
  }

  /**
   * Stop load balancer
   */
  async stop() {
    if (!this.isRunning) {
      console.warn("Load balancer not running");
      return;
    }

    this.isRunning = false;
    clearInterval(this.healthCheckInterval);
    console.log("Load balancer stopped");
    this.emit("stopped");
  }

  /**
   * Update pod metrics from Prometheus
   */
  async updatePodMetrics() {
    try {
      const topology = this.config.kubernetesClient?.topology;
      if (!topology?.pods) return;

      const metrics =
        (await this.config.prometheusClient?.getCurrentMetrics()) || {};

      for (const pod of topology.pods) {
        const podKey = `${pod.namespace}/${pod.name}`;
        const podMetrics = metrics.pods?.[podKey] || {};

        this.podMetrics.set(podKey, {
          name: podKey,
          namespace: pod.namespace,
          podName: pod.name,
          node: pod.node,
          status: pod.status,
          cpu: podMetrics.cpu || 0,
          memory: podMetrics.memory || 0,
          latency: podMetrics.latency || 0,
          errorRate: podMetrics.errorRate || 0,
          requests: podMetrics.requests || 0,
          healthy: pod.status === "Running" && podMetrics.errorRate < 0.1,
          uptime: podMetrics.uptime || 0,
          lastUpdated: Date.now(),
        });
      }

      this.emit("metricsUpdated", { podCount: this.podMetrics.size });
    } catch (error) {
      console.error("Error updating pod metrics:", error);
      this.emit("metricsUpdateFailed", { error: error.message });
    }
  }

  /**
   * Select pod for request routing
   */
  selectPod(service, namespace = "default") {
    const key = `${namespace}/${service}`;

    // Find available pods for this service
    const availablePods = Array.from(this.podMetrics.values()).filter((pod) => {
      return (
        pod.namespace === namespace &&
        pod.status === "Running" &&
        pod.healthy &&
        !this.isPodBlocked(pod.name)
      );
    });

    if (availablePods.length === 0) {
      this.metrics.failedRoutes++;
      this.emit("noPodAvailable", { service, namespace });
      throw new Error(`No available pods for service ${key}`);
    }

    let selected;
    switch (this.config.balancingStrategy) {
      case "round-robin":
        selected = this.selectRoundRobin(availablePods);
        break;

      case "least-loaded":
        selected = this.selectLeastLoaded(availablePods);
        break;

      case "health-aware":
        selected = this.selectHealthAware(availablePods);
        break;

      case "latency-optimized":
        selected = this.selectLatencyOptimized(availablePods);
        break;

      default:
        selected = availablePods[0];
    }

    this.metrics.requestsRouted++;
    this.selectedPods.set(key, selected);

    this.emit("podSelected", {
      service,
      pod: selected.name,
      strategy: this.config.balancingStrategy,
    });

    return selected;
  }

  /**
   * Round-robin pod selection
   */
  selectRoundRobin(pods) {
    const selected = pods[this.roundRobinIndex % pods.length];
    this.roundRobinIndex++;
    return selected;
  }

  /**
   * Select least-loaded pod
   */
  selectLeastLoaded(pods) {
    return pods.reduce((least, current) => {
      const currentLoad = (current.cpu || 0) + (current.memory || 0) / 1024;
      const leastLoad = (least.cpu || 0) + (least.memory || 0) / 1024;

      return currentLoad < leastLoad ? current : least;
    });
  }

  /**
   * Select health-aware pod
   */
  selectHealthAware(pods) {
    // Score pods based on error rate and latency
    const scored = pods.map((pod) => ({
      pod,
      score: (1 - pod.errorRate) * 100 - pod.latency, // Lower error, lower latency = higher score
    }));

    return scored.reduce((best, current) =>
      current.score > best.score ? current : best,
    ).pod;
  }

  /**
   * Select latency-optimized pod
   */
  selectLatencyOptimized(pods) {
    return pods.reduce((best, current) => {
      return (current.latency || Infinity) < (best.latency || Infinity)
        ? current
        : best;
    });
  }

  /**
   * Record request metrics
   */
  recordRequest(podName, duration, success = true, errorRate = 0) {
    const pod = Array.from(this.podMetrics.values()).find(
      (p) => p.podName === podName,
    );
    if (!pod) return;

    if (success) {
      this.metrics.successfulRoutes++;
      this.metrics.totalLatency += duration;
      this.metrics.peakLatency = Math.max(this.metrics.peakLatency, duration);
      this.metrics.minLatency = Math.min(this.metrics.minLatency, duration);

      this.emit("requestSuccess", {
        pod: podName,
        duration,
        errorRate,
      });
    } else {
      this.metrics.failedRoutes++;

      this.emit("requestFailed", {
        pod: podName,
        duration,
        errorRate,
      });
    }

    // Update pod error rate
    pod.errorRate = errorRate;
  }

  /**
   * Check if pod is blocked (circuit breaker open)
   */
  isPodBlocked(podName) {
    if (!this.config.circuitBreaker) return false;

    const breaker = this.config.circuitBreaker.getBreaker?.(podName);
    return breaker?.state === "OPEN";
  }

  /**
   * Get pod status
   */
  getPodStatus(podName) {
    if (podName) {
      return Array.from(this.podMetrics.values()).find(
        (p) => p.podName === podName,
      );
    }

    // Return all pods
    return Array.from(this.podMetrics.values());
  }

  /**
   * Get service status
   */
  getServiceStatus(service, namespace = "default") {
    const pods = Array.from(this.podMetrics.values()).filter((pod) => {
      return pod.namespace === namespace && pod.podName.startsWith(service);
    });

    const healthy = pods.filter((p) => p.healthy).length;
    const totalRequests = pods.reduce((sum, p) => sum + p.requests, 0);
    const avgLatency =
      pods.reduce((sum, p) => sum + p.latency, 0) / pods.length;
    const avgErrorRate =
      pods.reduce((sum, p) => sum + p.errorRate, 0) / pods.length;

    return {
      service,
      namespace,
      totalPods: pods.length,
      healthyPods: healthy,
      healthPercentage:
        pods.length > 0 ? ((healthy / pods.length) * 100).toFixed(2) : 0,
      totalRequests,
      avgLatency: avgLatency.toFixed(2),
      avgErrorRate: avgErrorRate.toFixed(4),
      pods: pods.map((p) => ({
        name: p.podName,
        status: p.status,
        healthy: p.healthy,
        cpu: p.cpu.toFixed(2),
        memory: p.memory.toFixed(2),
        latency: p.latency.toFixed(2),
        errorRate: p.errorRate.toFixed(4),
      })),
    };
  }

  /**
   * Get balancer statistics
   */
  getStatistics() {
    const avgLatency =
      this.metrics.requestsRouted > 0
        ? (this.metrics.totalLatency / this.metrics.successfulRoutes).toFixed(2)
        : 0;

    const successRate =
      this.metrics.requestsRouted > 0
        ? (
            (this.metrics.successfulRoutes / this.metrics.requestsRouted) *
            100
          ).toFixed(2)
        : 0;

    return {
      isRunning: this.isRunning,
      strategy: this.config.balancingStrategy,
      metrics: {
        ...this.metrics,
        avgLatency: parseFloat(avgLatency),
        successRate: parseFloat(successRate),
        minLatency:
          this.metrics.minLatency === Infinity ? 0 : this.metrics.minLatency,
      },
      podMetrics: {
        totalPods: this.podMetrics.size,
        healthyPods: Array.from(this.podMetrics.values()).filter(
          (p) => p.healthy,
        ).length,
        podStatus: Array.from(this.podMetrics.values()).map((p) => ({
          pod: p.name,
          healthy: p.healthy,
          cpu: p.cpu.toFixed(2),
          latency: p.latency.toFixed(2),
        })),
      },
    };
  }

  /**
   * Shift traffic away from pod
   */
  shiftTraffic(podName, percentage = 50) {
    const pod = Array.from(this.podMetrics.values()).find(
      (p) => p.podName === podName,
    );
    if (pod) {
      pod.trafficWeight = (100 - percentage) / 100;

      this.emit("trafficShifted", {
        pod: podName,
        percentage,
        weight: pod.trafficWeight,
      });
    }
  }

  /**
   * Restore traffic to pod
   */
  restoreTraffic(podName) {
    const pod = Array.from(this.podMetrics.values()).find(
      (p) => p.podName === podName,
    );
    if (pod) {
      pod.trafficWeight = 1.0;

      this.emit("trafficRestored", { pod: podName });
    }
  }
}

module.exports = { LoadBalancer };
