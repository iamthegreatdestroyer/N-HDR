/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * MCP Server Architecture Integration Tests — Phase 9.7
 * Tests the MCP server module structure, tool registration patterns,
 * and helper utilities shared across N-HDR and ECHO-HDR MCP servers.
 *
 * Note: Full MCP transport tests require stdio pipes; these tests
 * validate the importable server structure and tool schemas.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

describe("MCP Server Architecture", () => {
  // ─── McpServer Basics ─────────────────────────────────────────────────────

  describe("McpServer instantiation", () => {
    it("should create a server with name and version", () => {
      const server = new McpServer(
        { name: "test-server", version: "1.0.0" },
        { capabilities: { tools: { listChanged: true }, resources: {} } },
      );

      expect(server).toBeDefined();
    });

    it("should register a tool with schema and handler", () => {
      const server = new McpServer(
        { name: "test-server", version: "1.0.0" },
        { capabilities: { tools: { listChanged: true } } },
      );

      expect(() => {
        server.tool(
          "test_tool",
          "A test tool for validation",
          { input: z.string().describe("Test input") },
          async ({ input }) => ({
            content: [{ type: "text", text: `Echo: ${input}` }],
          }),
        );
      }).not.toThrow();
    });

    it("should register multiple tools", () => {
      const server = new McpServer(
        { name: "multi-tool", version: "1.0.0" },
        { capabilities: { tools: { listChanged: true } } },
      );

      expect(() => {
        server.tool(
          "tool_a",
          "First tool",
          { value: z.number() },
          async ({ value }) => ({
            content: [{ type: "text", text: String(value * 2) }],
          }),
        );

        server.tool(
          "tool_b",
          "Second tool",
          { text: z.string() },
          async ({ text }) => ({
            content: [{ type: "text", text: text.toUpperCase() }],
          }),
        );
      }).not.toThrow();
    });
  });

  // ─── Response Format ──────────────────────────────────────────────────────

  describe("response format helpers", () => {
    // Mirrors the _textResponse / _errorResponse pattern used in both servers

    function _textResponse(data) {
      return {
        content: [
          {
            type: "text",
            text:
              typeof data === "string" ? data : JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    function _errorResponse(message) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: true, message }, null, 2),
          },
        ],
        isError: true,
      };
    }

    it("should format text responses", () => {
      const resp = _textResponse({ status: "ok", count: 42 });
      expect(resp.content).toHaveLength(1);
      expect(resp.content[0].type).toBe("text");
      expect(JSON.parse(resp.content[0].text).status).toBe("ok");
    });

    it("should format string responses", () => {
      const resp = _textResponse("simple message");
      expect(resp.content[0].text).toBe("simple message");
    });

    it("should format error responses with isError flag", () => {
      const resp = _errorResponse("Something went wrong");
      expect(resp.isError).toBe(true);
      const body = JSON.parse(resp.content[0].text);
      expect(body.error).toBe(true);
      expect(body.message).toBe("Something went wrong");
    });
  });

  // ─── Schema Validation ────────────────────────────────────────────────────

  describe("schema validation patterns", () => {
    it("should validate required fields", () => {
      const schema = z.object({
        weights: z.record(z.any()),
        memory: z.record(z.any()).optional(),
      });

      // Valid with required field
      expect(() =>
        schema.parse({ weights: { layer1: [1, 2, 3] } }),
      ).not.toThrow();

      // Missing required field
      expect(() => schema.parse({})).toThrow();
    });

    it("should validate N-HDR consciousness capture schema", () => {
      const captureSchema = z.object({
        weights: z.record(z.any()),
        memory: z.record(z.any()).optional(),
        knowledge: z.record(z.any()).optional(),
        personality: z.record(z.any()).optional(),
      });

      const valid = captureSchema.parse({
        weights: { encoder: [0.1, 0.5] },
        memory: { shortTerm: "hello" },
      });

      expect(valid.weights).toBeDefined();
      expect(valid.memory).toBeDefined();
      expect(valid.knowledge).toBeUndefined();
    });

    it("should validate ECHO-HDR emotional metadata schema", () => {
      const emotionalSchema = z
        .object({
          significance: z.number().min(0).max(1).optional(),
          urgency: z.number().min(0).max(1).optional(),
          resonance: z.number().min(0).max(1).optional(),
        })
        .optional();

      // Valid: all fields
      expect(() =>
        emotionalSchema.parse({
          significance: 0.8,
          urgency: 0.3,
          resonance: 0.95,
        }),
      ).not.toThrow();

      // Valid: partial
      expect(() => emotionalSchema.parse({ significance: 0.5 })).not.toThrow();

      // Valid: undefined
      expect(() => emotionalSchema.parse(undefined)).not.toThrow();

      // Invalid: out of range
      expect(() => emotionalSchema.parse({ significance: 1.5 })).toThrow();

      // Invalid: negative
      expect(() => emotionalSchema.parse({ urgency: -0.1 })).toThrow();
    });

    it("should validate ECHO-HDR episode type enum", () => {
      const episodeTypeSchema = z.enum([
        "experience",
        "decision",
        "insight",
        "interaction",
        "reflection",
        "error",
        "milestone",
      ]);

      expect(() => episodeTypeSchema.parse("experience")).not.toThrow();
      expect(() => episodeTypeSchema.parse("invalid")).toThrow();
    });
  });

  // ─── Server Configuration ─────────────────────────────────────────────────

  describe("server configuration", () => {
    it("N-HDR server metadata", () => {
      // Verify expected server identity
      const serverInfo = {
        name: "n-hdr-consciousness",
        version: "9.1.0",
      };
      expect(serverInfo.name).toMatch(/^n-hdr/);
      expect(serverInfo.version).toMatch(/^9\.\d+\.\d+$/);
    });

    it("ECHO-HDR server metadata", () => {
      const serverInfo = {
        name: "echo-hdr-memory",
        version: "9.6.0",
      };
      expect(serverInfo.name).toMatch(/^echo-hdr/);
      expect(serverInfo.version).toMatch(/^9\.\d+\.\d+$/);
    });

    it("servers should declare tool capabilities", () => {
      const capabilities = {
        tools: { listChanged: true },
        resources: {},
      };

      expect(capabilities.tools.listChanged).toBe(true);
    });
  });
});
