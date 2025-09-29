/**
 * @file Benchmarking Suite for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const { performance } = require('perf_hooks');

class BenchmarkingSuite {
    constructor() {
        this.results = new Map();
        this.baselineMetrics = new Map();
        this.swarmMetrics = new Map();
    }

    /**
     * Runs a task processing benchmark
     * @param {Function} task - Task function to benchmark
     * @param {object} config - Benchmark configuration
     * @returns {object} Benchmark results
     */
    async runTaskBenchmark(task, config = {}) {
        const {
            iterations = 1000,
            warmup = 100,
            cooldown = 1000 // ms
        } = config;

        // Warm-up phase
        for (let i = 0; i < warmup; i++) {
            await task();
        }

        const results = [];
        let totalMemory = 0;
        let peakMemory = 0;

        // Main benchmark phase
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const startMemory = process.memoryUsage().heapUsed;

            await task();

            const endMemory = process.memoryUsage().heapUsed;
            const duration = performance.now() - start;
            const memoryUsed = endMemory - startMemory;

            results.push({ duration, memoryUsed });
            totalMemory += memoryUsed;
            peakMemory = Math.max(peakMemory, memoryUsed);

            // Cool-down between iterations
            if (cooldown > 0) {
                await new Promise(resolve => setTimeout(resolve, cooldown));
            }
        }

        // Calculate statistics
        const durations = results.map(r => r.duration);
        const stats = this.calculateStats(durations);
        
        this.results.set('task-processing', {
            mean: stats.mean,
            median: stats.median,
            stdDev: stats.stdDev,
            min: stats.min,
            max: stats.max,
            memoryStats: {
                average: totalMemory / iterations,
                peak: peakMemory
            },
            timestamp: new Date()
        });

        return this.results.get('task-processing');
    }

    /**
     * Runs a swarm scaling benchmark
     * @param {object} swarm - NS-HDR swarm instance
     * @param {object} config - Benchmark configuration
     * @returns {object} Benchmark results
     */
    async runSwarmBenchmark(swarm, config = {}) {
        const {
            maxNodes = 100,
            stepSize = 10,
            tasksPerNode = 100,
            complexity = 'medium'
        } = config;

        const results = new Map();

        // Test different swarm sizes
        for (let nodes = stepSize; nodes <= maxNodes; nodes += stepSize) {
            // Configure swarm size
            await swarm.resize(nodes);
            
            // Generate test workload
            const workload = this.generateWorkload(nodes * tasksPerNode, complexity);
            
            // Measure performance
            const start = performance.now();
            await swarm.processWorkload(workload);
            const duration = performance.now() - start;

            // Get swarm metrics
            const metrics = await swarm.getMetrics();
            
            results.set(nodes, {
                throughput: (nodes * tasksPerNode) / (duration / 1000),
                latency: duration / (nodes * tasksPerNode),
                resourceUtilization: metrics.resourceUtilization,
                networkEfficiency: metrics.networkEfficiency,
                timestamp: new Date()
            });
        }

        this.swarmMetrics = results;
        return Object.fromEntries(results);
    }

    /**
     * Generates a test workload
     * @private
     * @param {number} size - Number of tasks
     * @param {string} complexity - Workload complexity
     * @returns {Array} Generated workload
     */
    generateWorkload(size, complexity = 'medium') {
        const workload = [];
        const complexityFactors = {
            low: 1000,
            medium: 10000,
            high: 100000
        };

        for (let i = 0; i < size; i++) {
            workload.push({
                data: new Array(complexityFactors[complexity]).fill(Math.random()),
                operations: this.generateOperations(complexity)
            });
        }

        return workload;
    }

    /**
     * Generates quantum operations for the workload
     * @private
     * @param {string} complexity - Operation complexity
     * @returns {Array} Generated operations
     */
    generateOperations(complexity) {
        const operations = [];
        const counts = {
            low: 5,
            medium: 15,
            high: 30
        };

        for (let i = 0; i < counts[complexity]; i++) {
            operations.push({
                type: this.getRandomOperation(),
                parameters: this.generateParameters()
            });
        }

        return operations;
    }

    /**
     * Gets a random quantum operation type
     * @private
     * @returns {string} Operation type
     */
    getRandomOperation() {
        const operations = [
            'superposition',
            'entanglement',
            'interference',
            'measurement'
        ];
        return operations[Math.floor(Math.random() * operations.length)];
    }

    /**
     * Generates random operation parameters
     * @private
     * @returns {object} Operation parameters
     */
    generateParameters() {
        return {
            amplitude: Math.random(),
            phase: Math.random() * 2 * Math.PI,
            precision: 0.001 + Math.random() * 0.099
        };
    }

    /**
     * Calculates statistical metrics
     * @private
     * @param {Array} data - Data points
     * @returns {object} Statistical metrics
     */
    calculateStats(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        const median = sorted[Math.floor(data.length / 2)];

        const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(variance);

        return {
            mean,
            median,
            stdDev,
            min: sorted[0],
            max: sorted[sorted.length - 1]
        };
    }

    /**
     * Exports benchmark results to markdown
     * @returns {string} Markdown formatted results
     */
    exportToMarkdown() {
        let markdown = '# N-HDR Benchmark Results\n\n';

        // Task Processing Results
        if (this.results.has('task-processing')) {
            const taskResults = this.results.get('task-processing');
            markdown += '## Task Processing Performance\n\n';
            markdown += '| Metric | Value |\n|--------|-------|\n';
            markdown += `| Mean Duration | ${taskResults.mean.toFixed(2)}ms |\n`;
            markdown += `| Median Duration | ${taskResults.median.toFixed(2)}ms |\n`;
            markdown += `| Standard Deviation | ${taskResults.stdDev.toFixed(2)}ms |\n`;
            markdown += `| Min Duration | ${taskResults.min.toFixed(2)}ms |\n`;
            markdown += `| Max Duration | ${taskResults.max.toFixed(2)}ms |\n`;
            markdown += `| Average Memory | ${(taskResults.memoryStats.average / 1024 / 1024).toFixed(2)}MB |\n`;
            markdown += `| Peak Memory | ${(taskResults.memoryStats.peak / 1024 / 1024).toFixed(2)}MB |\n\n`;
        }

        // Swarm Scaling Results
        if (this.swarmMetrics.size > 0) {
            markdown += '## Swarm Scaling Performance\n\n';
            markdown += '| Nodes | Throughput (tasks/s) | Latency (ms/task) | Resource Utilization | Network Efficiency |\n';
            markdown += '|-------|-------------------|----------------|-------------------|------------------|\n';

            for (const [nodes, metrics] of this.swarmMetrics) {
                markdown += `| ${nodes} | ${metrics.throughput.toFixed(2)} | ${metrics.latency.toFixed(2)} | ${(metrics.resourceUtilization * 100).toFixed(1)}% | ${(metrics.networkEfficiency * 100).toFixed(1)}% |\n`;
            }
        }

        return markdown;
    }
}

module.exports = BenchmarkingSuite;