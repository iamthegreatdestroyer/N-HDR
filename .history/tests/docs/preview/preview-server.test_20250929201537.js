/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Tests for documentation preview server
 */

const path = require("path");
const fs = require("fs").promises;
const WebSocket = require("ws");
const PreviewServer = require("../../src/docs/preview/preview-server");

describe("PreviewServer", () => {
  let server;
  let ws;
  const testPort = 3001;
  const testDir = path.join(__dirname, "test-docs");

  beforeAll(async () => {
    // Create test docs directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test markdown file
    await fs.writeFile(
      path.join(testDir, "test.md"),
      "# Test Document\n\nThis is a test."
    );

    // Create test subdirectory with files
    const subDir = path.join(testDir, "subdir");
    await fs.mkdir(subDir, { recursive: true });
    await fs.writeFile(
      path.join(subDir, "nested.md"),
      "# Nested Document\n\nThis is nested."
    );

    // Create test config file
    await fs.writeFile(
      path.join(testDir, "config.yml"),
      "key: value\narray:\n  - item1\n  - item2"
    );
  });

  beforeEach(async () => {
    server = new PreviewServer({
      port: testPort,
      docsDir: testDir,
      autoOpen: false,
    });
    await server.start();

    // Connect WebSocket client
    ws = new WebSocket(`ws://localhost:${testPort}`);
    await new Promise((resolve) => ws.on("open", resolve));
  });

  afterEach(async () => {
    ws.close();
    await server.stop();
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test("serves static files", async () => {
    const response = await fetch(`http://localhost:${testPort}/test.md`);
    const content = await response.text();
    expect(content).toContain("# Test Document");
  });

  test("renders markdown files", async () => {
    const response = await fetch(`http://localhost:${testPort}/test.md`);
    const content = await response.text();
    expect(content).toContain("<h1>Test Document</h1>");
  });

  test("renders yaml files", async () => {
    const response = await fetch(`http://localhost:${testPort}/config.yml`);
    const content = await response.text();
    expect(content).toContain("language-yaml");
    expect(content).toContain("key: value");
  });

  test("returns 404 for missing files", async () => {
    const response = await fetch(`http://localhost:${testPort}/nonexistent.md`);
    expect(response.status).toBe(404);
    const content = await response.text();
    expect(content).toContain("Page Not Found");
  });

  test("generates table of contents", async () => {
    const response = await fetch(`http://localhost:${testPort}/api/toc`);
    const toc = await response.json();

    expect(toc).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Test Document",
          path: "test.md",
        }),
        expect.objectContaining({
          title: "subdir",
          children: expect.arrayContaining([
            expect.objectContaining({
              title: "Nested Document",
              path: "subdir/nested.md",
            }),
          ]),
        }),
      ])
    );
  });

  test("handles search requests", async () => {
    const query = "test";
    const response = await fetch(
      `http://localhost:${testPort}/api/search?q=${query}`
    );
    const results = await response.json();

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Test Document",
          path: "test.md",
          excerpt: expect.stringContaining("test"),
        }),
      ])
    );
  });

  test("sends file updates via WebSocket", async () => {
    const messagePromise = new Promise((resolve) => {
      ws.on("message", (data) => {
        const message = JSON.parse(data);
        if (message.type === "refresh") {
          resolve(message);
        }
      });
    });

    // Modify test file
    await fs.writeFile(
      path.join(testDir, "test.md"),
      "# Updated Document\n\nThis is updated."
    );

    const message = await messagePromise;
    expect(message.type).toBe("refresh");
    expect(message.toc).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Updated Document",
          path: "test.md",
        }),
      ])
    );
  });

  test("handles WebSocket page requests", (done) => {
    ws.on("message", (data) => {
      const message = JSON.parse(data);

      if (message.type === "pageContent") {
        expect(message.page).toBe("test.md");
        expect(message.content).toContain("<h1>Test Document</h1>");
        done();
      }
    });

    ws.send(
      JSON.stringify({
        type: "requestPage",
        page: "test.md",
      })
    );
  });

  test("handles WebSocket search requests", (done) => {
    ws.on("message", (data) => {
      const message = JSON.parse(data);

      if (message.type === "searchResults") {
        expect(message.results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: "Test Document",
              path: "test.md",
              excerpt: expect.stringContaining("test"),
            }),
          ])
        );
        done();
      }
    });

    ws.send(
      JSON.stringify({
        type: "search",
        query: "test",
      })
    );
  });

  test("handles WebSocket errors gracefully", (done) => {
    ws.on("message", (data) => {
      const message = JSON.parse(data);

      if (message.type === "error") {
        expect(message.error).toBeTruthy();
        done();
      }
    });

    ws.send("invalid json");
  });
});
