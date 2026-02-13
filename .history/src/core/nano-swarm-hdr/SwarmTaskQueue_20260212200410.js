/**
 * Swarm Task Queue
 * 
 * Centralized task distribution and queuing system
 * Task 9.3: Task Management & Distribution
 * 
 * Features:
 * - FIFO task queuing with priority support
 * - Task state tracking (queued, assigned, executing, completed, failed)
 * - Task timeout and retry logic
 * - Task completion tracking and analytics
 * - Dead letter queue for permanently failed tasks
 * - Task correlation and tracing
 */

const EventEmitter = require("events");

class SwarmTaskQueue extends EventEmitter {
  constructor(config = {}) {
    super();

    this.name = "swarm-task-queue";
    this.config = {
      max_queue_size: config.max_queue_size || 10000,
      max_retries: config.max_retries || 3,
      task_timeout_ms: config.task_timeout_ms || 30000, // 30 seconds
      history_size: config.history_size || 1000,
      dead_letter_queue_size: config.dead_letter_queue_size || 100,
      ...config,
    };

    this.queue = []; // Priority queue: [{ task, priority, queued_at }]
    this.in_progress = new Map(); // task_id → task tracking
    this.history = []; // Completed/failed tasks
    this.dead_letter_queue = [];
    this.is_running = false;
    this.created_at = new Date();
    this.task_counts = {
      total: 0,
      completed: 0,
      failed: 0,
      retried: 0,
    };
  }

  /**
   * Enqueue task
   */
  enqueueTask(task, options = {}) {
    if (this.queue.length >= this.config.max_queue_size) {
      return {
        success: false,
        message: "Queue full",
      };
    }

    const queue_entry = {
      task: {
        task_id: task.task_id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: task.content || task,
        priority: options.priority || "normal",
        created_at: new Date(),
        retry_count: 0,
        max_retries: options.max_retries || this.config.max_retries,
        timeout_ms: options.timeout_ms || this.config.task_timeout_ms,
        correlation_id: options.correlation_id || null,
        metadata: options.metadata || {},
      },
      priority: options.priority || "normal",
      queued_at: new Date(),
      queue_position: this.queue.length,
    };

    this.queue.push(queue_entry);
    this.task_counts.total++;

    // Sort by priority
    this.sortQueueByPriority();

    this.emit("task_enqueued", {
      task_id: queue_entry.task.task_id,
      position: queue_entry.queue_position,
      queue_size: this.queue.length,
    });

    return {
      success: true,
      task_id: queue_entry.task.task_id,
      position: queue_entry.queue_position,
    };
  }

  /**
   * Sort queue by priority
   */
  sortQueueByPriority() {
    const priority_order = { high: 0, normal: 1, low: 2 };

    this.queue.sort((a, b) => {
      const priority_a = priority_order[a.priority] || 1;
      const priority_b = priority_order[b.priority] || 1;

      // Primary sort: priority
      if (priority_a !== priority_b) {
        return priority_a - priority_b;
      }

      // Secondary sort: FIFO (by queued_at)
      return a.queued_at - b.queued_at;
    });
  }

  /**
   * Dequeue next task
   */
  dequeueTask() {
    if (this.queue.length === 0) {
      return null;
    }

    const queue_entry = this.queue.shift();
    const task = queue_entry.task;

    // Track as in-progress
    this.in_progress.set(task.task_id, {
      ...task,
      assigned_at: new Date(),
      started_at: null,
      completed_at: null,
      assigned_to: null,
      state: "assigned",
      timeout: setTimeout(() => {
        this.handleTaskTimeout(task.task_id);
      }, task.timeout_ms),
    });

    this.emit("task_dequeued", {
      task_id: task.task_id,
      remaining_queue: this.queue.length,
    });

    return task;
  }

  /**
   * Mark task as started
   */
  markTaskStarted(task_id, assigned_to) {
    const task = this.in_progress.get(task_id);
    if (!task) {
      return false;
    }

    task.state = "executing";
    task.assigned_to = assigned_to;
    task.started_at = new Date();

    this.emit("task_started", {
      task_id,
      assigned_to,
      timestamp: task.started_at,
    });

    return true;
  }

  /**
   * Mark task as completed
   */
  markTaskCompleted(task_id, result = {}) {
    const task = this.in_progress.get(task_id);
    if (!task) {
      return false;
    }

    clearTimeout(task.timeout);
    task.state = "completed";
    task.completed_at = new Date();
    task.result = result;
    task.duration_ms =
      task.completed_at - task.started_at;

    // Move to history
    this.history.push(task);
    this.in_progress.delete(task_id);
    this.task_counts.completed++;

    // Trim history
    if (this.history.length > this.config.history_size) {
      this.history.shift();
    }

    this.emit("task_completed", {
      task_id,
      duration_ms: task.duration_ms,
      result,
    });

    return true;
  }

  /**
   * Mark task as failed
   */
  markTaskFailed(
    task_id,
    error,
    options = {}
  ) {
    const task = this.in_progress.get(task_id);
    if (!task) {
      return false;
    }

    task.error = error;
    task.retry_count++;

    clearTimeout(task.timeout);

    // Check if should retry
    if (task.retry_count <= task.max_retries) {
      task.state = "failed_retrying";
      task.completed_at = new Date();

      // Re-queue for retry
      this.enqueueTask(
        {
          task_id: task.task_id,
          content: task.content,
        },
        {
          priority: task.priority,
          max_retries: task.max_retries,
          timeout_ms: task.timeout_ms,
          correlation_id: task.correlation_id,
          metadata: task.metadata,
        }
      );

      this.in_progress.delete(task_id);
      this.task_counts.retried++;

      this.emit("task_retry", {
        task_id,
        retry_count: task.retry_count,
        max_retries: task.max_retries,
      });

      return true;
    }

    // Task failed permanently
    task.state = "failed";
    task.completed_at = new Date();

    // Move to DLQ
    this.moveToDeadLetterQueue(task, error);

    this.in_progress.delete(task_id);
    this.task_counts.failed++;

    this.emit("task_failed", {
      task_id,
      error: error.message || error,
      retry_count: task.retry_count,
    });

    return true;
  }

  /**
   * Handle task timeout
   */
  handleTaskTimeout(task_id) {
    const task = this.in_progress.get(task_id);
    if (!task) {
      return;
    }

    this.markTaskFailed(
      task_id,
      new Error("Task timeout"),
      { timed_out: true }
    );

    this.emit("task_timeout", {
      task_id,
      timeout_ms: task.timeout_ms,
    });
  }

  /**
   * Move failed task to dead letter queue
   */
  moveToDeadLetterQueue(task, error) {
    const dlq_entry = {
      task,
      error: error.message || error,
      failed_at: new Date(),
    };

    this.dead_letter_queue.push(dlq_entry);

    if (
      this.dead_letter_queue.length >
      this.config.dead_letter_queue_size
    ) {
      this.dead_letter_queue.shift();
    }

    this.emit("dead_letter_queue_added", dlq_entry);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queue_size: this.queue.length,
      in_progress: this.in_progress.size,
      history_size: this.history.length,
      dead_letter_queue_size: this.dead_letter_queue.length,
      task_counts: { ...this.task_counts },
      average_task_duration_ms:
        this.history.length > 0
          ? this.history.reduce(
            (sum, t) => sum + (t.duration_ms || 0),
            0
          ) / this.history.length
          : 0,
    };
  }

  /**
   * Get queue statistics
   */
  getQueueStatistics() {
    const uptime_seconds =
      (new Date() - this.created_at) / 1000;

    // Calculate latencies
    const latencies = this.history
      .filter((t) => t.duration_ms)
      .map((t) => t.duration_ms)
      .sort((a, b) => a - b);

    return {
      uptime_seconds,
      queue_status: this.getQueueStatus(),
      task_success_rate:
        this.task_counts.total > 0
          ? (this.task_counts.completed /
            this.task_counts.total) *
          100
          : 0,
      task_latencies: {
        min:
          latencies.length > 0
            ? latencies[0]
            : 0,
        max:
          latencies.length > 0
            ? latencies[latencies.length - 1]
            : 0,
        average:
          latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) /
            latencies.length
            : 0,
        p50:
          latencies.length > 0
            ? latencies[
            Math.floor(
              latencies.length * 0.5
            )
            ]
            : 0,
        p95:
          latencies.length > 0
            ? latencies[
            Math.floor(
              latencies.length * 0.95
            )
            ]
            : 0,
        p99:
          latencies.length > 0
            ? latencies[
            Math.floor(
              latencies.length * 0.99
            )
            ]
            : 0,
      },
    };
  }

  /**
   * Get task history (completed/failed)
   */
  getTaskHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Query task history
   */
  queryTaskHistory(filters = {}) {
    let results = this.history;

    if (filters.state) {
      results = results.filter((t) => t.state === filters.state);
    }

    if (filters.since) {
      results = results.filter(
        (t) =>
          t.completed_at >=
          new Date(filters.since)
      );
    }

    if (filters.correlation_id) {
      results = results.filter(
        (t) =>
          t.correlation_id ===
          filters.correlation_id
      );
    }

    return results.slice(-(filters.limit || 100));
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(limit = 50) {
    return this.dead_letter_queue.slice(-limit);
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    const cleared = this.dead_letter_queue.length;
    this.dead_letter_queue = [];
    return { cleared };
  }

  /**
   * Start queue
   */
  start() {
    this.is_running = true;
    this.created_at = new Date();
    console.log(`${this.name} started`);
    this.emit("started", { timestamp: new Date() });
    return true;
  }

  /**
   * Stop queue
   */
  stop() {
    this.is_running = false;

    // Clear timeouts
    for (const task of this.in_progress.values()) {
      clearTimeout(task.timeout);
    }

    console.log(`${this.name} stopped`);
    this.emit("stopped", { timestamp: new Date() });
    return true;
  }
}

module.exports = SwarmTaskQueue;
