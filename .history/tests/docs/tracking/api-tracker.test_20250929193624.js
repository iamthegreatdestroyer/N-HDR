/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Tests for API change tracking system
 */

const fs = require("fs").promises;
const path = require("path");
const yaml = require("js-yaml");
const { expect } = require("chai");
const ApiTracker = require("../../../src/docs/tracking/api-tracker");

describe("ApiTracker", () => {
  let tracker;
  const tempDir = path.join(__dirname, "../../temp/api-tracker");

  const sampleApiSpec = {
    version: "1.0.0",
    paths: {
      "/consciousness": {
        get: {
          summary: "Get consciousness state",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              type: "string",
            },
          ],
          responses: {
            200: {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      state: { type: "string" },
                      dimension: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  beforeEach(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Initialize tracker with temp directory
    tracker = new ApiTracker({
      apiFile: path.join(tempDir, ".api-spec.yml"),
      changelogFile: path.join(tempDir, ".api-changelog.yml"),
      snapshotDir: path.join(tempDir, ".api-snapshots"),
    });

    await tracker.initialize();
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("initialization", () => {
    it("should create required directories and files", async () => {
      const dirExists = await fs
        .stat(tracker.options.snapshotDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).to.be.true;
    });

    it("should initialize with empty spec if no file exists", async () => {
      expect(tracker.currentSpec).to.deep.equal({
        version: "1.0.0",
        paths: {},
      });
    });
  });

  describe("trackChanges", () => {
    it("should detect added endpoints", async () => {
      const changes = await tracker.trackChanges(sampleApiSpec);

      expect(changes.changes).to.have.lengthOf(1);
      expect(changes.changes[0]).to.deep.include({
        type: "endpoint",
        action: "added",
        path: "/consciousness",
      });
    });

    it("should detect removed endpoints", async () => {
      // First add an endpoint
      await tracker.trackChanges(sampleApiSpec);

      // Then remove it
      const newSpec = {
        version: "1.0.0",
        paths: {},
      };

      const changes = await tracker.trackChanges(newSpec);

      expect(changes.changes).to.have.lengthOf(1);
      expect(changes.changes[0]).to.deep.include({
        type: "endpoint",
        action: "removed",
        path: "/consciousness",
      });
    });

    it("should detect modified parameters", async () => {
      // First add initial spec
      await tracker.trackChanges(sampleApiSpec);

      // Modify parameter
      const modifiedSpec = {
        ...sampleApiSpec,
        paths: {
          "/consciousness": {
            get: {
              ...sampleApiSpec.paths["/consciousness"].get,
              parameters: [
                {
                  name: "id",
                  in: "query",
                  required: false,
                  type: "string",
                },
              ],
            },
          },
        },
      };

      const changes = await tracker.trackChanges(modifiedSpec);

      const paramChanges = changes.changes.find((c) => c.type === "parameters");
      expect(paramChanges).to.exist;
      expect(paramChanges.changes[0]).to.deep.include({
        type: "parameter",
        action: "modified",
        name: "id",
      });
    });

    it("should detect breaking changes", async () => {
      // First add initial spec
      await tracker.trackChanges(sampleApiSpec);

      // Make breaking change - remove required parameter
      const modifiedSpec = {
        ...sampleApiSpec,
        paths: {
          "/consciousness": {
            get: {
              ...sampleApiSpec.paths["/consciousness"].get,
              parameters: [],
            },
          },
        },
      };

      const changes = await tracker.trackChanges(modifiedSpec);
      expect(changes.versionImpact.level).to.equal("major");
      expect(changes.versionImpact.breaking).to.have.lengthOf(1);
    });
  });

  describe("getChangelog", () => {
    beforeEach(async () => {
      // Add some changes
      await tracker.trackChanges(sampleApiSpec);

      const modifiedSpec = {
        ...sampleApiSpec,
        paths: {
          "/consciousness": {
            get: {
              ...sampleApiSpec.paths["/consciousness"].get,
              parameters: [],
            },
          },
        },
      };

      await tracker.trackChanges(modifiedSpec);
    });

    it("should filter by date", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const changes = await tracker.getChangelog({ since: yesterday });
      expect(changes).to.have.lengthOf(2);
    });

    it("should filter by impact", async () => {
      const changes = await tracker.getChangelog({ impact: "major" });
      expect(changes).to.have.lengthOf(1);
    });

    it("should filter by path", async () => {
      const changes = await tracker.getChangelog({ path: "/consciousness" });
      expect(changes).to.have.lengthOf(2);
    });
  });

  describe("snapshots", () => {
    it("should create snapshots when tracking changes", async () => {
      const changes = await tracker.trackChanges(sampleApiSpec);

      const timestamp = changes.timestamp.replace(/[:.]/g, "-");
      const snapshotPath = path.join(
        tracker.options.snapshotDir,
        `api-${timestamp}.yml`
      );

      const exists = await fs
        .stat(snapshotPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).to.be.true;
    });

    it("should retrieve snapshots", async () => {
      const changes = await tracker.trackChanges(sampleApiSpec);
      const timestamp = changes.timestamp.replace(/[:.]/g, "-");

      const snapshot = await tracker.getSnapshot(timestamp);
      expect(snapshot).to.deep.equal(sampleApiSpec);
    });

    it("should compare versions", async () => {
      // Create first version
      const changes1 = await tracker.trackChanges(sampleApiSpec);
      const timestamp1 = changes1.timestamp.replace(/[:.]/g, "-");

      // Create second version with changes
      const modifiedSpec = {
        ...sampleApiSpec,
        paths: {
          "/consciousness": {
            get: {
              ...sampleApiSpec.paths["/consciousness"].get,
              parameters: [],
            },
          },
        },
      };

      const changes2 = await tracker.trackChanges(modifiedSpec);
      const timestamp2 = changes2.timestamp.replace(/[:.]/g, "-");

      const comparison = await tracker.compareVersions(timestamp1, timestamp2);
      expect(comparison).to.have.lengthOf(1);
      expect(comparison[0].type).to.equal("parameters");
    });
  });

  describe("report generation", () => {
    beforeEach(async () => {
      await tracker.trackChanges(sampleApiSpec);
    });

    it("should generate markdown report", async () => {
      const report = await tracker.generateReport({ format: "markdown" });
      expect(report).to.include("# API Changelog");
      expect(report).to.include("### New Features");
    });

    it("should generate HTML report", async () => {
      const report = await tracker.generateReport({ format: "html" });
      expect(report).to.include("<!DOCTYPE html>");
      expect(report).to.include("API Changelog");
    });

    it("should generate JSON report", async () => {
      const report = await tracker.generateReport({ format: "json" });
      const parsed = JSON.parse(report);
      expect(parsed).to.be.an("array");
      expect(parsed[0]).to.have.property("changes");
    });

    it("should apply filters to reports", async () => {
      const report = await tracker.generateReport({
        format: "markdown",
        filters: {
          impact: "major",
        },
      });
      expect(report).not.to.include("### New Features");
    });
  });

  describe("edge cases", () => {
    it("should handle empty specs", async () => {
      const changes = await tracker.trackChanges({
        version: "1.0.0",
        paths: {},
      });
      expect(changes.changes).to.have.lengthOf(0);
    });

    it("should handle missing required directories", async () => {
      // Delete snapshot directory
      await fs.rm(tracker.options.snapshotDir, {
        recursive: true,
        force: true,
      });

      // Should recreate on next change
      const changes = await tracker.trackChanges(sampleApiSpec);
      expect(changes).to.exist;

      const dirExists = await fs
        .stat(tracker.options.snapshotDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).to.be.true;
    });

    it("should handle invalid snapshots", async () => {
      let error;
      try {
        await tracker.getSnapshot("non-existent");
      } catch (e) {
        error = e;
      }
      expect(error).to.exist;
      expect(error.message).to.include("Snapshot not found");
    });

    it("should handle concurrent modifications", async () => {
      // Create two trackers pointing to same files
      const tracker2 = new ApiTracker({
        apiFile: tracker.options.apiFile,
        changelogFile: tracker.options.changelogFile,
        snapshotDir: tracker.options.snapshotDir,
      });
      await tracker2.initialize();

      // Make changes with both trackers
      await Promise.all([
        tracker.trackChanges(sampleApiSpec),
        tracker2.trackChanges(sampleApiSpec),
      ]);

      const changelog = await tracker.getChangelog();
      expect(changelog).to.have.lengthOf(2);
    });
  });
});
