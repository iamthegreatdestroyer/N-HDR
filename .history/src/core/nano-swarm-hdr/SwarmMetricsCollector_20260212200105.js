/**
 * Swarm Metrics Collector
 * 
 * Collects, aggregates, and analyzes swarm performance metrics
 * Task 9.3: Observability & Performance Tracking
 * 
 * Features:
 * - Real-time metrics collection across swarm
 * - Performance aggregation (P50, P95, P99 latencies)
 * - Throughput tracking (tasks/second)
 * - Agent utilization monitoring
 * - Historical metrics storage
 * - Anomaly detection via statistical baselines
 */

const EventEmitter = require("events");

class SwarmMetricsCollector extends EventEmitter {
  constructor(orchestrator, config = {}) {
    super();

    this.orchestrator = orchestrator;
    this.name = "swarm-metrics-collector";
    this.config = {
      collection_interval: config.collection_interval || 5000, // 5 seconds
      history_size: config.history_size || 288, // 24 hours at 5s intervals
      anomaly_std_devs: config.anomaly_std_devs || 2, // 2 standard deviations
      percentile_buckets: config.percentile_buckets || [50, 95, 99],
      ...config,
    };

    this.current_metrics = this.initializeMetrics();
    this.historical_metrics = []; // Array of timestamped metric snapshots
    this.agent_metrics = new Map(); // agent_id → agent-specific metrics
    this.created_at = new Date();
    this.is_running = false;
    this.collection_count = 0;
  }

  /**
   * Initialize metrics structure
   */
  initializeMetrics() {
    return {
      timestamp: new Date(),
      uptime_seconds: 0,
      swarm_size: 0,
      total_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      task_success_rate: 0,
      average_task_duration_ms: 0,
      task_latencies: {
        p50: 0,
        p95: 0,
        p99: 0,
      },
      throughput_tasks_per_second: 0,
      message_throughput_per_second: 0,
      queue_depth: 0,
      cpu_utilization_percent: 0,
      memory_utilization_percent: 0,
      agent_utilization_percent: 0,
      health_score: 0,
    };
  }

  /**
   * Start metrics collection
   */
  async start() {
    try {
      this.is_running = true;

      // Start periodic collection
      this.collection_interval = setInterval(() => {
        this.collectMetrics();
      }, this.config.collection_interval);

      console.log(
        `${this.name} started (collection interval: ${this.config.collection_interval}ms)`
      );
      this.emit("started", { timestamp: new Date() });
      return true;
    } catch (e) {
      console.error("Failed to start metrics collector:", e);
      this.is_running = false;
      return false;
    }
  }

  /**
   * Collect metrics snapshot
   */
  collectMetrics() {
    if (!this.is_running) return;

    this.collection_count++;
    const metrics = this.initializeMetrics();

    try {
      // Aggregate swarm-wide metrics
      metrics.swarm_size = this.orchestrator.agents.size;
      metrics.uptime_seconds =
        (new Date() - this.created_at) / 1000;

      // Task metrics from orchestrator
      const swarm_status = this.orchestrator.getSwarmStatus();
      if (swarm_status) {
        metrics.completed_tasks =
          swarm_status.metrics?.tasks_completed || 0;
        metrics.failed_tasks = swarm_status.metrics?.tasks_failed || 0;
        metrics.total_tasks = metrics.completed_tasks + metrics.failed_tasks;

        if (metrics.total_tasks > 0) {
          metrics.task_success_rate =
            (metrics.completed_tasks / metrics.total_tasks) * 100;
        }

        metrics.queue_depth = swarm_status.tasks?.queued || 0;
      }

      // Collect per-agent metrics
      const agent_latencies = [];
      let total_cpu = 0;
      let total_memory = 0;
      let total_utilization = 0;

      for (const [agent_id, agent] of this.orchestrator.agents) {
        const agent_status = agent.getStatus();

        // Track latencies for percentile calculation
        if (
          agent_status.last_task_duration_ms
        ) {
          agent_latencies.push(agent_status.last_task_duration_ms);
        }

        // CPU & memory simulation (would integrate with system metrics)
        total_cpu += Math.random() * 50; // Placeholder: 0-50%
        total_memory += Math.random() * 30; // Placeholder: 0-30%
        total_utilization +=
          (agent_status.active_tasks /
            Math.max(agent_status.task_count, 1)) *
          100;

        // Store agent-specific metrics
        if (!this.agent_metrics.has(agent_id)) {
          this.agent_metrics.set(agent_id, {
            task_count: 0,
            success_count: 0,
            error_count: 0,
            latencies: [],
          });
        }

        const agent_metric = this.agent_metrics.get(agent_id);
        agent_metric.task_count = agent_status.task_count;
        agent_metric.success_count = agent_status.success_count;
        agent_metric.error_count = agent_status.task_count - agent_status.success_count;
        agent_metric.latest_status = agent_status;
      }

      // Calculate aggregated metrics
      if (metrics.swarm_size > 0) {
        metrics.cpu_utilization_percent = total_cpu / metrics.swarm_size;
        metrics.memory_utilization_percent =
          total_memory / metrics.swarm_size;
        metrics.agent_utilization_percent =
          total_utilization / metrics.swarm_size;
      }

      // Calculate latency percentiles
      if (agent_latencies.length > 0) {
        const sorted_latencies = agent_latencies.sort(
          (a, b) => a - b
        );
        metrics.average_task_duration_ms =
          sorted_latencies.reduce((a, b) => a + b, 0) /
          sorted_latencies.length;

        for (const percentile of this.config.percentile_buckets) {
          const index = Math.ceil(
            (percentile / 100) * sorted_latencies.length
          );
          metrics.task_latencies[`p${percentile}`] =
            sorted_latencies[index - 1] || 0;
        }
      }

      // Calculate throughput
      if (this.collection_count > 1) {
        const prev_metrics =
          this.historical_metrics[
          this.historical_metrics.length - 1
          ];
        if (prev_metrics) {
          const time_delta_seconds =
            (metrics.timestamp - prev_metrics.timestamp) / 1000;
          const task_delta =
            metrics.completed_tasks -
            prev_metrics.completed_tasks;

          if (time_delta_seconds > 0) {
            metrics.throughput_tasks_per_second =
              task_delta / time_delta_seconds;
          }
        }
      }

      // Calculate health score
      metrics.health_score = this.calculateHealthScore(metrics);

      // Store metrics
      this.current_metrics = metrics;
      this.historical_metrics.push(metrics);

      // Keep only last N snapshots
      if (
        this.historical_metrics.length >
        this.config.history_size
      ) {
        this.historical_metrics.shift();
      }

      // Detect anomalies
      this.detectAnomalies(metrics);

      // Emit metrics
      this.emit("metrics_collected", {
        collection_count: this.collection_count,
        metrics,
        timestamp: metrics.timestamp,
      });

      return metrics;
    } catch (e) {
      console.error("Metrics collection error:", e);
      this.emit("collection_error", {
        error: e.message,
        collection_count: this.collection_count,
      });
    }
  }

  /**
   * Calculate health score (0-100)
   */
  calculateHealthScore(metrics) {
    let score = 100;

    // Penalize low success rate
    if (metrics.task_success_rate < 95) {
      score -= (95 - metrics.task_success_rate) * 0.5;
    }

    // Penalize high queue depth
    if (metrics.queue_depth > 50) {
      score -= Math.min(20, metrics.queue_depth / 5);
    }

    // Penalize high latency (P99 > 1s)
    if (metrics.task_latencies.p99 > 1000) {
      score -=
        Math.min(
          10,
          (metrics.task_latencies.p99 - 1000) / 100
        );
    }

    // Penalize low utilization (swarm under-utilized)
    if (metrics.agent_utilization_percent < 20) {
      score -= 5;
    }

    // Reward high success rate
    if (metrics.task_success_rate > 99) {
      score = Math.min(100, score + 5);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect anomalies using statistical baselines
   */
  detectAnomalies(current_metrics) {
    if (this.historical_metrics.length < 10) {
      return; // Need baseline
    }

    // Calculate mean and std dev for key metrics
    const recent_metrics = this.historical_metrics.slice(-10);

    const means = {
      task_success_rate:
        recent_metrics.reduce((sum, m) => sum + m.task_success_rate, 0) /
        recent_metrics.length,
      queue_depth:
        recent_metrics.reduce((sum, m) => sum + m.queue_depth, 0) /
        recent_metrics.length,
      cpu_utilization:
        recent_metrics.reduce((sum, m) => sum + m.cpu_utilization_percent, 0) /
        recent_metrics.length,
    };

    // Calculate standard deviations
    const std_devs = {};
    for (const key of Object.keys(means)) {
      const variance =
        recent_metrics.reduce(
          (sum, m) => {
            const value =
              key === "task_success_rate"
                ? m.task_success_rate
                : key === "queue_depth"
                  ? m.queue_depth
                  : m.cpu_utilization_percent;
            return sum + Math.pow(value - means[key], 2);
          },
          0
        ) / recent_metrics.length;

      std_devs[key] = Math.sqrt(variance);
    }

    // Check for anomalies
    const anomalies = [];

    if (
      current_metrics.task_success_rate <
      means.task_success_rate - this.config.anomaly_std_devs * std_devs.task_success_rate
    ) {
      anomalies.push({
        type: "low_success_rate",
        current: current_metrics.task_success_rate,
        baseline: means.task_success_rate,
      });
    }

    if (
      current_metrics.queue_depth >
      means.queue_depth + this.config.anomaly_std_devs * std_devs.queue_depth
    ) {
      anomalies.push({
        type: "high_queue_depth",
        current: current_metrics.queue_depth,
        baseline: means.queue_depth,
      });
    }

    if (
      current_metrics.cpu_utilization_percent >
      means.cpu_utilization +
      this.config.anomaly_std_devs * std_devs.cpu_utilization
    ) {
      anomalies.push({
        type: "high_cpu_utilization",
        current: current_metrics.cpu_utilization_percent.toFixed(2),
        baseline: means.cpu_utilization.toFixed(2),
      });
    }

    if (anomalies.length > 0) {
      this.emit("anomaly_detected", {
        timestamp: current_metrics.timestamp,
        anomalies,
      });
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return this.current_metrics;
  }

  /**
   * Get historical metrics (last N snapshots)
   */
  getHistoricalMetrics(limit = 60) {
    return this.historical_metrics.slice(-limit);
  }

  /**
   * Get aggregated statistics over time window
   */
  getStatistics(seconds = 300) {
    // Get metrics from last N seconds
    const cutoff_time = new Date(Date.now() - seconds * 1000);
    const window_metrics = this.historical_metrics.filter(
      (m) => m.timestamp >= cutoff_time
    );

    if (window_metrics.length === 0) {
      return null;
    }

    return {
      time_window_seconds: seconds,
      sample_count: window_metrics.length,
      average_success_rate:
        window_metrics.reduce((sum, m) => sum + m.task_success_rate, 0) /
        window_metrics.length,
      average_queue_depth:
        window_metrics.reduce((sum, m) => sum + m.queue_depth, 0) /
        window_metrics.length,
      average_cpu_utilization:
        window_metrics.reduce(
          (sum, m) => sum + m.cpu_utilization_percent,
          0
        ) / window_metrics.length,
      average_agent_utilization:
        window_metrics.reduce(
          (sum, m) => sum + m.agent_utilization_percent,
          0
        ) / window_metrics.length,
      average_health_score:
        window_metrics.reduce((sum, m) => sum + m.health_score, 0) /
        window_metrics.length,
      total_tasks_completed:
        window_metrics[window_metrics.length - 1]?.completed_tasks || 0,
      average_throughput:
        window_metrics.reduce(
          (sum, m) => sum + m.throughput_tasks_per_second,
          0
        ) / window_metrics.length,
    };
  }

  /**
   * Get agent-specific metrics
   */
  getAgentMetrics(agent_id) {
    return this.agent_metrics.get(agent_id) || null;
  }

  /**
   * Stop metrics collection
   */
  async stop() {
    console.log("Stopping metrics collector...");
    this.is_running = false;
    clearInterval(this.collection_interval);
    this.emit("stopped", { timestamp: new Date() });
  }
}

module.exports = SwarmMetricsCollector;
