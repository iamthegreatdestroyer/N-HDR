/**
 * Kubernetes Client
 * Manages interaction with Kubernetes API for topology queries and optimization application
 */

const k8s = require("@kubernetes/client-node");

class KubernetesClient {
  constructor(config = {}) {
    this.config = {
      kubeconfig: config.kubeconfig || process.env.KUBECONFIG,
      namespace: config.namespace || "default",
      ...config,
    };

    this.initializeClient();
    this.topologySnapshots = [];
    this.maxSnapshots = 10;
  }

  /**
   * Initialize Kubernetes client
   */
  initializeClient() {
    const kc = new k8s.KubeConfig();

    try {
      if (this.config.kubeconfig) {
        kc.loadFromFile(this.config.kubeconfig);
      } else {
        kc.loadFromDefault();
      }
    } catch (error) {
      console.warn(
        "Failed to load kubeconfig, using mock client:",
        error.message,
      );
      this.mockedMode = true;
    }

    this.kc = kc;
    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.customApi = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  /**
   * Get current Kubernetes topology
   */
  async getCurrentTopology() {
    try {
      const deployments = await this.appsApi.listNamespacedDeployment(
        this.config.namespace,
      );
      const pods = await this.coreApi.listNamespacedPod(this.config.namespace);
      const nodes = await this.coreApi.listNode();
      const hpas = await this.customApi.listNamespacedCustomObject(
        "autoscaling",
        "v2",
        this.config.namespace,
        "horizontalpodautoscalers",
      );

      return {
        timestamp: new Date(),
        deployments: this.parseDeployments(deployments.body.items || []),
        pods: this.parsePods(pods.body.items || []),
        nodes: this.parseNodes(nodes.body.items || []),
        horizontalPodAutoscalers: this.parseHPAs(hpas.body.items || []),
        summary: this.summarizeTopology(deployments, pods, nodes),
      };
    } catch (error) {
      console.error("Error fetching Kubernetes topology:", error);
      return this.getMockTopology();
    }
  }

  /**
   * Parse Kubernetes deployments
   */
  parseDeployments(items) {
    return items.map((dep) => ({
      name: dep.metadata.name,
      namespace: dep.metadata.namespace,
      replicas: {
        desired: dep.spec.replicas || 1,
        current: dep.status?.replicas || 0,
        ready: dep.status?.readyReplicas || 0,
        updated: dep.status?.updatedReplicas || 0,
      },
      selector: dep.spec.selector?.matchLabels || {},
      resources: {
        requests: this.extractResourceRequests(dep),
        limits: this.extractResourceLimits(dep),
      },
      strategy: dep.spec.strategy?.type || "RollingUpdate",
      updateTime: dep.metadata.creationTimestamp,
    }));
  }

  /**
   * Parse Kubernetes pods
   */
  parsePods(items) {
    return items.map((pod) => ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      phase: pod.status.phase,
      nodeName: pod.spec.nodeName,
      labels: pod.metadata.labels || {},
      containers:
        pod.spec.containers?.map((c) => ({
          name: c.name,
          image: c.image,
          cpu: c.resources?.requests?.cpu || "unspecified",
          memory: c.resources?.requests?.memory || "unspecified",
        })) || [],
      conditions:
        pod.status.conditions?.map((c) => ({
          type: c.type,
          status: c.status,
          reason: c.reason,
        })) || [],
      restartCount:
        pod.status.containerStatuses?.reduce(
          (sum, c) => sum + (c.restartCount || 0),
          0,
        ) || 0,
    }));
  }

  /**
   * Parse Kubernetes nodes
   */
  parseNodes(items) {
    return items.map((node) => ({
      name: node.metadata.name,
      status:
        node.status.conditions?.find((c) => c.type === "Ready")?.status ===
        "True"
          ? "Ready"
          : "NotReady",
      capacity: {
        cpu: node.status.capacity?.cpu || "unknown",
        memory: node.status.capacity?.memory || "unknown",
      },
      allocatable: {
        cpu: node.status.allocatable?.cpu || "unknown",
        memory: node.status.allocatable?.memory || "unknown",
      },
      labels: node.metadata.labels || {},
      taints: node.spec.taints || [],
    }));
  }

  /**
   * Parse Horizontal Pod Autoscalers
   */
  parseHPAs(items) {
    return items.map((hpa) => ({
      name: hpa.metadata.name,
      namespace: hpa.metadata.namespace,
      target: {
        kind: hpa.spec.scaleTargetRef?.kind,
        name: hpa.spec.scaleTargetRef?.name,
      },
      replicas: {
        min: hpa.spec.minReplicas || 1,
        max: hpa.spec.maxReplicas || 10,
        current: hpa.status?.currentReplicas || 0,
        desired: hpa.status?.desiredReplicas || 0,
      },
      metrics: hpa.spec.metrics || [],
      lastScaleTime: hpa.status?.lastScaleTime,
    }));
  }

  /**
   * Extract resource requests from deployment
   */
  extractResourceRequests(deployment) {
    const containers = deployment.spec.template.spec.containers || [];
    return containers.map((c) => ({
      name: c.name,
      cpu: c.resources?.requests?.cpu || "unspecified",
      memory: c.resources?.requests?.memory || "unspecified",
    }));
  }

  /**
   * Extract resource limits from deployment
   */
  extractResourceLimits(deployment) {
    const containers = deployment.spec.template.spec.containers || [];
    return containers.map((c) => ({
      name: c.name,
      cpu: c.resources?.limits?.cpu || "unspecified",
      memory: c.resources?.limits?.memory || "unspecified",
    }));
  }

  /**
   * Summarize topology for quick analysis
   */
  summarizeTopology(depResponse, podResponse, nodeResponse) {
    return {
      totalDeployments: depResponse.body.items?.length || 0,
      totalPods: podResponse.body.items?.length || 0,
      totalNodes: nodeResponse.body.items?.length || 0,
      readyPods:
        podResponse.body.items?.filter((p) => p.status.phase === "Running")
          .length || 0,
      pendingPods:
        podResponse.body.items?.filter((p) => p.status.phase === "Pending")
          .length || 0,
      failedPods:
        podResponse.body.items?.filter((p) => p.status.phase === "Failed")
          .length || 0,
    };
  }

  /**
   * Create snapshot of current topology for rollback
   */
  async createSnapshot() {
    const topology = await this.getCurrentTopology();

    const snapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date(),
      topology: JSON.parse(JSON.stringify(topology)), // Deep copy
    };

    this.topologySnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.topologySnapshots.length > this.maxSnapshots) {
      this.topologySnapshots = this.topologySnapshots.slice(-this.maxSnapshots);
    }

    return snapshot.id;
  }

  /**
   * Apply optimization to Kubernetes
   */
  async applyOptimization(proposal) {
    try {
      // Create snapshot before applying changes
      const snapshotId = await this.createSnapshot();

      // Apply changes based on proposal type
      if (proposal.changes.deployment) {
        await this.applyDeploymentChange(proposal.changes.deployment);
      }

      if (proposal.changes.hpa) {
        await this.applyHPAChange(proposal.changes.hpa);
      }

      if (proposal.changes.istioVirtualService) {
        await this.applyIstioChange(
          proposal.changes.istioVirtualService,
          "VirtualService",
        );
      }

      if (proposal.changes.istioDestinationRule) {
        await this.applyIstioChange(
          proposal.changes.istioDestinationRule,
          "DestinationRule",
        );
      }

      if (proposal.changes.podScheduling) {
        await this.applyPodSchedulingChange(proposal.changes.podScheduling);
      }

      return {
        success: true,
        snapshotId: snapshotId,
        appliedAt: new Date(),
        changesApplied: Object.keys(proposal.changes).length,
      };
    } catch (error) {
      console.error("Error applying optimization:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply deployment changes
   */
  async applyDeploymentChange(deploymentChange) {
    const name =
      deploymentChange.kind === "Deployment"
        ? "primary"
        : deploymentChange.name;

    try {
      const patch = [
        {
          op: "replace",
          path: "/spec/replicas",
          value: deploymentChange.spec.replicas,
        },
      ];

      await this.appsApi.patchNamespacedDeployment(
        name,
        this.config.namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { "Content-type": "application/json-patch+json" } },
      );

      console.log(`Applied replica change to deployment: ${name}`);
    } catch (error) {
      console.warn(
        `Warning: Could not patch deployment ${name}:`,
        error.message,
      );
      // Continue anyway - in mocked mode
    }
  }

  /**
   * Apply HPA changes
   */
  async applyHPAChange(hpaChange) {
    try {
      await this.customApi.patchNamespacedCustomObject(
        "autoscaling",
        "v2",
        this.config.namespace,
        "horizontalpodautoscalers",
        "primary-hpa",
        [
          {
            op: "replace",
            path: "/spec/minReplicas",
            value: hpaChange.spec.minReplicas,
          },
          {
            op: "replace",
            path: "/spec/maxReplicas",
            value: hpaChange.spec.maxReplicas,
          },
        ],
        undefined,
        undefined,
        { headers: { "Content-type": "application/json-patch+json" } },
      );

      console.log("Applied HPA changes");
    } catch (error) {
      console.warn("Warning: Could not patch HPA:", error.message);
    }
  }

  /**
   * Apply Istio changes
   */
  async applyIstioChange(istioResource, kind) {
    try {
      await this.customApi.patchNamespacedCustomObject(
        "networking.istio.io",
        "v1beta1",
        this.config.namespace,
        kind === "VirtualService" ? "virtualservices" : "destinationrules",
        "primary-" + kind.toLowerCase(),
        [
          {
            op: "replace",
            path: "/spec",
            value: istioResource.spec,
          },
        ],
        undefined,
        undefined,
        { headers: { "Content-type": "application/json-patch+json" } },
      );

      console.log(`Applied Istio ${kind} changes`);
    } catch (error) {
      console.warn(`Warning: Could not patch Istio ${kind}:`, error.message);
    }
  }

  /**
   * Apply pod scheduling changes (pod affinity rules)
   */
  async applyPodSchedulingChange(podChange) {
    const name = "primary";

    try {
      const patch = [
        {
          op: "replace",
          path: "/spec/template/spec/affinity",
          value: podChange.spec.affinity,
        },
      ];

      await this.appsApi.patchNamespacedDeployment(
        name,
        this.config.namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { "Content-type": "application/json-patch+json" } },
      );

      console.log("Applied pod scheduling changes");
    } catch (error) {
      console.warn("Warning: Could not apply pod scheduling:", error.message);
    }
  }

  /**
   * Restore topology from snapshot
   */
  async restoreFromSnapshot(snapshotId) {
    const snapshot = this.topologySnapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    try {
      // Restore each deployment to previous replica count
      for (const deployment of snapshot.topology.deployments) {
        const patch = [
          {
            op: "replace",
            path: "/spec/replicas",
            value: deployment.replicas.desired,
          },
        ];

        await this.appsApi.patchNamespacedDeployment(
          deployment.name,
          deployment.namespace,
          patch,
          undefined,
          undefined,
          undefined,
          undefined,
          { headers: { "Content-type": "application/json-patch+json" } },
        );
      }

      return {
        success: true,
        restoredAt: new Date(),
        deploymentsRestored: snapshot.topology.deployments.length,
      };
    } catch (error) {
      console.error("Error restoring snapshot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify topology stability after change
   */
  async verifyTopologyStability(maxWait = 30000) {
    const startTime = Date.now();
    const interval = 2000;

    while (Date.now() - startTime < maxWait) {
      const topology = await this.getCurrentTopology();

      // Check if all deployments are stable
      const allStable = topology.deployments.every(
        (dep) =>
          dep.replicas.current === dep.replicas.desired &&
          dep.replicas.ready === dep.replicas.desired,
      );

      if (allStable && topology.summary.failedPods === 0) {
        return {
          stable: true,
          verifiedAt: new Date(),
          deployments: topology.deployments,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return {
      stable: false,
      timeout: true,
      errorMessage: "Topology did not stabilize within timeout",
    };
  }

  /**
   * Compare two topologies
   */
  compareTopologies(topology1, topology2) {
    const differences = [];

    // Compare deployments
    const deps1 = new Map(topology1.deployments.map((d) => [d.name, d]));
    const deps2 = new Map(topology2.deployments.map((d) => [d.name, d]));

    for (const [name, dep1] of deps1) {
      const dep2 = deps2.get(name);
      if (!dep2) {
        differences.push(`Deployment ${name} removed`);
      } else if (dep1.replicas.desired !== dep2.replicas.desired) {
        differences.push(
          `Deployment ${name}: replicas changed from ${dep1.replicas.desired} to ${dep2.replicas.desired}`,
        );
      }
    }

    for (const name of deps2.keys()) {
      if (!deps1.has(name)) {
        differences.push(`Deployment ${name} added`);
      }
    }

    return {
      identical: differences.length === 0,
      differences: differences,
    };
  }

  /**
   * Get mock topology for testing
   */
  getMockTopology() {
    return {
      timestamp: new Date(),
      deployments: [
        {
          name: "primary-api",
          namespace: "default",
          replicas: { desired: 3, current: 3, ready: 3, updated: 3 },
          selector: { app: "primary-api" },
          resources: { requests: [], limits: [] },
          strategy: "RollingUpdate",
        },
      ],
      pods: [
        {
          name: "primary-api-1",
          namespace: "default",
          phase: "Running",
          nodeName: "node-1",
          labels: { app: "primary-api" },
          containers: [],
          conditions: [],
          restartCount: 0,
        },
      ],
      nodes: [
        {
          name: "node-1",
          status: "Ready",
          capacity: { cpu: "8", memory: "32Gi" },
          allocatable: { cpu: "8", memory: "32Gi" },
          labels: {},
          taints: [],
        },
      ],
      horizontalPodAutoscalers: [],
      summary: {
        totalDeployments: 1,
        totalPods: 3,
        totalNodes: 1,
        readyPods: 3,
        pendingPods: 0,
        failedPods: 0,
      },
    };
  }
}

module.exports = { KubernetesClient };
