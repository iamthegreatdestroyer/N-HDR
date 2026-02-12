/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * ECHO-HDR MCP Server — Phase 9 Evolution
 * Exposes temporal memory operations (store, recall, search, decay diagnostics,
 * dream consolidation) as Model Context Protocol tools for autonomous AI
 * agent orchestration.
 *
 * File: src/mcp-servers/echo-hdr/server.js
 * Created: 2026-02
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import EchoHDRCore, {
  EpisodeType,
  DecayProfile,
  ConsolidationMode,
} from "../../echo-hdr/echo-hdr-core.js";

// ─── Singleton ECHO-HDR Instance ──────────────────────────────────────────────

let echoInstance = null;

async function getEcho() {
  if (!echoInstance) {
    echoInstance = new EchoHDRCore();
    await echoInstance.initialize();
  }
  return echoInstance;
}

// ─── MCP Server Definition ───────────────────────────────────────────────────

const server = new McpServer(
  {
    name: "echo-hdr-memory",
    version: "9.6.0",
  },
  {
    capabilities: {
      tools: { listChanged: true },
      resources: {},
    },
  }
);

// ─── Shared Schema Fragments ────────────────────────────────────────────────

const emotionalSchema = z
  .object({
    significance: z.number().min(0).max(1).optional(),
    urgency: z.number().min(0).max(1).optional(),
    resonance: z.number().min(0).max(1).optional(),
  })
  .optional()
  .describe("Emotional context (significance, urgency, resonance) each 0-1");

// ─── TOOL 1: Store Memory ───────────────────────────────────────────────────

server.tool(
  "echo_memory_store",
  "Stores a new episodic memory into the ECHO-HDR temporal memory system. " +
    "Memories are automatically tracked for temporal decay and embedded for " +
    "future associative search. Supports emotional tagging and association " +
    "linkage to existing memories.",
  {
    content: z
      .any()
      .describe(
        "The memory content to store. Can be text, structured data, or any serializable value."
      ),
    context: z
      .array(z.string())
      .optional()
      .describe(
        'Context tags for indexing (e.g. ["coding", "architecture", "decision"])'
      ),
    type: z
      .enum([
        "experience",
        "decision",
        "insight",
        "interaction",
        "reflection",
        "error",
        "milestone",
      ])
      .optional()
      .default("experience")
      .describe("Episode type classification"),
    emotional: emotionalSchema,
    decayProfile: z
      .enum(["standard", "resilient", "fragile", "immortal"])
      .optional()
      .default("standard")
      .describe(
        "Decay profile: standard (24h half-life), resilient (7d), fragile (2h), immortal (never)"
      ),
    associateWith: z
      .array(z.string())
      .optional()
      .describe("Existing episode IDs to create bidirectional associations with"),
  },
  async (args) => {
    try {
      const echo = await getEcho();

      // Map string type → EpisodeType constant
      const typeMap = {
        experience: EpisodeType.EXPERIENCE,
        decision: EpisodeType.DECISION,
        insight: EpisodeType.INSIGHT,
        interaction: EpisodeType.INTERACTION,
        reflection: EpisodeType.REFLECTION,
        error: EpisodeType.ERROR,
        milestone: EpisodeType.MILESTONE,
      };

      const profileMap = {
        standard: DecayProfile.STANDARD,
        resilient: DecayProfile.RESILIENT,
        fragile: DecayProfile.FRAGILE,
        immortal: DecayProfile.IMMORTAL,
      };

      const episode = await echo.store({
        content: args.content,
        context: args.context,
        type: typeMap[args.type] ?? EpisodeType.EXPERIENCE,
        emotional: args.emotional,
        decayProfile: profileMap[args.decayProfile] ?? DecayProfile.STANDARD,
        associateWith: args.associateWith,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                id: episode.id,
                episodeType: episode.type,
                context: episode.context,
                strength: episode.temporal?.currentStrength ?? 1.0,
                decayProfile: args.decayProfile,
                message: "Memory stored and indexed for temporal tracking.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return _errorResponse(error);
    }
  }
);

// ─── TOOL 2: Recall Memories ────────────────────────────────────────────────

server.tool(
  "echo_memory_recall",
  "Recalls episodic memories matching context tags, type, and minimum strength. " +
    "Returns memories sorted by current strength, accounting for temporal decay. " +
    "Recalling a memory reinforces it (spacing effect), slowing future decay.",
  {
    context: z
      .array(z.string())
      .optional()
      .describe("Context tags to filter by (matches any)"),
    type: z
      .enum([
        "experience",
        "decision",
        "insight",
        "interaction",
        "reflection",
        "error",
        "milestone",
      ])
      .optional()
      .describe("Filter by episode type"),
    minStrength: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.1)
      .describe("Minimum memory strength (0-1, default 0.1)"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .default(20)
      .describe("Maximum number of results (default 20)"),
    id: z
      .string()
      .optional()
      .describe("Recall a specific memory by its ID (overrides other filters)"),
  },
  async (args) => {
    try {
      const echo = await getEcho();

      // Single ID recall
      if (args.id) {
        const ep = echo.recallById(args.id);
        if (!ep) {
          return _textResponse({ success: true, found: false, message: "No memory found with that ID." });
        }
        const strength = echo.getMemoryStrength(args.id);
        return _textResponse({
          success: true,
          found: true,
          memory: { ...ep, currentStrength: strength },
        });
      }

      // Multi-recall
      const typeMap = {
        experience: EpisodeType.EXPERIENCE,
        decision: EpisodeType.DECISION,
        insight: EpisodeType.INSIGHT,
        interaction: EpisodeType.INTERACTION,
        reflection: EpisodeType.REFLECTION,
        error: EpisodeType.ERROR,
        milestone: EpisodeType.MILESTONE,
      };

      const results = echo.recall({
        context: args.context,
        type: args.type ? typeMap[args.type] : undefined,
        minStrength: args.minStrength ?? 0.1,
        limit: args.limit ?? 20,
      });

      return _textResponse({
        success: true,
        count: results.length,
        memories: results,
      });
    } catch (error) {
      return _errorResponse(error);
    }
  }
);

// ─── TOOL 3: Decay Diagnostics ──────────────────────────────────────────────

server.tool(
  "echo_memory_decay",
  "Queries the temporal decay status of a specific memory or the full system. " +
    "Returns current strength, half-life, consolidation stage, time until " +
    "strength drops below a threshold, and prune eligibility.",
  {
    id: z
      .string()
      .optional()
      .describe("Episode ID to diagnose (omit for system overview)"),
    pruneThreshold: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.01)
      .describe("Memories below this strength are prune candidates (default 0.01)"),
    doPrune: z
      .boolean()
      .optional()
      .default(false)
      .describe("If true, actually prune decayed memories"),
  },
  async (args) => {
    try {
      const echo = await getEcho();

      // System-wide stats
      if (!args.id) {
        const stats = echo.getStats();
        let pruneCount = 0;

        if (args.doPrune) {
          pruneCount = echo.prune();
        }

        return _textResponse({
          success: true,
          systemStats: stats,
          pruned: args.doPrune ? pruneCount : undefined,
          message: args.doPrune
            ? `Pruned ${pruneCount} decayed memories.`
            : "System diagnostics retrieved.",
        });
      }

      // Single-memory diagnostics
      const diag = echo.getDecayDiagnostics(args.id);
      if (!diag) {
        return _textResponse({
          success: true,
          found: false,
          message: "No memory found with that ID.",
        });
      }

      return _textResponse({
        success: true,
        found: true,
        diagnostics: diag,
      });
    } catch (error) {
      return _errorResponse(error);
    }
  }
);

// ─── TOOL 4: Dream Consolidation ────────────────────────────────────────────

server.tool(
  "echo_memory_dream",
  "Triggers a dream-state consolidation cycle. During consolidation, the system " +
    "strengthens important memories, creates new associations, prunes decayed " +
    "memories, and discovers emergent insights. Integrates with D-HDR dream " +
    "processing in REM mode for creative pattern discovery.",
  {
    mode: z
      .enum(["light", "standard", "deep", "rem"])
      .optional()
      .default("standard")
      .describe(
        "Consolidation depth: light (quick), standard (balanced), " +
          "deep (thorough), rem (creative + D-HDR patterns)"
      ),
  },
  async (args) => {
    try {
      const echo = await getEcho();

      const modeMap = {
        light: ConsolidationMode.LIGHT,
        standard: ConsolidationMode.STANDARD,
        deep: ConsolidationMode.DEEP,
        rem: ConsolidationMode.REM,
      };

      const stats = await echo.dreamConsolidate(
        modeMap[args.mode] ?? ConsolidationMode.STANDARD
      );

      return _textResponse({
        success: true,
        mode: args.mode,
        consolidation: stats,
        message: `Dream consolidation (${args.mode}) completed.`,
      });
    } catch (error) {
      return _errorResponse(error);
    }
  }
);

// ─── TOOL 5: Associative Search ─────────────────────────────────────────────

server.tool(
  "echo_memory_search",
  "Performs semantic/associative vector search through stored memories. " +
    "Uses Qdrant vector similarity with emotional-weighted hybrid scoring. " +
    "Supports chain search for multi-hop associative recall.",
  {
    query: z
      .string()
      .describe("Natural language search query"),
    topK: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(15)
      .describe("Maximum results (default 15)"),
    minScore: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Minimum similarity score filter"),
    chainDepth: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .default(0)
      .describe(
        "If > 0, perform chain search to this depth (multi-hop associations)"
      ),
    branchFactor: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(3)
      .describe("Branches per hop in chain search"),
    emotionalFilter: z
      .object({
        minSignificance: z.number().min(0).max(1).optional(),
        minResonance: z.number().min(0).max(1).optional(),
      })
      .optional()
      .describe("Filter results by emotional properties"),
  },
  async (args) => {
    try {
      const echo = await getEcho();

      let results;

      if (args.chainDepth && args.chainDepth > 0) {
        results = await echo.chainSearch(
          args.query,
          args.chainDepth,
          args.branchFactor ?? 3
        );
      } else {
        results = await echo.search(args.query, {
          topK: args.topK ?? 15,
          minScore: args.minScore,
          emotionalFilter: args.emotionalFilter,
        });
      }

      return _textResponse({
        success: true,
        query: args.query,
        searchType: args.chainDepth > 0 ? "chain" : "vector",
        count: results.length,
        results,
      });
    } catch (error) {
      return _errorResponse(error);
    }
  }
);

// ─── Helper Functions ────────────────────────────────────────────────────────

function _textResponse(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function _errorResponse(error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ success: false, error: error.message }),
      },
    ],
    isError: true,
  };
}

// ─── Stdio Transport ────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("ECHO-HDR MCP Server fatal error:", err);
  process.exit(1);
});
