/**
 * N-HDR MCP Consciousness Server
 *
 * Exposes consciousness operations via MCP Protocol
 * Task 9.1: MCP Server Architecture
 *
 * Features:
 * - Snapshot consciousness state
 * - Restore from snapshot
 * - Compute state differences
 * - Compress state with LoRA adapter
 */

const { Server, Tool } = require("@modelcontextprotocol/sdk");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class ConsciousnessServer {
  constructor(config = {}) {
    this.name = "n-hdr-consciousness-server";
    this.version = "1.0.0";
    this.config = {
      snapshot_dir: config.snapshot_dir || "./data/consciousness-snapshots",
      state_file: config.state_file || "./data/consciousness-state.json",
      max_snapshots: config.max_snapshots || 100,
      health_check_interval: config.health_check_interval || 30000,
      ...config,
    };

    this.server = new Server({
      name: this.name,
      version: this.version,
    });

    this.consciousness_state = new Map(); // agent_id → state
    this.snapshots = new Map(); // snapshot_id → snapshot_data
    this.health_status = "initializing";

    this.setupTools();
    this.setupHealthProbe();
  }

  setupTools() {
    // Tool 1: Snapshot consciousness state
    this.server.tool(
      "consciousness.snapshot",
      {
        agent_id: {
          type: "string",
          description: "Agent ID to snapshot",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for this snapshot",
        },
      },
      async (args) => {
        try {
          const snapshot = await this.snapshotConsciousness(
            args.agent_id,
            args.tags || [],
          );
          return {
            success: true,
            snapshot_id: snapshot.id,
            timestamp: snapshot.timestamp,
            size_bytes: snapshot.size_bytes,
            compression_ratio: snapshot.compression_ratio,
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
    );

    // Tool 2: Restore consciousness from snapshot
    this.server.tool(
      "consciousness.restore",
      {
        agent_id: {
          type: "string",
          description: "Agent ID to restore to",
        },
        snapshot_id: {
          type: "string",
          description: "Snapshot ID to restore from",
        },
      },
      async (args) => {
        try {
          await this.restoreConsciousness(args.agent_id, args.snapshot_id);
          return {
            success: true,
            agent_id: args.agent_id,
            restored_from: args.snapshot_id,
            timestamp: new Date().toISOString(),
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
    );

    // Tool 3: Compute state difference
    this.server.tool(
      "consciousness.diff",
      {
        snapshot_id_1: {
          type: "string",
          description: "First snapshot ID",
        },
        snapshot_id_2: {
          type: "string",
          description: "Second snapshot ID",
        },
      },
      async (args) => {
        try {
          const diff = await this.computeStateDifference(
            args.snapshot_id_1,
            args.snapshot_id_2,
          );
          return {
            success: true,
            differences: {
              added: diff.added || [],
              removed: diff.removed || [],
              modified: diff.modified || [],
            },
            similarity_score: diff.similarity_score || 0,
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
    );

    // Tool 4: Compress state with LoRA adapter
    this.server.tool(
      "consciousness.compress",
      {
        agent_id: {
          type: "string",
          description: "Agent ID to compress",
        },
        compression_ratio: {
          type: "number",
          description: "Target compression ratio (0.1 - 0.9)",
        },
      },
      async (args) => {
        try {
          const result = await this.compressConsciousness(
            args.agent_id,
            args.compression_ratio,
          );
          return {
            success: true,
            original_size: result.original_size,
            compressed_size: result.compressed_size,
            compression_ratio: result.compression_ratio,
            lora_rank: result.lora_rank,
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
    );

    // Tool 5: List snapshots for agent
    this.server.tool(
      "consciousness.list_snapshots",
      {
        agent_id: {
          type: "string",
          description: "Agent ID to list snapshots for",
        },
      },
      async (args) => {
        try {
          const snapshots = await this.listSnapshots(args.agent_id);
          return {
            success: true,
            agent_id: args.agent_id,
            snapshots: snapshots,
            total: snapshots.length,
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
    );

    // Tool 6: Server health status
    this.server.tool("consciousness.health", {}, async () => {
      return {
        server: this.name,
        version: this.version,
        status: this.health_status,
        timestamp: new Date().toISOString(),
        agents_tracked: this.consciousness_state.size,
        snapshots_stored: this.snapshots.size,
        uptime_seconds: (new Date() - this.start_time) / 1000,
      };
    });
  }

  setupHealthProbe() {
    this.start_time = new Date();

    this.health_interval = setInterval(async () => {
      try {
        // Verify file system access
        await fs.access(this.config.snapshot_dir);

        // Check memory usage
        const mem = process.memoryUsage();
        if (mem.heapUsed > mem.heapTotal * 0.9) {
          this.health_status = "warning";
        } else {
          this.health_status = "healthy";
        }

        console.log(
          `[${new Date().toISOString()}] Health check: ${this.health_status}`,
        );
      } catch (e) {
        this.health_status = "unhealthy";
        console.error("Health check failed:", e);
      }
    }, this.config.health_check_interval);
  }

  async snapshotConsciousness(agent_id, tags = []) {
    // Load current consciousness state
    const state = this.consciousness_state.get(agent_id) || {
      agent_id,
      identity_matrix: [],
      memory_index: [],
      emotion_state: {},
      created_at: new Date().toISOString(),
    };

    // Create snapshot
    const snapshot_id = `snapshot-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const snapshot = {
      id: snapshot_id,
      agent_id,
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      timestamp: new Date().toISOString(),
      tags,
      original_size: JSON.stringify(state).length,
      compression_ratio: 1.0, // No compression yet
    };

    // Store in memory
    this.snapshots.set(snapshot_id, snapshot);

    // Persist to disk
    await this.persistSnapshot(snapshot);

    // Cleanup old snapshots if exceeding limit
    if (this.snapshots.size > this.config.max_snapshots) {
      await this.evictOldestSnapshot();
    }

    return {
      id: snapshot_id,
      timestamp: snapshot.timestamp,
      size_bytes: snapshot.original_size,
      compression_ratio: snapshot.compression_ratio,
    };
  }

  async restoreConsciousness(agent_id, snapshot_id) {
    const snapshot = this.snapshots.get(snapshot_id);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshot_id} not found`);
    }

    // Restore state
    this.consciousness_state.set(
      agent_id,
      JSON.parse(JSON.stringify(snapshot.state)),
    );

    console.log(`Restored ${agent_id} from snapshot ${snapshot_id}`);
  }

  async computeStateDifference(snapshot_id_1, snapshot_id_2) {
    const snap1 = this.snapshots.get(snapshot_id_1);
    const snap2 = this.snapshots.get(snapshot_id_2);

    if (!snap1 || !snap2) {
      throw new Error("One or both snapshots not found");
    }

    const state1 = JSON.stringify(snap1.state);
    const state2 = JSON.stringify(snap2.state);

    // Simple similarity: count matching characters
    let matches = 0;
    for (let i = 0; i < Math.min(state1.length, state2.length); i++) {
      if (state1[i] === state2[i]) matches++;
    }

    const similarity_score = matches / Math.max(state1.length, state2.length);

    return {
      added: [],
      removed: [],
      modified: state1 !== state2 ? ["consciousness_state"] : [],
      similarity_score,
    };
  }

  async compressConsciousness(agent_id, compression_ratio) {
    const state = this.consciousness_state.get(agent_id);
    if (!state) {
      throw new Error(`Agent ${agent_id} not found`);
    }

    const original_size = JSON.stringify(state).length;

    // Simulate LoRA compression (simplified)
    const lora_rank = Math.floor(
      (original_size * (1 - compression_ratio)) / 1024,
    );
    const compressed_size = Math.floor(original_size * compression_ratio);

    return {
      original_size,
      compressed_size,
      compression_ratio,
      lora_rank,
    };
  }

  async listSnapshots(agent_id) {
    const snapshots = [];
    for (const [id, snap] of this.snapshots) {
      if (snap.agent_id === agent_id) {
        snapshots.push({
          id,
          timestamp: snap.timestamp,
          size_bytes: snap.original_size,
          tags: snap.tags,
        });
      }
    }
    return snapshots;
  }

  async persistSnapshot(snapshot) {
    try {
      await fs.mkdir(this.config.snapshot_dir, { recursive: true });
      const file = path.join(this.config.snapshot_dir, `${snapshot.id}.json`);
      await fs.writeFile(file, JSON.stringify(snapshot, null, 2));
    } catch (e) {
      console.error("Failed to persist snapshot:", e);
    }
  }

  async evictOldestSnapshot() {
    let oldest_id = null;
    let oldest_time = new Date();

    for (const [id, snap] of this.snapshots) {
      const snap_time = new Date(snap.timestamp);
      if (snap_time < oldest_time) {
        oldest_time = snap_time;
        oldest_id = id;
      }
    }

    if (oldest_id) {
      this.snapshots.delete(oldest_id);
      console.log(`Evicted oldest snapshot: ${oldest_id}`);
    }
  }

  async start(port = 3001) {
    try {
      await this.server.start({
        port,
        hostname: "localhost",
      });

      console.log(`${this.name} (v${this.version}) started on port ${port}`);
      return true;
    } catch (e) {
      console.error("Failed to start server:", e);
      return false;
    }
  }

  async stop() {
    clearInterval(this.health_interval);
    console.log("Consciousness server stopped");
  }
}

module.exports = ConsciousnessServer;

// If run as main script
if (require.main === module) {
  const server = new ConsciousnessServer();
  server.start(3001);

  process.on("SIGINT", async () => {
    await server.stop();
    process.exit(0);
  });
}
