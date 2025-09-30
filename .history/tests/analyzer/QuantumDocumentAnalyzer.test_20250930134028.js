/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: QuantumDocumentAnalyzer.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import QuantumDocumentAnalyzer from "../../src/analyzer/QuantumDocumentAnalyzer";
import DocumentIngestionModule from "../../src/analyzer/DocumentIngestionModule";
import ConceptualSwarmDeployer from "../../src/analyzer/ConceptualSwarmDeployer";
import KnowledgeExtractionEngine from "../../src/analyzer/KnowledgeExtractionEngine";
import { SecurityManager } from "../../src/core/security/security-manager";
import config from "../../config/nhdr-config";

jest.mock("../../src/analyzer/DocumentIngestionModule");
jest.mock("../../src/analyzer/ConceptualSwarmDeployer");
jest.mock("../../src/analyzer/KnowledgeExtractionEngine");
jest.mock("../../src/core/security/security-manager");

describe("QuantumDocumentAnalyzer", () => {
  let analyzer;
  let mockDocument;

  beforeEach(() => {
    analyzer = new QuantumDocumentAnalyzer();
    mockDocument = {
      id: "test-doc-1",
      content: "Test document for quantum analysis",
      metadata: {
        type: "test",
        timestamp: Date.now(),
      },
    };

    // Mock SecurityManager methods
    SecurityManager.prototype.secureDocument = jest.fn().mockResolvedValue({
      ...mockDocument,
      secured: true,
    });
    SecurityManager.prototype.generateIntegrityHash = jest
      .fn()
      .mockResolvedValue("test-hash");

    // Mock DocumentIngestionModule methods
    DocumentIngestionModule.prototype.ingestDocument = jest
      .fn()
      .mockResolvedValue({
        success: true,
        documentId: "ingestion-1",
        dimensions: [3, 3, 3],
      });

    // Mock ConceptualSwarmDeployer methods
    ConceptualSwarmDeployer.prototype.deploySwarm = jest
      .fn()
      .mockResolvedValue({
        success: true,
        deploymentId: "deployment-1",
        network: "network-1",
        swarmSize: 100,
      });
    ConceptualSwarmDeployer.prototype.monitorProgress = jest
      .fn()
      .mockResolvedValue({
        progress: 100,
        status: "completed",
      });
    ConceptualSwarmDeployer.prototype.collectResults = jest
      .fn()
      .mockResolvedValue({
        results: {
          quantum: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ],
        },
      });

    // Mock KnowledgeExtractionEngine methods
    KnowledgeExtractionEngine.prototype.extractKnowledge = jest
      .fn()
      .mockResolvedValue({
        success: true,
        extractionId: "extract-1",
        knowledge: {
          nodes: [],
          edges: [],
        },
      });
  });

  describe("initializeAnalysis", () => {
    it("should successfully initialize analysis session", async () => {
      const result = await analyzer.initializeAnalysis(mockDocument);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.analysisId).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it("should secure document during initialization", async () => {
      await analyzer.initializeAnalysis(mockDocument);
      expect(SecurityManager.prototype.secureDocument).toHaveBeenCalledWith(
        mockDocument
      );
    });

    it("should fail if security initialization fails", async () => {
      SecurityManager.prototype.secureDocument = jest
        .fn()
        .mockRejectedValue(new Error("Security initialization failed"));

      await expect(analyzer.initializeAnalysis(mockDocument)).rejects.toThrow(
        "Failed to initialize analysis"
      );
    });
  });

  describe("analyzeDocument", () => {
    let analysisId;

    beforeEach(async () => {
      const init = await analyzer.initializeAnalysis(mockDocument);
      analysisId = init.analysisId;
    });

    it("should successfully complete full analysis", async () => {
      const result = await analyzer.analyzeDocument(analysisId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.analysisId).toBe(analysisId);
      expect(result.results).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it("should fail for invalid analysis ID", async () => {
      await expect(analyzer.analyzeDocument("invalid-id")).rejects.toThrow(
        "Invalid analysis ID"
      );
    });

    it("should execute all analysis steps in order", async () => {
      await analyzer.analyzeDocument(analysisId);

      expect(
        DocumentIngestionModule.prototype.ingestDocument
      ).toHaveBeenCalled();
      expect(ConceptualSwarmDeployer.prototype.deploySwarm).toHaveBeenCalled();
      expect(
        ConceptualSwarmDeployer.prototype.monitorProgress
      ).toHaveBeenCalled();
      expect(
        ConceptualSwarmDeployer.prototype.collectResults
      ).toHaveBeenCalled();
      expect(
        KnowledgeExtractionEngine.prototype.extractKnowledge
      ).toHaveBeenCalled();
    });
  });

  describe("getAnalysisProgress", () => {
    let analysisId;

    beforeEach(async () => {
      const init = await analyzer.initializeAnalysis(mockDocument);
      analysisId = init.analysisId;
    });

    it("should return progress for active analysis", async () => {
      await analyzer.analyzeDocument(analysisId);
      const progress = await analyzer.getAnalysisProgress(analysisId);

      expect(progress).toBeDefined();
      expect(progress.analysisId).toBe(analysisId);
      expect(progress.progress).toBeDefined();
      expect(progress.status).toBeDefined();
      expect(progress.timestamp).toBeDefined();
    });

    it("should return pending status for new analysis", async () => {
      const progress = await analyzer.getAnalysisProgress(analysisId);

      expect(progress.status).toBe("pending");
      expect(progress.progress).toBe(0);
    });

    it("should fail for invalid analysis ID", async () => {
      await expect(analyzer.getAnalysisProgress("invalid-id")).rejects.toThrow(
        "Invalid analysis ID"
      );
    });
  });
});
