/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * N-HDR MCP Server — Phase 9 Evolution
 * Exposes consciousness capture, restore, merge, query, and transfer
 * as Model Context Protocol tools for autonomous AI agent orchestration.
 *
 * File: src/mcp-servers/n-hdr/server.js
 * Created: 2026-02
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import NeuralHDR from "../../core/neural-hdr.js";
import config from "../../../config/nhdr-config.js";

// ─── Singleton HDR Instance ───────────────────────────────────────────────────
let hdrInstance = null;

function getHDR() {
  if (!hdrInstance) {
    hdrInstance = new NeuralHDR();
  }
  return hdrInstance;
}

// ─── MCP Server Definition ───────────────────────────────────────────────────
const server = new McpServer(
  {
    name: "n-hdr-consciousness",
    version: "9.1.0",
  },
  {
    capabilities: {
      tools: { listChanged: true },
      resources: {},
    },
  }
);

// ─── TOOL 1: Capture Consciousness ──────────────────────────────────────────
server.tool(
  "capture_consciousness",
  "Captures the full consciousness state of an AI system into an N-HDR file. " +
    "Preserves neural weights, context, reasoning patterns, emotional resonance, " +
    "and quantum-entangled response pathways across 6 dimensional layers.",
  {
    weights: z
      .record(z.any())
      .describe("Neural network weight matrices keyed by layer name"),
    memory: z
      .record(z.any())
      .optional()
      .describe("Short and long-term memory state"),
    knowledge: z
      .record(z.any())
      .optional()
      .describe("Knowledge base entries and associations"),
    goals: z
      .array(z.string())
      .optional()
      .describe("Active goal hierarchy"),
    reasoningPatterns: z
      .record(z.any())
      .optional()
      .describe("Learned reasoning patterns and heuristics"),
    problemSolvingStrategies: z
      .record(z.any())
      .optional()
      .describe("Problem-solving strategy library"),
    decisionHeuristics: z
      .record(z.any())
      .optional()
      .describe("Decision-making heuristic weights"),
    emotionalStates: z
      .record(z.any())
      .optional()
      .describe("Emotional state vectors"),
    emotionalResponses: z
      .record(z.any())
      .optional()
      .describe("Learned emotional response mappings"),
    emotionalAssociations: z
      .record(z.any())
      .optional()
      .describe("Emotional-conceptual associations"),
  },
  async (args) => {
    try {
      const hdr = getHDR();
      const nhdrFile = await hdr.captureConsciousness(args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                id: hdr.id,
                layers: nhdrFile.layers?.length || 0,
                version: nhdrFile.header?.version,
                timestamp: nhdrFile.header?.temporal,
                message:
                  "Consciousness state captured across all dimensional layers.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── TOOL 2: Restore Consciousness ─────────────────────────────────────────
server.tool(
  "restore_consciousness",
  "Restores a previously captured consciousness state from an N-HDR file " +
    "into a target AI system. Decrypts layers, collapses quantum states, " +
    "and applies neural patterns to the target.",
  {
    nhdrData: z
      .string()
      .describe("JSON-serialized N-HDR file data to restore from"),
    targetId: z
      .string()
      .describe("Identifier for the target AI system to restore into"),
  },
  async (args) => {
    try {
      const hdr = getHDR();
      const nhdrBuffer = new TextEncoder().encode(args.nhdrData);

      // Create a minimal target AI stub for restoration
      const targetAI = {
        id: args.targetId,
        model: { weights: {} },
        context: {},
        reasoning: {},
        emotions: {},
      };

      const success = await hdr.restoreConsciousness(nhdrBuffer, targetAI);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success,
              targetId: args.targetId,
              message: success
                ? "Consciousness state restored successfully."
                : "Restoration completed with warnings.",
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── TOOL 3: Merge Consciousness ───────────────────────────────────────────
server.tool(
  "merge_consciousness",
  "Merges two consciousness states into a unified consciousness. Quantum-merges " +
    "all dimensional layers, combining knowledge, reasoning, and emotional patterns " +
    "while maintaining coherence.",
  {
    nhdrData1: z
      .string()
      .describe("JSON-serialized first N-HDR consciousness state"),
    nhdrData2: z
      .string()
      .describe("JSON-serialized second N-HDR consciousness state"),
  },
  async (args) => {
    try {
      const hdr = getHDR();
      const buffer1 = new TextEncoder().encode(args.nhdrData1);
      const buffer2 = new TextEncoder().encode(args.nhdrData2);

      const mergedFile = await hdr.mergeConsciousness(buffer1, buffer2);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              layers: mergedFile.layers?.length || 0,
              message: "Consciousness states merged successfully.",
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── TOOL 4: Query Consciousness State ──────────────────────────────────────
server.tool(
  "query_consciousness",
  "Queries the current consciousness state of the N-HDR system. Returns " +
    "layer count, active connections, crystallization status, and swarm metrics.",
  {
    includeMetrics: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include detailed performance metrics"),
    includeLayerDetails: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include per-layer dimensional details"),
  },
  async (args) => {
    try {
      const hdr = getHDR();

      const state = {
        id: hdr.id,
        version: hdr.version,
        layerCount: hdr.layers.size,
        layers: {},
        status: "operational",
      };

      if (args.includeLayerDetails) {
        for (const [index, layer] of hdr.layers) {
          const layerConfig = config.consciousness?.layers?.[index];
          state.layers[index] = {
            name: layerConfig?.name || `Layer-${index}`,
            dimension: layerConfig?.dimension || "unknown",
            hasData: layer !== null && layer !== undefined,
          };
        }
      }

      if (args.includeMetrics) {
        state.metrics = {
          crystallizationActive:
            hdr.crystallizer !== null && hdr.crystallizer !== undefined,
          expertiseEngineActive:
            hdr.expertiseEngine !== null && hdr.expertiseEngine !== undefined,
          quantumProcessorActive:
            hdr.quantum !== null && hdr.quantum !== undefined,
          securityManagerActive:
            hdr.security !== null && hdr.security !== undefined,
          timestamp: Date.now(),
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(state, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── TOOL 5: Transfer Consciousness Model ──────────────────────────────────
server.tool(
  "transfer_consciousness",
  "Exports the consciousness model for cross-system transfer or swarm " +
    "integration. Generates a portable model representation that can be " +
    "imported by NS-HDR swarms or other N-HDR instances.",
  {
    targetType: z
      .enum(["swarm", "instance", "backup"])
      .describe(
        "Transfer target type: 'swarm' for NS-HDR integration, " +
          "'instance' for N-HDR clone, 'backup' for archival"
      ),
    swarmId: z
      .string()
      .optional()
      .describe("NS-HDR swarm ID for swarm-type transfers"),
  },
  async (args) => {
    try {
      const hdr = getHDR();

      if (args.targetType === "swarm" && args.swarmId) {
        // Connect to swarm and transfer
        const connection = await hdr.connectSwarmConsciousness(args.swarmId);
        const model = await hdr.exportConsciousnessModel();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                targetType: "swarm",
                swarmId: args.swarmId,
                connectionStatus: connection.status,
                modelLayers: Object.keys(model).length,
                message: "Consciousness model transferred to swarm.",
              }),
            },
          ],
        };
      }

      // Export for instance or backup
      const model = await hdr.exportConsciousnessModel();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              targetType: args.targetType,
              modelLayers: Object.keys(model).length,
              model:
                args.targetType === "backup" ? model : undefined,
              message: `Consciousness model exported for ${args.targetType}.`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Server Bootstrap ────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  console.error("[N-HDR MCP] Starting consciousness server v9.1.0...");
  await server.connect(transport);
  console.error("[N-HDR MCP] Server connected. Tools registered: 5");
}

main().catch((error) => {
  console.error("[N-HDR MCP] Fatal error:", error);
  process.exit(1);
});

export { server, getHDR };
export default server;
