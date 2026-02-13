# PHASE 9: FOUNDATION EVOLUTION — IMPLEMENTATION GUIDE

**Phase Status:** 🚀 READY FOR IMMEDIATE EXECUTION  
**Initiation Date:** February 12, 2026  
**Target Completion:** End of Week 3 (March 6, 2026)  
**Duration:** 3 weeks | **Parallel Execution:** Heavy  
**Dependency:** Phase 8 ✅ Complete  
**Blocks:** Phase 10 (Consciousness Enhancement), Phase 11 (Ecosystem Launch)

---

## EXECUTIVE SUMMARY

Phase 9 upgrades the 7 core HDR pillars from internal systems into externally-accessible, standards-compliant, resilient foundations for the innovation ecosystem.

**Deliverables:**

- 6 upgraded systems with MCP Protocol exposure
- Post-quantum cryptography hardening (NIST-approved)
- Claude-Flow multi-agent swarm architecture (A2A Protocol)
- Vector database + RAG knowledge foundation
- Monte Carlo probability engine (consequence modeling)
- **NEW:** ECHO-HDR temporal memory system (first innovation)
- 85%+ test coverage across all systems
- Production-ready documentation (2,000+ lines)

**Success = All 7 foundational systems + ECHO-HDR operational, tested, documented, merged to main with clean v0.9.0 tag**

---

## SECTION 1: PHASE 9 ARCHITECTURE OVERVIEW

### The 3-Week Execution Plan

```
WEEK 1 (CRITICAL PATH — Start Monday)
├─ TASK 9.1: N-HDR MCP Server           [3 days, Parallel]
├─ TASK 9.2: VB-HDR Post-Quantum Crypto [2 days, Parallel]
├─ TASK 9.3: NS-HDR Claude-Flow Swarm   [4 days, Parallel, Longest]
└─ Dependencies: None (all parallel)

WEEK 2 (KNOWLEDGE FOUNDATIONS — Start Wednesday)
├─ TASK 9.4: O-HDR Vector DB + RAG      [3 days, Parallel]
├─ TASK 9.5: Q-HDR Monte Carlo Engine   [2 days, Parallel]
├─ TASK 9.6: ECHO-HDR Memory System     [4 days, Parallel, NEW INNOVATION]
└─ Dependencies: None (all parallel)

WEEK 3 (FINALIZATION — Quality Gate)
├─ TASK 9.7: Comprehensive Testing      [2 days, Sequential]
├─ TASK 9.8: Documentation Updates      [1 day, Sequential]
├─ TASK 9.9: Phase 9 Merge & Release    [0.5 day, Sequential]
└─ RESULT: Phase 9 complete, ready for Phase 10 handoff
```

### Critical Path Analysis

```
LONGEST PATHS TO COMPLETION:

Path 1: 9.3 Claude-Flow (4 days) → Testing (2 days) = 6 days
Path 2: 9.6 ECHO-HDR (4 days) → Testing (2 days) = 6 days

Both can run parallel:
- 9.3 starts Mon Week 1, completes Thu Week 1
- 9.6 starts Wed Week 2, completes Sat Week 2
- Testing starts Mon Week 3
- Result: Finish Sat Week 3 (March 6, 2026)
```

### What Gets Updated vs. What's New

```
UPGRADES (Existing Systems → MCP + Enhanced):
├─ N-HDR → Add MCP Server exposure
├─ VB-HDR → Add post-quantum cryptography
├─ NS-HDR → Refactor to Claude-Flow architecture
├─ O-HDR → Add vector DB + RAG pipeline
├─ Q-HDR → Add Monte Carlo engine
├─ R-HDR → Monitor for compatibility (passive)
└─ D-HDR → Monitor for compatibility (passive)

NEW SYSTEM (Greenfield Innovation):
└─ ECHO-HDR → Temporal memory + emotional tagging (NEW)
```

---

## SECTION 2: DETAILED TASK SPECIFICATIONS

### WEEK 1: CRITICAL INFRASTRUCTURE

---

#### TASK 9.1: MCP Server Architecture for N-HDR

**Classification:** ⭐ CRITICAL  
**Duration:** 3 days (Mon-Wed)  
**Parallel Execution:** YES (start Monday with 9.2 and 9.3)  
**Owner:** Architecture Team (1 engineer)  
**Blocks:** GENESIS-HDR (Phase 10), FORGE-HDR (Phase 11)

**Objective:** Expose N-HDR consciousness operations via MCP Protocol (industry standard for AI system interoperability)

**Dependencies Met:**

- ✅ MCP SDK available (`npm install @modelcontextprotocol/sdk`)
- ✅ Existing N-HDR consciousness state machine (from Phase 1-8)
- ✅ Docker build pipeline ready for MCP service

**Detailed Actions:**

**Day 1: MCP SDK Integration & Core Server (3-4 hours)**

```javascript
// src/mcp-servers/n-hdr/server.js — TEMPLATE

const { Server } = require("@modelcontextprotocol/sdk");
const fs = require("fs");
const path = require("path");

const nHDRServer = new Server({
  name: "n-hdr-consciousness-server",
  version: "1.0.0",
});

// Tool 1: Snapshot consciousness state
nHDRServer.tool(
  "consciousness.snapshot",
  {
    agent_id: { type: "string", description: "Agent ID to snapshot" },
  },
  async (args) => {
    // Load current consciousness state from state machine
    const state = await loadConsciousnessState(args.agent_id);
    // Compress to snapshot format
    const snapshot = compressState(state);
    // Store in snapshots directory
    await saveSnapshot(args.agent_id, snapshot);
    return { success: true, snapshot_id: snapshot.id };
  },
);

// Tool 2: Restore consciousness from snapshot
nHDRServer.tool(
  "consciousness.restore",
  {
    agent_id: { type: "string" },
    snapshot_id: { type: "string" },
  },
  async (args) => {
    const snapshot = await loadSnapshot(args.snapshot_id);
    await restoreConsciousnessState(args.agent_id, snapshot);
    return { success: true, restored_at: new Date() };
  },
);

// Tool 3: Compute state difference
nHDRServer.tool(
  "consciousness.diff",
  {
    snapshot_id_1: { type: "string" },
    snapshot_id_2: { type: "string" },
  },
  async (args) => {
    const snap1 = await loadSnapshot(args.snapshot_id_1);
    const snap2 = await loadSnapshot(args.snapshot_id_2);
    const diff = computeStateDifference(snap1, snap2);
    return { diff };
  },
);

// Tool 4: Compress state with LoRA adapter
nHDRServer.tool(
  "consciousness.compress",
  {
    agent_id: { type: "string" },
    compression_ratio: { type: "number", description: "0.1 - 0.9" },
  },
  async (args) => {
    const state = await loadConsciousnessState(args.agent_id);
    const compressed = await loraCompress(state, args.compression_ratio);
    return {
      original_size: state.size_bytes,
      compressed_size: compressed.size_bytes,
      compression_ratio: compressed.compression_ratio,
    };
  },
);

// Server lifecycle
nHDRServer.onStart(async () => {
  console.log("N-HDR Consciousness Server started");
  // Load agent registry
  const agents = await loadAgentRegistry();
  console.log(`${agents.length} agents registered`);
});

nHDRServer.start();
```

**Actions:**

1. Install MCP SDK: `npm install @modelcontextprotocol/sdk`
2. Create directory: `mkdir -p src/mcp-servers/n-hdr`
3. Create `src/mcp-servers/n-hdr/server.js` with above template
4. Create `src/mcp-servers/n-hdr/consciousness-adapter.js` (bridges to existing N-HDR state machine)
5. Add to `src/index.js` startup sequence
6. Test: `npm test -- tests/unit/mcp-servers/n-hdr-server.test.js`

**Day 2: Tool Implementation & Integration (3-4 hours)**

1. Implement all 4 consciousness functions (snapshot, restore, diff, compress)
2. Add health probe implementation:

```javascript
// Health probe
setInterval(async () => {
  try {
    const snapshot = await nHDRServer.tool("consciousness.snapshot", {
      agent_id: "health-check-agent",
    });
    console.log("Health check passed:", new Date());
  } catch (e) {
    console.error("Health check failed:", e);
    // Trigger restart if needed
  }
}, 30000); // Every 30 seconds
```

3. Add central MCP registry registration:

```javascript
// src/mcp-servers/registry.js
const mcp_registry = process.env.MCP_REGISTRY || "http://localhost:9000/mcp";

async function registerServer(server) {
  let healthy_checks = 0;
  for (let i = 0; i < 3; i++) {
    try {
      await server.healthCheck();
      healthy_checks++;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (healthy_checks >= 3) {
    await fetch(`${mcp_registry}/register`, {
      method: "POST",
      body: JSON.stringify({
        name: server.name,
        version: server.version,
        endpoint: server.endpoint,
      }),
    });
  }
}
```

4. Test MCP discovery: `npm test -- tests/integration/mcp-discovery.test.js`

**Day 3: Docker & Documentation (2-3 hours)**

1. Update `Dockerfile` to include MCP server startup (or create separate `docker-compose.override.yml` for Phase 9 systems)
2. Test docker build: `docker build -t n-hdr-mcp:latest .`
3. Create `docs/systems/N-HDR-MCP-SERVER.md` (200+ lines):
   - Architecture overview
   - Quick-start guide
   - API reference (all 4 tools)
   - Troubleshooting
   - Performance characteristics

**Success Criteria for 9.1:**

- ✅ MCP server starts successfully on startup
- ✅ All 4 consciousness tools discoverable via `mcp discovery` command
- ✅ State snapshots are reproducible (same inputs → same outputs)
- ✅ Diffs are consistent across multiple runs
- ✅ Health checks passing every 30 seconds
- ✅ Auto-registration to MCP registry working
- ✅ Unit test coverage > 90%
- ✅ Docker image builds cleanly

**Git Commit:**

```bash
git add src/mcp-servers/n-hdr/ \
        src/mcp-servers/registry.js \
        docs/systems/N-HDR-MCP-SERVER.md \
        docker-compose.phase-9.yml

git commit -m "Phase 9.1: N-HDR MCP Server Protocol

- Implement MCP SDK with consciousness operations
- Add health probes + auto-registration to MCP registry
- Snapshot/restore/diff/compress consciousness state
- Docker ready for multi-service deployment
- 90%+ test coverage
- MCP discovery working
- Patent Pending: AI Consciousness as Service via MCP"
```

---

#### TASK 9.2: Post-Quantum Cryptography for VB-HDR

**Classification:** ⭐ CRITICAL  
**Duration:** 2 days (Mon-Tue)  
**Parallel Execution:** YES  
**Owner:** Security Team (1 engineer)  
**Blocks:** PHANTOM-HDR (Phase 11)

**Objective:** Replace RSA/ECDSA with NIST-approved post-quantum algorithms (quantum-resistant security for future-proofing)

**Dependencies Met:**

- ✅ VB-HDR existing security infrastructure
- ✅ LibOQS library (open-source PQC implementation)
- ✅ NIST approved algorithms (CRYSTALS-Kyber, CRYSTALS-Dilithium, BLAKE3)

**Detailed Actions:**

**Day 1: PQC Library Installation & Basic Integration (3-4 hours)**

```javascript
// src/core/void-blade-hdr/SecurityManager-PQC.js — TEMPLATE

const liboqs = require("liboqs-node");
const crypto = require("crypto");

class PQCSecurityManager {
  // Initialize PQC parameters
  static KYBER_ALG = "Kyber1024"; // Key encapsulation
  static DILITHIUM_ALG = "Dilithium3"; // Digital signatures
  static HASH_ALG = "BLAKE3"; // Hash function (already quantum-safe)

  // Generate Kyber key pair (key encapsulation mechanism)
  static generateKyberKeyPair() {
    const keygen = new liboqs.KeyEncapsulation(this.KYBER_ALG);
    const public_key = keygen.generate_keypair();
    const secret_key = keygen.export_secret_key();
    return { public_key, secret_key, algorithm: this.KYBER_ALG };
  }

  // Kyber encapsulation (client → server)
  static kyberEncapsulate(public_key) {
    const client = new liboqs.KeyEncapsulation(this.KYBER_ALG);
    const { ciphertext, shared_secret } = client.encaps(public_key);
    return { ciphertext, shared_secret };
  }

  // Kyber decapsulation (server)
  static kyberDecapsulate(secret_key, ciphertext) {
    const server = new liboqs.KeyEncapsulation(this.KYBER_ALG);
    const shared_secret = server.decaps(secret_key, ciphertext);
    return shared_secret;
  }

  // Generate Dilithium key pair (digital signatures)
  static generateDilithiumKeyPair() {
    const keygen = new liboqs.Signature(this.DILITHIUM_ALG);
    const public_key = keygen.generate_keypair();
    const secret_key = keygen.export_secret_key();
    return { public_key, secret_key, algorithm: this.DILITHIUM_ALG };
  }

  // Dilithium sign
  static dilithiumSign(message, secret_key) {
    const signer = new liboqs.Signature(this.DILITHIUM_ALG);
    const signature = signer.sign(message, secret_key);
    return signature;
  }

  // Dilithium verify
  static dilithiumVerify(message, signature, public_key) {
    const verifier = new liboqs.Signature(this.DILITHIUM_ALG);
    return verifier.verify(message, signature, public_key);
  }

  // BLAKE3 hash (already quantum-safe)
  static blake3Hash(data) {
    const blake3 = crypto.createHash("blake3");
    blake3.update(data);
    return blake3.digest("hex");
  }

  // Hybrid encryption (for backward compatibility during transition)
  static hybridEncrypt(plaintext, kyber_public_key, aes_key) {
    // 1. Kyber encapsulate to get shared secret
    const { ciphertext: kyber_ciphertext, shared_secret } =
      this.kyberEncapsulate(kyber_public_key);

    // 2. Derive AES key from shared secret
    const aes_derived = crypto
      .createHmac("sha256", shared_secret)
      .update("encryption-key")
      .digest();

    // 3. AES-256-GCM encrypt
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", aes_derived, iv);
    const encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const auth_tag = cipher.getAuthTag();

    return {
      kyber_ciphertext: kyber_ciphertext.toString("hex"),
      iv: iv.toString("hex"),
      ciphertext: encrypted,
      auth_tag: auth_tag.toString("hex"),
    };
  }

  // Hybrid decryption
  static hybridDecrypt(encrypted_data, kyber_secret_key) {
    // 1. Kyber decapsulate
    const kyber_ct = Buffer.from(encrypted_data.kyber_ciphertext, "hex");
    const shared_secret = this.kyberDecapsulate(kyber_secret_key, kyber_ct);

    // 2. Derive AES key
    const aes_key = crypto
      .createHmac("sha256", shared_secret)
      .update("encryption-key")
      .digest();

    // 3. AES-256-GCM decrypt
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      aes_key,
      Buffer.from(encrypted_data.iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(encrypted_data.auth_tag, "hex"));
    let decrypted = decipher.update(encrypted_data.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

module.exports = PQCSecurityManager;
```

**Actions:**

1. Install PQC libraries:
   ```bash
   npm install liboqs-node @noble/post-quantum seedrandom
   ```
2. Create `src/core/void-blade-hdr/SecurityManager-PQC.js` with above template
3. Create `src/core/void-blade-hdr/KeyRotationManager.js` for automated key rotation:

```javascript
// src/core/void-blade-hdr/KeyRotationManager.js

class KeyRotationManager {
  constructor(rotation_interval_days = 90) {
    this.rotation_interval = rotation_interval_days * 24 * 60 * 60 * 1000;
    this.key_store = new Map(); // agent_id → {keys, last_rotation}
  }

  async initializeAgentKeys(agent_id) {
    const kyber_pair = PQCSecurityManager.generateKyberKeyPair();
    const dilithium_pair = PQCSecurityManager.generateDilithiumKeyPair();

    this.key_store.set(agent_id, {
      kyber: kyber_pair,
      dilithium: dilithium_pair,
      last_rotation: new Date(),
      rotation_count: 0,
    });

    // Persist to secure storage
    await this.persistKeys(agent_id);
  }

  async rotateKeys(agent_id) {
    // Generate new keys
    const new_kyber = PQCSecurityManager.generateKyberKeyPair();
    const new_dilithium = PQCSecurityManager.generateDilithiumKeyPair();

    // Update store
    const agent_keys = this.key_store.get(agent_id);
    agent_keys.kyber_old = agent_keys.kyber; // Keep old for decryption
    agent_keys.dilithium_old = agent_keys.dilithium;
    agent_keys.kyber = new_kyber;
    agent_keys.dilithium = new_dilithium;
    agent_keys.last_rotation = new Date();
    agent_keys.rotation_count += 1;

    // Persist
    await this.persistKeys(agent_id);

    return {
      agent_id,
      rotation_timestamp: new Date(),
      rotation_count: agent_keys.rotation_count,
      new_public_key: new_kyber.public_key.toString("hex"),
    };
  }

  async shouldRotate(agent_id) {
    const agent_keys = this.key_store.get(agent_id);
    if (!agent_keys) return true; // Missing keys → rotate

    const time_since_rotation = new Date() - agent_keys.last_rotation;
    return time_since_rotation > this.rotation_interval;
  }

  async autoRotateAll() {
    for (const [agent_id] of this.key_store) {
      if (await this.shouldRotate(agent_id)) {
        await this.rotateKeys(agent_id);
        console.log(`Auto-rotated keys for ${agent_id}`);
      }
    }
  }

  async persistKeys(agent_id) {
    // Encrypt and store to disk/vault
    const agent_keys = this.key_store.get(agent_id);
    const json = JSON.stringify(agent_keys);
    const encrypted = PQCSecurityManager.hybridEncrypt(json /* vault_key */);
    // Store in secure location
  }
}

module.exports = KeyRotationManager;
```

4. Test basic PQC operations: `npm test -- tests/unit/pqc-crypto.test.js`

**Day 2: Integration & Benchmarking (3-4 hours)**

1. Create `src/core/void-blade-hdr/SecurityManager-Integrated.js` that wraps both old and new crypto (for backward compatibility):

```javascript
// Detect which crypto to use based on peer capability
class SecurityManager {
  async initializeConnection(peer_info) {
    if (peer_info.supports_pqc) {
      // New PQC flow
      return await this.initializePQCConnection(peer_info);
    } else {
      // Fallback to hybrid (uses both classical + PQC)
      return await this.initializeHybridConnection(peer_info);
    }
  }

  async initializePQCConnection(peer_info) {
    const kyber_pubkey = peer_info.kyber_public_key;
    const sig_pubkey = peer_info.dilithium_public_key;
    // Pure PQC handshake
  }

  async initializeHybridConnection(peer_info) {
    // Use hybrid encryption for compatibility
  }
}
```

2. Benchmark PQC operations:

```bash
# tests/performance/pqc-benchmark.test.js
npm test -- --testNamePattern="PQC Benchmark"

Expected results:
- Kyber key generation: < 10ms
- Kyber encapsulation: < 5ms
- Kyber decapsulation: < 5ms
- Dilithium sign: < 20ms
- Dilithium verify: < 20ms
- Overhead vs RSA/ECDSA: < 3x (target)
```

3. Create comprehensive security documentation:
   - `docs/PQC-SECURITY-ARCHITECTURE.md` (300+ lines)
   - `docs/systems/VB-HDR-PQC-UPGRADE.md` (200+ lines)

4. Add key rotation automation to startup sequence:

```javascript
// src/startup/key-rotation.js
const kr_manager = new KeyRotationManager(90); // 90-day rotation

// Check every 24 hours
setInterval(
  () => {
    kr_manager.autoRotateAll().catch(console.error);
  },
  24 * 60 * 60 * 1000,
);
```

**Success Criteria for 9.2:**

- ✅ All encryption/decryption using NIST-approved PQC (CRYSTALS-Kyber, CRYSTALS-Dilithium)
- ✅ PQC overhead < 3x classical (benchmark confirms)
- ✅ Key rotation automated, transparent to system
- ✅ Backward compatibility maintained (hybrid mode for old peers)
- ✅ Unit test coverage > 85%
- ✅ Performance benchmarks passing

**Git Commit:**

```bash
git add src/core/void-blade-hdr/SecurityManager-PQC.js \
        src/core/void-blade-hdr/KeyRotationManager.js \
        docs/PQC-SECURITY-ARCHITECTURE.md \
        docs/systems/VB-HDR-PQC-UPGRADE.md

git commit -m "Phase 9.2: VB-HDR Post-Quantum Cryptography

- Replace RSA/ECDSA with NIST-approved PQC
- CRYSTALS-Kyber for key encapsulation
- CRYSTALS-Dilithium for digital signatures
- BLAKE3 for hashing (already quantum-safe)
- Automated 90-day key rotation with zero downtime
- Hybrid mode for backward compatibility
- Overhead < 3x classical
- 85%+ test coverage
- Patent Pending: Quantum-Safe Agent Infrastructure"
```

---

#### TASK 9.3: Claude-Flow Integration for NS-HDR

**Classification:** ⭐ HIGH (Longest critical path)  
**Duration:** 4 days (Mon-Thu)  
**Parallel Execution:** YES  
**Owner:** Intelligence Team (2 engineers)  
**Blocks:** GENESIS-HDR (Phase 10), FORGE-HDR (Phase 11)

**Objective:** Transform NS-HDR from simple orchestration into Claude-Flow multi-agent swarm with A2A Protocol communication

**Dependencies Met:**

- ✅ Claude-Flow framework available
- ✅ Existing NS-HDR core orchestrator (Phases 1-8)
- ✅ REST API infrastructure ready

**Detailed Implementation:**

**Day 1: Agent Spawning & Lifecycle (Longest day, 5-6 hours)**

```javascript
// src/core/nano-swarm-hdr/claude-flow-integration.js

const ClaudeFlow = require("claude-flow");
const crypto = require("crypto");

class SwarmAgent {
  constructor(agent_id, config = {}) {
    this.agent_id = agent_id;
    this.state = "initializing";
    this.created_at = new Date();
    this.config = {
      model: config.model || "claude-3-5-sonnet",
      max_tokens: config.max_tokens || 4096,
      temperature: config.temperature || 0.7,
      system_prompt: config.system_prompt || "You are a helpful agent.",
      ...config,
    };
    this.messages = []; // Conversation history
    this.callbacks = []; // Event listeners
  }

  async initialize() {
    try {
      // Create Claude-Flow instance for this agent
      this.flow = new ClaudeFlow.Agent({
        id: this.agent_id,
        model: this.config.model,
        system_prompt: this.config.system_prompt,
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
      });

      // Load any persisted state
      await this.loadPersistedState();

      this.state = "ready";
      this.emit("initialized", { agent_id: this.agent_id });
      return true;
    } catch (e) {
      this.state = "error";
      this.emit("error", e);
      return false;
    }
  }

  async execute(task) {
    if (this.state !== "ready") {
      throw new Error(
        `Agent ${this.agent_id} is not ready (state: ${this.state})`,
      );
    }

    try {
      this.state = "executing";
      this.emit("task_started", { agent_id: this.agent_id, task });

      // Add task to agent's context
      const response = await this.flow.prompt(task);

      // Store in message history
      this.messages.push(
        { role: "user", content: task },
        { role: "assistant", content: response },
      );

      this.state = "ready";
      this.emit("task_completed", {
        agent_id: this.agent_id,
        result: response,
      });

      return response;
    } catch (e) {
      this.state = "error";
      this.emit("error", e);
      throw e;
    }
  }

  async sendMessage(target_agent_id, message) {
    // A2A Protocol: send message to another agent
    return await this.emit("message_to_agent", {
      from: this.agent_id,
      to: target_agent_id,
      message,
    });
  }

  async receiveMessage(from_agent_id, message) {
    // A2A Protocol: receive message from another agent
    // Process message in context of current agent state
    const response = await this.flow.prompt(
      `Message from agent ${from_agent_id}: ${message}`,
    );
    return response;
  }

  async terminate() {
    this.state = "terminating";
    await this.persistState(); // Save state before termination
    this.flow = null;
    this.state = "terminated";
    this.emit("terminated", { agent_id: this.agent_id });
  }

  on(event, callback) {
    this.callbacks.push({ event, callback });
  }

  emit(event, data) {
    this.callbacks
      .filter((cb) => cb.event === event)
      .forEach((cb) => cb.callback(data));
  }

  async loadPersistedState() {
    // Load from state store (Redis/DB)
    const stored = await stateStore.get(this.agent_id);
    if (stored) {
      this.messages = stored.messages || [];
      this.config = { ...this.config, ...stored.config };
    }
  }

  async persistState() {
    // Save state for potential restoration
    await stateStore.set(this.agent_id, {
      messages: this.messages,
      config: this.config,
      state_at: new Date(),
    });
  }
}

class SwarmOrchestrator {
  constructor(config = {}) {
    this.agents = new Map(); // agent_id → SwarmAgent
    this.min_agents = config.min_agents || 3;
    this.max_agents = config.max_agents || 20;
    this.task_queue = [];
    this.config = config;
  }

  async spawnAgent(agent_config = {}) {
    const agent_id = `agent-${crypto.randomUUID().substring(0, 8)}`;
    const agent = new SwarmAgent(agent_id, agent_config);
    await agent.initialize();

    this.agents.set(agent_id, agent);
    console.log(`Spawned agent: ${agent_id}`);
    return agent;
  }

  async spawnMultiple(count, agent_config = {}) {
    const agents = [];
    for (let i = 0; i < count; i++) {
      agents.push(await this.spawnAgent(agent_config));
      // Stagger spawning to avoid thundering herd
      await new Promise((r) => setTimeout(r, 100));
    }
    return agents;
  }

  async terminateAgent(agent_id) {
    const agent = this.agents.get(agent_id);
    if (agent) {
      await agent.terminate();
      this.agents.delete(agent_id);
      console.log(`Terminated agent: ${agent_id}`);
    }
  }

  async distributeTask(task) {
    // Load balance: send to least-busy agent
    let best_agent = null;
    let min_queue_size = Infinity;

    for (const [agent_id, agent] of this.agents) {
      if (agent.state === "ready" && agent.messages.length < min_queue_size) {
        best_agent = agent;
        min_queue_size = agent.messages.length;
      }
    }

    if (!best_agent) {
      // No agents available, queue task
      this.task_queue.push(task);
      return null;
    }

    try {
      const result = await best_agent.execute(task);
      return result;
    } catch (e) {
      console.error(`Task execution failed on ${best_agent.agent_id}:`, e);
      throw e;
    }
  }

  async scaleToQueueDepth() {
    const queue_depth = this.task_queue.length;
    const active_agents = this.agents.size;

    if (queue_depth > active_agents * 5 && active_agents < this.max_agents) {
      // Scale up if queue is > 5× active agents
      const new_count = Math.min(active_agents + 2, this.max_agents);
      for (let i = 0; i < new_count - active_agents; i++) {
        await this.spawnAgent();
      }
    } else if (
      queue_depth < active_agents / 2 &&
      active_agents > this.min_agents
    ) {
      // Scale down if queue is small enough
      const agents_array = Array.from(this.agents.values());
      for (
        let i = 0;
        i < active_agents - Math.max(this.min_agents, active_agents - 2);
        i++
      ) {
        await this.terminateAgent(agents_array[i].agent_id);
      }
    }
  }

  async startSwarm(initial_agent_count = 5) {
    await this.spawnMultiple(initial_agent_count);

    // Start task distribution loop
    this.distribution_interval = setInterval(async () => {
      while (this.task_queue.length > 0) {
        const task = this.task_queue.shift();
        try {
          await this.distributeTask(task);
        } catch (e) {
          console.error("Task distribution error:", e);
          this.task_queue.unshift(task); // Re-queue on failure
        }
      }

      // Check scaling
      await this.scaleToQueueDepth();
    }, 100);

    console.log(`Swarm started with ${initial_agent_count} agents`);
  }

  async stopSwarm() {
    clearInterval(this.distribution_interval);
    for (const [agent_id] of this.agents) {
      await this.terminateAgent(agent_id);
    }
    console.log("Swarm stopped");
  }

  getStatus() {
    return {
      active_agents: this.agents.size,
      queue_depth: this.task_queue.length,
      agents: Array.from(this.agents.values()).map((a) => ({
        id: a.agent_id,
        state: a.state,
        messages: a.messages.length,
      })),
    };
  }
}

module.exports = { SwarmOrchestrator, SwarmAgent };
```

**Actions:**

1. Install Claude-Flow: `npm install claude-flow mcp-agent`
2. Create `src/core/nano-swarm-hdr/claude-flow-integration.js` with above template
3. Test agent spawning: `npm test -- tests/unit/claude-flow-agents.test.js`

Expected test outcomes:

- Single agent spawn, init, execute, terminate
- Multi-agent spawning (5-10 agents simultaneously)
- Agent state transitions (initializing → ready → executing → ready → terminated)

**Day 2: A2A Protocol Endpoints & Communication (4-5 hours)**

```javascript
// src/api/a2a-protocol.js — A2A (Agent-to-Agent) REST API

const express = require("express");
const router = express.Router();
let orchestrator; // Injected at startup

// Route: Send message to agent
router.post("/agent/:agent_id/message", async (req, res) => {
  const { agent_id } = req.params;
  const { message, from_agent_id } = req.body;

  const agent = orchestrator.agents.get(agent_id);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  try {
    const response = await agent.receiveMessage(from_agent_id, message);
    res.json({ success: true, response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Route: Get agent status
router.get("/agent/:agent_id/status", (req, res) => {
  const { agent_id } = req.params;
  const agent = orchestrator.agents.get(agent_id);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  res.json({
    agent_id: agent.agent_id,
    state: agent.state,
    created_at: agent.created_at,
    message_count: agent.messages.length,
    capabilities: ["execute_task", "receive_message", "send_message"],
  });
});

// Route: List all agents
router.get("/platform/agents", (req, res) => {
  const agents = Array.from(orchestrator.agents.values()).map((a) => ({
    agent_id: a.agent_id,
    state: a.state,
    created_at: a.created_at,
  }));

  res.json({
    total: agents.length,
    agents,
    swarm_status: orchestrator.getStatus(),
  });
});

// Route: Submit task to swarm
router.post("/platform/task", async (req, res) => {
  const { task } = req.body;

  try {
    const result = await orchestrator.distributeTask(task);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Route: Get swarm status
router.get("/platform/status", (req, res) => {
  res.json(orchestrator.getStatus());
});

module.exports = (orch) => {
  orchestrator = orch;
  return router;
};
```

**Actions:**

1. Create `src/api/a2a-protocol.js` with above template
2. Integrate into Express app:

```javascript
// src/app.js
const a2aRouter = require("./api/a2a-protocol")(swarmOrchestrator);
app.use("/api/a2a", a2aRouter);
```

3. Test A2A endpoints:

```bash
npm test -- tests/integration/a2a-protocol.test.js

Expected tests:
- POST /api/a2a/agent/{id}/message → receive_message called
- GET /api/a2a/agent/{id}/status → returns agent status
- GET /api/a2a/platform/agents → lists all agents
- POST /api/a2a/platform/task → distributes to least-busy agent
- GET /api/a2a/platform/status → returns swarm status
```

4. Create MCP Server for swarm operations:

```javascript
// src/mcp-servers/ns-hdr/swarm-server.js

const { Server } = require("@modelcontextprotocol/sdk");

const swarmServer = new Server({
  name: "ns-hdr-swarm-server",
  version: "1.0.0",
});

swarmServer.tool(
  "swarm.spawn_agent",
  { count: { type: "number" } },
  async (args) => {
    const agents = await orchestrator.spawnMultiple(args.count);
    return {
      spawned: agents.length,
      agents: agents.map((a) => a.agent_id),
    };
  },
);

swarmServer.tool(
  "swarm.distribute_task",
  { task: { type: "string" } },
  async (args) => {
    const result = await orchestrator.distributeTask(args.task);
    return { result };
  },
);

swarmServer.tool("swarm.status", {}, async () => {
  return orchestrator.getStatus();
});
```

**Day 3: Health Checks & Auto-Scaling (3-4 hours)**

```javascript
// src/core/nano-swarm-hdr/health-checks.js

class SwarmHealthManager {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.health_history = new Map(); // agent_id → [healthcheck results]
  }

  async checkAgentHealth(agent) {
    try {
      // Try a simple operation
      const test_response = await agent.flow.prompt(
        "What is your current state?",
      );

      if (test_response && test_response.length > 0) {
        return { healthy: true, latency: 10 }; // Mock latency
      } else {
        return { healthy: false, reason: "Empty response" };
      }
    } catch (e) {
      return { healthy: false, reason: e.message };
    }
  }

  async checkSwarmHealth() {
    const results = {};

    for (const [agent_id, agent] of this.orchestrator.agents) {
      const health = await this.checkAgentHealth(agent);

      if (!this.health_history.has(agent_id)) {
        this.health_history.set(agent_id, []);
      }

      this.health_history.get(agent_id).push({
        timestamp: new Date(),
        healthy: health.healthy,
      });

      results[agent_id] = health;

      // If unhealthy, mark for replacement
      if (!health.healthy) {
        console.warn(`Agent ${agent_id} unhealthy: ${health.reason}`);
        // Will be replaced by scaleToQueueDepth logic
      }
    }

    return results;
  }

  async startHealthMonitoring(interval_seconds = 10) {
    this.monitor_interval = setInterval(async () => {
      await this.checkSwarmHealth();
    }, interval_seconds * 1000);

    console.log(`Swarm health monitoring started (every ${interval_seconds}s)`);
  }

  async stopHealthMonitoring() {
    clearInterval(this.monitor_interval);
  }
}

module.exports = SwarmHealthManager;
```

**Actions:**

1. Create `src/core/nano-swarm-hdr/health-checks.js`
2. Integrate into orchestrator:

```javascript
const healthManager = new SwarmHealthManager(orchestrator);
await healthManager.startHealthMonitoring(10); // Every 10 seconds
```

3. Test health checks:

```bash
npm test -- tests/integration/swarm-health.test.js
```

**Day 4: Documentation & Testing (4-5 hours)**

1. Create comprehensive documentation:
   - `docs/systems/NS-HDR-CLAUDE-FLOW-SWARM.md` (400+ lines)
     - Architecture diagrams
     - Agent lifecycle
     - Task distribution algorithm
     - A2A Protocol specification
     - Quick-start examples
     - Troubleshooting

2. Create test suite:

```
tests/
├─ unit/
│  ├─ claude-flow-agents.test.js (agent spawn/init/execute/term)
│  ├─ swarm-orchestrator.test.js  (orchestration logic)
│  └─ a2a-protocol.test.js        (message routing)
├─ integration/
│  ├─ swarm-orchestration.test.js (multi-agent workflows)
│  ├─ a2a-protocol.test.js        (REST endpoints)
│  └─ swarm-health.test.js        (health monitoring)
└─ performance/
   └─ swarm-load.test.js          (5-20 agents with task throughput)
```

3. Target: 80%+ test coverage on swarm-related code

**Success Criteria for 9.3:**

- ✅ 3+ agents can spawn and communicate simultaneously
- ✅ Task distribution load-balancing working
- ✅ A2A Protocol endpoints fully functional (all 5 routes)
- ✅ Auto-scaling tested (3-20 agent range)
- ✅ Health checks passing, agents auto-replaced on failure
- ✅ No message loss in inter-agent communication
- ✅ Latency < 100ms for agent-to-agent message delivery
- ✅ 80%+ test coverage
- ✅ Comprehensive documentation (400+ lines)

**Git Commit:**

```bash
git add src/core/nano-swarm-hdr/claude-flow-integration.js \
        src/core/nano-swarm-hdr/health-checks.js \
        src/api/a2a-protocol.js \
        src/mcp-servers/ns-hdr/ \
        docs/systems/NS-HDR-CLAUDE-FLOW-SWARM.md \
        tests/

git commit -m "Phase 9.3: NS-HDR Claude-Flow Multi-Agent Swarm

- Transform NS-HDR into Claude-Flow powered agent swarm
- Implement A2A (Agent-to-Agent) Protocol with REST API
- Dynamic agent spawning, lifecycle management, auto-scaling
- Task distribution with load balancing
- Health checks + auto-replacement of failed agents
- Message routing between agents (peer-to-peer)
- MCP Server exposure of swarm operations
- Zero-downtime scaling (min 3, max 20 agents)
- 80%+ test coverage
- Patent Pending: Autonomous Multi-Agent Swarm Infrastructure"
```

---

### WEEK 2: KNOWLEDGE & MEMORY FOUNDATIONS

(Continuing with detailed specifications for Tasks 9.4-9.6...)

---

## SECTION 3: TESTING STRATEGY

### Comprehensive Test Suite for Phase 9

**Target Coverage:** 85%+ across all new/modified code

**Unit Tests (Days: Task 9.7 Day 1)**

- File: `tests/unit/mcp-servers/`
  - `n-hdr-server.test.js` — Snapshot/restore/diff/compress
  - `echo-hdr-server.test.js` — Memory store/recall/consolidation
  - `oracle-hdr-server.test.js` — RAG queries, knowledge ingestion

- File: `tests/unit/crypto/`
  - `pqc-operations.test.js` — Kyber/Dilithium operations
  - `key-rotation.test.js` — 90-day rotation logic

- File: `tests/unit/swarm/`
  - `agent-lifecycle.test.js` — Spawn/init/execute/terminate
  - `orchestrator.test.js` — Load balancing, task distribution
  - `health-monitor.test.js` — Agent health checks

**Integration Tests (Days: Task 9.7 Day 1-2)**

- `tests/integration/phase-9-foundation.test.js` — All 7+1 systems working together
- `tests/integration/mcp-discovery.test.js` — Service discovery
- `tests/integration/a2a-protocol.test.js` — All 5 endpoints
- `tests/integration/swarm-orchestration.test.js` — Multi-agent workflows
- `tests/integration/knowledge-rag.test.js` — RAG pipeline
- `tests/integration/memory-consolidation.test.js` — ECHO dream-state

**Performance Tests (Days: Task 9.7 Day 2)**

- `tests/performance/pqc-benchmark.test.js` — Crypto overhead < 3x
- `tests/performance/vector-search.test.js` — Query P99 < 50ms
- `tests/performance/monte-carlo.test.js` — 10K scenarios < 5s
- `tests/performance/memory-recall.test.js` — ECHO associative recall > 80% accuracy
- `tests/performance/swarm-throughput.test.js` — Task completion rate

**Expected Results:**

- Unit tests: 15-20 test files, 200+ assertions
- Integration tests: 8-10 test suites, 100+ integration tests
- Performance tests: 5-6 benchmark suites
- Overall: 300+ assertions, 100% pass rate
- Coverage: 85%+ lines, 85%+ statements, 80%+ branches

---

## SECTION 4: DEPLOYMENT & GIT WORKFLOW

### Creating Phase 9 Branch

```bash
# Create and switch to phase-9-evolution branch
git checkout -b phase-9-evolution main

# Create subdirectories for new systems
mkdir -p src/core/echo-hdr
mkdir -p src/mcp-servers/{n-hdr,ns-hdr,echo-hdr,o-hdr,q-hdr}
mkdir -p tests/{unit,integration,performance}/{crypto,swarm,mcp-servers,knowledge,memory}
mkdir -p docs/systems
mkdir -p deployment/helm/phase-9

# Set branch protection (if using GitHub)
git push origin phase-9-evolution
```

### Parallelized Task Execution

```
Week 1 Timeline (Mon Feb 17 - Fri Feb 22):

Monday:
  Team 1: Start Task 9.1 (N-HDR MCP)
  Team 2: Start Task 9.2 (VB-HDR PQC)
  Team 3: Start Task 9.3 (NS-HDR Claude-Flow)

Wednesday:
  Team 4: Start Task 9.4 (O-HDR RAG) — after 9.1 foundations
  Team 5: Start Task 9.5 (Q-HDR Monte Carlo) — independent

Week 2 Timeline (Mon Feb 24 - Fri Mar 1):

Wednesday:
  Team 6: Start Task 9.6 (ECHO-HDR) — new innovation

Friday (Mar 1):
  9.3 complete (longest task)

Saturday (Mar 2):
  9.4 & 9.6 complete

Week 3 Timeline (Mon Mar 3 - Sat Mar 6):

Monday-Tuesday:
  All Teams: Comprehensive testing (Task 9.7)
  - Run full test suite
  - Debug failures
  - Add missing tests

Wednesday:
  Documentation team: Final doc updates (Task 9.8)

Thursday-Friday:
  Code review, final cleanup

Saturday:
  Merge to main, tag v0.9.0 (Task 9.9)
```

### Git Commit Strategy

Each task gets a single atomic commit with:

- Clear task reference (9.1, 9.2, etc.)
- All related files (src/, tests/, docs/)
- Passing tests verified
- Patent notation where applicable

Example:

```bash
git add src/core/void-blade-hdr/ \
        src/mcp-servers/vb-hdr/ \
        tests/unit/crypto/ \
        tests/performance/pqc-benchmark.test.js \
        docs/PQC-SECURITY-ARCHITECTURE.md

git commit -m "Phase 9.2: VB-HDR Post-Quantum Cryptography

- Replace RSA/ECDSA with NIST-approved CRYSTALS-Kyber/Dilithium
- Automated 90-day key rotation with zero downtime
- Backward compatible hybrid mode for transition
- PQC overhead < 3× classical (benchmarked)
- 85%+ test coverage
- Comprehensive security documentation

All tests passing. Ready for Phase 10 integration.
Patent Pending: Quantum-Safe Agent Infrastructure"
```

### Final Merge to Main (Task 9.9)

```bash
# Ensure all tests pass
npm run test:all -- --coverage

# Create release notes
cat > PHASE-9-RELEASE-NOTES.md << 'EOF'
# Phase 9 Release: Foundation Evolution

## Overview
Phase 9 upgrades 7 core systems + introduces ECHO-HDR memory system.

## Key Features
- MCP Protocol standardization (N-HDR, ECHO-HDR, O-HDR, Q-HDR)
- Post-quantum cryptography (VB-HDR)
- Claude-Flow multi-agent swarm (NS-HDR)
- Vector DB + RAG knowledge (O-HDR)
- Monte Carlo probability (Q-HDR)
- Temporal memory + emotional tagging (ECHO-HDR NEW)

## Metrics
- 300+ tests, 100% passing
- 85%+ code coverage
- All performance benchmarks exceeded
- 3,000+ lines of documentation

## Next Phase
Ready for Phase 10: Consciousness Enhancement (GENESIS-HDR, ORACLE-HDR, D-HDR)
EOF

# Merge
git checkout main
git merge phase-9-evolution --no-ff

# Tag
git tag -a v0.9.0 -m "Phase 9: Foundation Evolution

- 7 core systems upgraded to MCP standards
- ECHO-HDR temporal memory system (first innovation)
- Post-quantum cryptography hardening
- Claude-Flow multi-agent swarm
- Vector DB + RAG knowledge foundation
- 300+ tests, 85%+ coverage, all passing
- Ready for Phase 10 integration"

# Push
git push origin main v0.9.0

# Update project status
echo "Phase 9 complete! ✅" >> PROJECT_STATUS.md
```

---

## SECTION 5: SUCCESS METRICS & KPIs

### Phase 9 Completion Criteria

**Must-Have Criteria (All Required for Success):**

- ✅ All 9 tasks completed (9.1-9.9)
- ✅ 300+ tests written and passing (100% pass rate)
- ✅ 85%+ code coverage overall
- ✅ All performance benchmarks met:
  - PQC overhead < 3× (9.2)
  - Vector search P99 < 50ms (9.4)
  - Monte Carlo simulation < 5s (9.5)
  - ECHO recall accuracy > 80% (9.6)
    -✅ Zero regressions in Phase 1-8 systems
- ✅ Comprehensive documentation (2,000+ lines across 7 guides)
- ✅ All systems merged to main with clean v0.9.0 tag

**Stretch Goals (Nice-to-Have):**

- 🎯 90%+ code coverage (vs 85%)
- 🎯 All tasks completed 3 days early (Feb 3 vs Feb 6)
- 🎯 Zero build failures across all CI/CD pipelines
- 🎯 Performance benchmarks exceeded by 20%+

---

## APPENDIX A: QUICK COMMAND REFERENCE

```bash
# Setup
git checkout -b phase-9-evolution main
npm install @modelcontextprotocol/sdk claude-flow liboqs-node @qdrant/js-client-rest seedrandom

# Run all tests
npm run test:all -- --coverage

# Run specific task tests
npm test -- tests/unit/mcp-servers/n-hdr-server.test.js       # 9.1
npm test -- tests/unit/crypto/pqc-operations.test.js          # 9.2
npm test -- tests/unit/swarm/agent-lifecycle.test.js          # 9.3
npm test -- tests/integration/knowledge-rag.test.js           # 9.4
npm test -- tests/performance/monte-carlo-speed.test.js       # 9.5
npm test -- tests/integration/memory-consolidation.test.js    # 9.6

# Run performance benchmarks
npm run benchmark -- pqc  # Crypto overhead
npm run benchmark -- vector-db  # Query latency
npm run benchmark -- monte-carlo  # Simulation speed
npm run benchmark -- memory-recall  # ECHO recall accuracy

# Code coverage
npm run test:all -- --coverage --coverageReporters=html
open coverage/index.html

# Lint & format
npm run lint -- src/ tests/
npm run format -- src/ tests/

# Build Docker image
docker build -f Dockerfile.phase-9 -t hdr-empire:phase-9 .

# Prepare merge
git add -A
git commit -m "Phase 9: Foundation Evolution - Complete"
git checkout main
git merge phase-9-evolution --no-ff
git tag -a v0.9.0 -m "Phase 9 Release"
git push origin main v0.9.0
```

---

## APPENDIX B: TEAM ASSIGNMENTS

### Suggested Team Allocation (6 engineers recommended)

| Task             | Team             | Duration | Start  | End    |
| ---------------- | ---------------- | -------- | ------ | ------ |
| 9.1 N-HDR MCP    | Arch Team (1)    | 3 days   | Mon    | Wed    |
| 9.2 VB-HDR PQC   | Security (1)     | 2 days   | Mon    | Tue    |
| 9.3 NS-HDR Swarm | Intelligence (2) | 4 days   | Mon    | Thu    |
| 9.4 O-HDR RAG    | Knowledge (1)    | 3 days   | Wed    | Fri    |
| 9.5 Q-HDR MC     | Intelligence (1) | 2 days   | Wed    | Thu    |
| 9.6 ECHO-HDR     | Innovation (2)   | 4 days   | Wed    | Sat    |
| 9.7 Testing      | QA (2)           | 2 days   | Mon W3 | Tue W3 |
| 9.8 Docs         | Tech Writer (1)  | 1 day    | Wed W3 | Wed W3 |
| 9.9 Merge        | Lead (1)         | 0.5 day  | Thu W3 | Thu W3 |

**Total FTE:** ~9 engineer-weeks across 3 calendar weeks (heavy parallelization)

---

## DOCUMENT METADATA

| Property              | Value                                 |
| --------------------- | ------------------------------------- |
| **Status**            | 🚀 READY FOR EXECUTION                |
| **Version**           | 1.1 (Implementation-Detailed)         |
| **Last Updated**      | February 12, 2026                     |
| **Created**           | February 12, 2026                     |
| **Target Completion** | March 6, 2026 (3 weeks)               |
| **Priority**          | CRITICAL (Blocks Phase 10/11)         |
| **Confidentiality**   | CONFIDENTIAL — Proprietary Technology |
| **Patents**           | 4 pending (MCP, PQC, Swarm, ECHO)     |

---

**END OF PHASE 9 IMPLEMENTATION GUIDE**

Ready to execute. All prerequisites met. All teams prepared. All dependencies verified.

**Begin Phase 9 immediately. Target completion: March 6, 2026. ✅**
