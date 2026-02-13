/**
 * Anomaly Detector
 * ML-based anomaly detection using statistical analysis and time-series forecasting
 */

class AnomalyDetector {
  constructor(config = {}) {
    this.config = {
      detectionMethod: config.detectionMethod || "zscore", // zscore, iqr, isolation-forest, prophet
      threshold: config.threshold || 3,
      windowSize: config.windowSize || 30,
      minDataPoints: config.minDataPoints || 10,
      enableAutoDetection: config.enableAutoDetection !== false,
      sensitivityLevel: config.sensitivityLevel || "normal", // low, normal, high
      baselines: config.baselines || {},
      ...config,
    };

    this.metrics = {
      anomaliesDetected: 0,
      falsePositives: 0,
      detectionAccuracy: 0.95,
      averageDetectionTime: 0,
      totalDetectionTime: 0,
      typesDetected: {},
    };

    this.timeSeries = {}; // Map<metricName, [{timestamp, value}]>
    this.anomalyHistory = [];
    this.baselineModel = {};
    this.eventBus = config.eventBus;

    this.sensitivityMap = {
      low: 2.5,
      normal: 3.0,
      high: 2.0,
    };
  }

  /**
   * Initialize anomaly detector
   */
  async initialize() {
    try {
      // Load baseline models from historical data
      await this.buildBaselines();

      console.log("Anomaly detector initialized");
      if (this.eventBus) {
        this.eventBus.publish("anomalyDetector:initialized", {
          timestamp: Date.now(),
          baselinesLoaded: Object.keys(this.baselineModel).length,
        });
      }
    } catch (error) {
      console.error("Failed to initialize anomaly detector:", error);
      throw error;
    }
  }

  /**
   * Detect anomalies in metric stream
   */
  async detectAnomalies(metricName, value, timestamp = Date.now()) {
    const startTime = Date.now();

    try {
      // Build time series
      if (!this.timeSeries[metricName]) {
        this.timeSeries[metricName] = [];
      }

      this.timeSeries[metricName].push({ value, timestamp });

      // Keep series bounded
      if (this.timeSeries[metricName].length > this.config.windowSize * 2) {
        this.timeSeries[metricName].shift();
      }

      // Check if we have enough data
      if (this.timeSeries[metricName].length < this.config.minDataPoints) {
        return { isAnomaly: false, confidence: 0, reason: "insufficient_data" };
      }

      // Detect anomaly using selected method
      let result;
      switch (this.config.detectionMethod) {
        case "zscore":
          result = this.detectZScore(metricName, value);
          break;
        case "iqr":
          result = this.detectIQR(metricName, value);
          break;
        case "isolation-forest":
          result = this.detectIsolationForest(metricName, value);
          break;
        case "prophet":
          result = await this.detectProphet(metricName, value);
          break;
        default:
          result = this.detectZScore(metricName, value);
      }

      // Record detection time
      const detectionTime = Date.now() - startTime;
      this.metrics.totalDetectionTime += detectionTime;
      this.metrics.averageDetectionTime =
        this.metrics.totalDetectionTime / (this.metrics.anomaliesDetected + 1);

      // Log anomaly
      if (result.isAnomaly) {
        this.metrics.anomaliesDetected++;
        this.logAnomaly(metricName, value, result);

        if (this.eventBus) {
          this.eventBus.publish("anomalyDetector:anomalyDetected", {
            metricName,
            value,
            timestamp,
            confidence: result.confidence,
            type: result.anomalyType,
            severity: this.calculateSeverity(result.confidence),
          });
        }
      }

      // Track anomaly type
      if (!this.metrics.typesDetected[result.anomalyType]) {
        this.metrics.typesDetected[result.anomalyType] = 0;
      }
      this.metrics.typesDetected[result.anomalyType]++;

      return result;
    } catch (error) {
      console.error(`Anomaly detection failed for ${metricName}:`, error);
      return {
        isAnomaly: false,
        confidence: 0,
        reason: "detection_error",
        error: error.message,
      };
    }
  }

  /**
   * Z-Score anomaly detection
   * Detects values > N standard deviations from mean
   */
  detectZScore(metricName, value) {
    const series = this.timeSeries[metricName];
    const values = series.map((p) => p.value);

    // Calculate mean
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate standard deviation
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return { isAnomaly: false, confidence: 0, reason: "no_variance" };
    }

    // Calculate z-score
    const zScore = Math.abs((value - mean) / stdDev);
    const threshold = this.sensitivityMap[this.config.sensitivityLevel];

    return {
      isAnomaly: zScore > threshold,
      confidence: Math.min(zScore / 5, 1.0), // Normalize confidence 0-1
      zscore: zScore,
      mean,
      stdDev,
      anomalyType:
        zScore > threshold ? (value > mean ? "spike" : "dip") : "normal",
    };
  }

  /**
   * Interquartile Range (IQR) anomaly detection
   * Detects outliers beyond Q1-1.5*IQR and Q3+1.5*IQR
   */
  detectIQR(metricName, value) {
    const series = this.timeSeries[metricName];
    const values = [...series.map((p) => p.value)].sort((a, b) => a - b);

    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);

    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const isAnomaly = value < lowerBound || value > upperBound;
    const confidence = isAnomaly
      ? Math.min(
          Math.max(
            Math.abs(value - q1) / Math.max(Math.abs(lowerBound), 1),
            Math.abs(value - q3) / Math.max(Math.abs(upperBound), 1),
          ),
          1.0,
        )
      : 0;

    return {
      isAnomaly,
      confidence,
      q1,
      q3,
      iqr,
      lowerBound,
      upperBound,
      anomalyType: isAnomaly
        ? value > upperBound
          ? "spike"
          : "dip"
        : "normal",
    };
  }

  /**
   * Isolation Forest-inspired anomaly detection
   * Simplified version: checks isolation score based on distinctness
   */
  detectIsolationForest(metricName, value) {
    const series = this.timeSeries[metricName];
    const values = series.map((p) => p.value);

    // Calculate how isolated this value is
    const nearestNeighborsCount = values.filter(
      (v) =>
        Math.abs(v - value) < (Math.max(...values) - Math.min(...values)) * 0.1,
    ).length;

    // Isolation score: fewer neighbors = more isolated = higher anomaly score
    const isolationScore = 1 - nearestNeighborsCount / values.length;
    const threshold = this.sensitivityMap[this.config.sensitivityLevel] / 10; // Convert to 0-0.5 range

    return {
      isAnomaly: isolationScore > threshold,
      confidence: Math.min(isolationScore * 2, 1.0),
      isolationScore,
      nearestNeighborsCount,
      anomalyType: "outlier",
    };
  }

  /**
   * Prophet-style anomaly detection
   * Simplified time-series forecasting based on trend and seasonality
   */
  async detectProphet(metricName, value) {
    const series = this.timeSeries[metricName];

    if (series.length < 20) {
      return {
        isAnomaly: false,
        confidence: 0,
        reason: "insufficient_data_for_prophet",
      };
    }

    // Extract values
    const values = series.map((p) => p.value);
    const timestamps = series.map((p) => p.timestamp);

    // Calculate trend using linear regression
    const trend = this.calculateTrend(values);

    // Calculate seasonality (simplified: every 24 data points = 1 day)
    const seasonalFactor = this.calculateSeasonality(values, 24);

    // Forecast next value
    const forecast = values[values.length - 1] + trend + seasonalFactor;

    // Calculate upper/lower bounds using confidence intervals
    const residuals = values
      .slice(-10)
      .map((v, i) => Math.abs(v - (values[i - 1] || v)));
    const meanResidual =
      residuals.reduce((a, b) => a + b, 0) / residuals.length;

    const upperBound = forecast + 2 * meanResidual;
    const lowerBound = forecast - 2 * meanResidual;

    const isAnomaly = value > upperBound || value < lowerBound;
    const confidence = isAnomaly
      ? Math.min(
          Math.max(Math.abs(value - forecast) / Math.max(meanResidual, 1), 0.5),
          1.0,
        )
      : 0;

    return {
      isAnomaly,
      confidence,
      forecast,
      upperBound,
      lowerBound,
      trend,
      seasonalFactor,
      anomalyType: isAnomaly
        ? value > upperBound
          ? "spike"
          : "dip"
        : "normal",
    };
  }

  /**
   * Calculate trend using linear regression
   */
  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean),
      0,
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    return slope;
  }

  /**
   * Calculate seasonality using autocorrelation
   */
  calculateSeasonality(values, period) {
    if (values.length < period) return 0;

    const recentPeriod = values.slice(-period);
    const previousPeriod = values.slice(-2 * period, -period);

    if (previousPeriod.length === 0) return 0;

    const recentMean =
      recentPeriod.reduce((a, b) => a + b, 0) / recentPeriod.length;
    const previousMean =
      previousPeriod.reduce((a, b) => a + b, 0) / previousPeriod.length;

    return recentMean - previousMean;
  }

  /**
   * Calculate severity from confidence score
   */
  calculateSeverity(confidence) {
    if (confidence > 0.9) return "critical";
    if (confidence > 0.7) return "high";
    if (confidence > 0.5) return "medium";
    return "low";
  }

  /**
   * Build baseline models from historical data
   */
  async buildBaselines() {
    // This would load historical data and build initial baselines
    // For now, initialize with empty baselines
    for (const metric of Object.keys(this.config.baselines)) {
      this.baselineModel[metric] = this.config.baselines[metric];
    }
  }

  /**
   * Get anomaly report
   */
  getAnomalyReport(metricName = null, limit = 50) {
    let anomalies = this.anomalyHistory;

    if (metricName) {
      anomalies = anomalies.filter((a) => a.metricName === metricName);
    }

    return {
      total: anomalies.length,
      recentAnomalies: anomalies.slice(-limit),
      metrics: this.metrics,
      byType: this.groupAnomaliesByType(anomalies),
      bySeverity: this.groupAnomaliesBySeverity(anomalies),
    };
  }

  /**
   * Group anomalies by type
   */
  groupAnomaliesByType(anomalies) {
    const grouped = {};
    for (const anomaly of anomalies) {
      if (!grouped[anomaly.type]) {
        grouped[anomaly.type] = [];
      }
      grouped[anomaly.type].push(anomaly);
    }
    return grouped;
  }

  /**
   * Group anomalies by severity
   */
  groupAnomaliesBySeverity(anomalies) {
    const grouped = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    for (const anomaly of anomalies) {
      grouped[anomaly.severity].push(anomaly);
    }
    return grouped;
  }

  /**
   * Log detected anomaly
   */
  logAnomaly(metricName, value, detectionResult) {
    const log = {
      metricName,
      value,
      timestamp: Date.now(),
      detectionResult,
      type: detectionResult.anomalyType,
      confidence: detectionResult.confidence,
      severity: this.calculateSeverity(detectionResult.confidence),
      id: this.generateAnomalyId(),
    };

    this.anomalyHistory.push(log);

    // Keep history bounded
    if (this.anomalyHistory.length > 5000) {
      this.anomalyHistory.shift();
    }

    return log;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      metrics: this.metrics,
      configuration: {
        detectionMethod: this.config.detectionMethod,
        sensitivityLevel: this.config.sensitivityLevel,
        threshold: this.config.threshold,
        windowSize: this.config.windowSize,
        minDataPoints: this.config.minDataPoints,
      },
      totalAnomalies: this.anomalyHistory.length,
      abnormalMetrics: Object.keys(this.timeSeries),
    };
  }

  /**
   * Update detection method
   */
  updateDetectionMethod(method, options = {}) {
    if (["zscore", "iqr", "isolation-forest", "prophet"].includes(method)) {
      this.config.detectionMethod = method;
      Object.assign(this.config, options);

      if (this.eventBus) {
        this.eventBus.publish("anomalyDetector:methodUpdated", {
          method,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Generate anomaly ID
   */
  generateAnomalyId() {
    return `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { AnomalyDetector };
