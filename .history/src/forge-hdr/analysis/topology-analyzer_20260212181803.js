/**
 * Topology Analyzer
 * Analyzes cluster topology and dependency relationships
 */

const { EventEmitter } = require("events");

class TopologyAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      kubernetesClient: config.kubernetesClient,
      prometheusClient: config.prometheusClient,
      analysisInterval: config.analysisInterval || 30000, // 30 seconds
      depthLimit: config.depthLimit || 10,
      ...config,
    };

    this.topology = {
      nodes: [],
      pods: [],
      services: [],
      deployments: [],
      statefulsets: [],
      daemonsets: [],
      jobs: [],
      edges: [], // Network connections
      clusters: [], // Groupings by domain/team
    };

    this.dependencies = new Map(); // Pod -> depends on -> [Pods]
    this.criticalPaths = [];
    this.bottlenecks = [];
  }

  /**
   * Start topology analysis
   */
  async start() {
    console.log("Topology analyzer started");
    this.emit("started");

    // Initial analysis
    await this.analyzeTopology();

    // Schedule periodic analysis
    this.analysisInterval = setInterval(() => {
      this.analyzeTopology().catch((error) => {
        console.error("Error analyzing topology:", error);
      });
    }, this.config.analysisInterval);
  }

  /**
   * Stop topology analysis
   */
  async stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    console.log("Topology analyzer stopped");
    this.emit("stopped");
  }

  /**
   * Perform full topology analysis
   */
  async analyzeTopology() {
    try {
      // Fetch current cluster state
      const rawTopology =
        await this.config.kubernetesClient.getCurrentTopology();

      // Process topology
      this.topology = this.processTopology(rawTopology);

      // Analyze dependencies
      this.dependencies = this.analyzeDependencies(rawTopology);

      // Find critical paths
      this.criticalPaths = this.findCriticalPaths();

      // Identify bottlenecks
      this.bottlenecks = this.identifyBottlenecks();

      // Calculate resilience metrics
      const resilience = this.calculateResilience();

      this.emit("analysisComplete", {
        nodeCount: this.topology.nodes.length,
        podCount: this.topology.pods.length,
        serviceCount: this.topology.services.length,
        dependencyCount: this.dependencies.size,
        criticalPathCount: this.criticalPaths.length,
        bottleneckCount: this.bottlenecks.length,
        resilience,
      });
    } catch (error) {
      console.error("Error during topology analysis:", error);
      this.emit("analysisFailed", { error: error.message });
    }
  }

  /**
   * Process raw topology into structured format
   */
  processTopology(rawTopology) {
    return {
      nodes: (rawTopology.nodes || []).map((node) => ({
        name: node.name,
        status: node.status,
        capacity: node.capacity,
        allocatable: node.allocatable,
        labels: node.labels,
        taints: node.taints || [],
        conditions: node.conditions || [],
        roles: node.roles || [],
        zone: node.labels?.["topology.kubernetes.io/zone"] || "unknown",
      })),

      pods: (rawTopology.pods || []).map((pod) => ({
        name: pod.name,
        namespace: pod.namespace,
        status: pod.phase,
        restartCount: pod.restartCount || 0,
        node: pod.node,
        containers: pod.containers || [],
        labels: pod.labels,
        owner: pod.owner,
        requests: this.aggregatePodResources(pod.containers, "requests"),
        limits: this.aggregatePodResources(pod.containers, "limits"),
        startTime: pod.startTime,
      })),

      services: (rawTopology.services || []).map((service) => ({
        name: service.name,
        namespace: service.namespace,
        type: service.type,
        selector: service.selector,
        ports: service.ports || [],
        externalIP: service.externalIP,
        clusterIP: service.clusterIP,
      })),

      deployments: (rawTopology.deployments || []).map((dep) => ({
        name: dep.name,
        namespace: dep.namespace,
        replicas: dep.replicas,
        selector: dep.selector,
        template: dep.template,
        updateTime: dep.updateTime,
      })),

      statefulsets: (rawTopology.statefulsets || []).map((sts) => ({
        name: sts.name,
        namespace: sts.namespace,
        replicas: sts.replicas,
        serviceName: sts.serviceName,
      })),

      daemonsets: (rawTopology.daemonsets || []).map((ds) => ({
        name: ds.name,
        namespace: ds.namespace,
        selector: ds.selector,
      })),

      jobs: (rawTopology.jobs || []).map((job) => ({
        name: job.name,
        namespace: job.namespace,
        status: job.status,
        parallelism: job.parallelism,
      })),
    };
  }

  /**
   * Aggregate pod resource requests/limits
   */
  aggregatePodResources(containers, type) {
    let cpu = 0;
    let memory = 0;

    for (const container of containers) {
      const resources = container[type] || {};
      cpu += this.parseResource(resources.cpu || "0");
      memory += this.parseResource(resources.memory || "0", true);
    }

    return { cpu, memory };
  }

  /**
   * Parse resource string (e.g., "100m" -> 0.1)
   */
  parseResource(value, isMemory = false) {
    if (typeof value === "number") return value;

    const str = value.toString().toLowerCase();

    if (isMemory) {
      if (str.endsWith("mi")) return parseFloat(str) / 1024; // Convert Mi to Gi
      if (str.endsWith("gi")) return parseFloat(str);
      if (str.endsWith("ki")) return parseFloat(str) / (1024 * 1024);
    } else {
      if (str.endsWith("m")) return parseFloat(str) / 1000;
      if (str.endsWith("n")) return parseFloat(str) / 1e9;
    }

    return parseFloat(str);
  }

  /**
   * Analyze dependencies between pods
   */
  analyzeDependencies(rawTopology) {
    const dependencies = new Map();

    // Network policy analysis
    for (const pod of rawTopology.pods || []) {
      const podKey = `${pod.namespace}/${pod.name}`;
      const deps = new Set();

      // DNS dependencies (pods that call other pods)
      for (const container of pod.containers || []) {
        const env = container.env || {};
        for (const [key, value] of Object.entries(env)) {
          // Look for service references
          if (value && value.includes(".svc.cluster.local")) {
            deps.add(value);
          }
        }
      }

      if (deps.size > 0) {
        dependencies.set(podKey, Array.from(deps));
      }
    }

    // Service dependency analysis
    for (const service of rawTopology.services || []) {
      const selector = service.selector || {};
      const matchingPods = (rawTopology.pods || []).filter((pod) => {
        for (const [key, value] of Object.entries(selector)) {
          if (pod.labels?.[key] !== value) return false;
        }
        return true;
      });

      for (const pod of matchingPods) {
        const podKey = `${pod.namespace}/${pod.name}`;
        if (!dependencies.has(podKey)) {
          dependencies.set(podKey, []);
        }
      }
    }

    return dependencies;
  }

  /**
   * Find critical paths (chains of dependencies)
   */
  findCriticalPaths() {
    const paths = [];
    const visited = new Set();

    for (const [pod, deps] of this.dependencies) {
      if (visited.has(pod)) continue;

      const path = this.buildDependencyPath(pod, new Set(), [pod]);
      if (path.length > 1) {
        // Only consider paths with actual dependencies
        paths.push({
          startPod: pod,
          path,
          length: path.length,
          criticality: path.length, // Longer paths are more critical
        });

        path.forEach((p) => visited.add(p));
      }
    }

    // Sort by criticality
    return paths.sort((a, b) => b.criticality - a.criticality);
  }

  /**
   * Build dependency path recursively
   */
  buildDependencyPath(pod, visited, path, depth = 0) {
    if (depth >= this.config.depthLimit) return path;

    const deps = this.dependencies.get(pod) || [];

    for (const dep of deps) {
      if (visited.has(dep)) continue;

      visited.add(dep);
      path.push(dep);

      this.buildDependencyPath(dep, visited, path, depth + 1);
    }

    return path;
  }

  /**
   * Identify bottlenecks (nodes/services with high connection count)
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    const connectionCount = new Map();

    // Count incoming connections
    for (const [pod, deps] of this.dependencies) {
      for (const dep of deps) {
        const count = connectionCount.get(dep) || 0;
        connectionCount.set(dep, count + 1);
      }
    }

    // Find highly connected nodes
    for (const [pod, count] of connectionCount) {
      if (count >= 5) {
        // Pod is depended on by 5+ other pods
        bottlenecks.push({
          pod,
          incomingConnections: count,
          criticality: count,
          riskLevel: count >= 10 ? "CRITICAL" : count >= 5 ? "HIGH" : "MEDIUM",
        });
      }
    }

    return bottlenecks.sort((a, b) => b.criticality - a.criticality);
  }

  /**
   * Calculate resilience metrics
   */
  calculateResilience() {
    const metrics = {
      criticalPathCount: this.criticalPaths.length,
      bottleneckCount: this.bottlenecks.length,
      singlePointsOfFailure: this.identifySinglePointsOfFailure(),
      redundancy: this.calculateRedundancy(),
      isolated: this.findIsolatedPods(),
    };

    // Calculate overall resilience score (0-100)
    let score = 100;

    // Deduct for single points of failure
    score -= metrics.singlePointsOfFailure.length * 10;

    // Deduct for bottlenecks
    score -= Math.min(this.bottlenecks.length * 5, 30);

    // Add bonus for redundancy
    score += metrics.redundancy * 10;

    metrics.resilienceScore = Math.max(0, Math.min(100, score));

    return metrics;
  }

  /**
   * Identify single points of failure
   */
  identifySinglePointsOfFailure() {
    const spof = [];

    for (const bottleneck of this.bottlenecks) {
      if (bottleneck.riskLevel === "CRITICAL") {
        // Check if there are replicas
        const podName = bottleneck.pod.split("/")[1];
        const replicas = this.topology.pods.filter((p) =>
          p.name.startsWith(podName.split("-").slice(0, -1).join("-")),
        ).length;

        if (replicas === 1) {
          spof.push({
            pod: bottleneck.pod,
            reason: "No replicas",
            affectedDependents: bottleneck.incomingConnections,
          });
        }
      }
    }

    return spof;
  }

  /**
   * Calculate redundancy (replicated workloads)
   */
  calculateRedundancy() {
    let replicatedCount = 0;
    const seen = new Set();

    for (const pod of this.topology.pods) {
      const basename = pod.name.replace(/-[a-z0-9]+$/, ""); // Remove hash suffix

      if (seen.has(basename)) {
        replicatedCount++;
      }
      seen.add(basename);
    }

    return replicatedCount / Math.max(this.topology.pods.length, 1);
  }

  /**
   * Find isolated pods (no dependencies)
   */
  findIsolatedPods() {
    const isolated = [];

    for (const pod of this.topology.pods) {
      const key = `${pod.namespace}/${pod.name}`;
      const hasDeps = this.dependencies.has(key);
      const isDepended = Array.from(this.dependencies.values()).some((deps) =>
        deps.includes(key),
      );

      if (!hasDeps && !isDepended) {
        isolated.push({
          pod: key,
          namespace: pod.namespace,
          name: pod.name,
        });
      }
    }

    return isolated;
  }

  /**
   * Get topology summary
   */
  getSummary() {
    return {
      cluster: {
        nodeCount: this.topology.nodes.length,
        podCount: this.topology.pods.length,
        serviceCount: this.topology.services.length,
        deploymentCount: this.topology.deployments.length,
      },
      dependencies: {
        totalDependencies: this.dependencies.size,
        avgConnectionsPerPod:
          this.topology.pods.length > 0
            ? Array.from(this.dependencies.values()).reduce(
                (sum, deps) => sum + deps.length,
                0,
              ) / this.topology.pods.length
            : 0,
      },
      criticalPaths: {
        count: this.criticalPaths.length,
        longestPath: this.criticalPaths[0]?.length || 0,
      },
      bottlenecks: {
        count: this.bottlenecks.length,
        mostConnected: this.bottlenecks[0]?.incomingConnections || 0,
      },
      resilience: this.calculateResilience(),
    };
  }

  /**
   * Export topology for visualization
   */
  exportForVisualization() {
    const nodes = [];
    const links = [];

    // Create nodes
    for (const pod of this.topology.pods) {
      nodes.push({
        id: `${pod.namespace}/${pod.name}`,
        label: pod.name,
        group: pod.namespace,
        type: "pod",
        status: pod.status,
        containerCount: pod.containers?.length || 0,
      });
    }

    // Create links from dependencies
    for (const [source, targets] of this.dependencies) {
      for (const target of targets) {
        links.push({
          source,
          target,
          type: "depends",
        });
      }
    }

    return { nodes, links };
  }
}

module.exports = { TopologyAnalyzer };
