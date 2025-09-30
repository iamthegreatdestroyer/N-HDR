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
 * File: DocumentIngestionModule.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import * as tf from "@tensorflow/tfjs";
import DocumentIngestionModule from "../../src/analyzer/DocumentIngestionModule";
import config from "../../config/nhdr-config";

describe("DocumentIngestionModule", () => {
  let ingestionModule;
  let mockDocument;

  beforeEach(() => {
    ingestionModule = new DocumentIngestionModule();
    mockDocument = {
      id: "test-doc-1",
      content:
        "This is a test document with sufficient content length for processing",
      metadata: {
        type: "test",
        timestamp: Date.now(),
      },
    };
  });

  afterEach(() => {
    tf.disposeVariables();
  });

  describe("ingestDocument", () => {
    it("should successfully ingest a valid document", async () => {
      const result = await ingestionModule.ingestDocument(mockDocument);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.documentId).toBeDefined();
      expect(result.dimensions).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it("should fail for invalid document structure", async () => {
      const invalidDocument = { content: null };

      await expect(
        ingestionModule.ingestDocument(invalidDocument)
      ).rejects.toThrow("Invalid document structure");
    });

    it("should fail for insufficient content length", async () => {
      const shortDocument = {
        id: "test-doc-2",
        content: "Too short",
      };

      await expect(
        ingestionModule.ingestDocument(shortDocument)
      ).rejects.toThrow("Document content too short");
    });
  });

  describe("extractSemantics", () => {
    it("should extract semantic information from document", async () => {
      const semantics = await ingestionModule.extractSemantics(mockDocument);

      expect(semantics).toBeDefined();
      expect(typeof semantics).toBe("object");
    });
  });

  describe("createQuantumEmbeddings", () => {
    it("should create quantum-enhanced embeddings", async () => {
      const embeddings = await ingestionModule.createQuantumEmbeddings(
        mockDocument
      );

      expect(embeddings).toBeDefined();
      expect(embeddings instanceof tf.Tensor).toBe(true);
      expect(embeddings.shape.length).toBeGreaterThanOrEqual(2);
    });

    it("should add quantum noise to embeddings", async () => {
      const baseEmbeddings = await ingestionModule.createQuantumEmbeddings(
        mockDocument
      );
      const enhancedEmbeddings = await ingestionModule.createQuantumEmbeddings(
        mockDocument
      );

      const baseMean = tf.mean(baseEmbeddings).dataSync()[0];
      const enhancedMean = tf.mean(enhancedEmbeddings).dataSync()[0];

      expect(baseMean).not.toBe(enhancedMean);
    });
  });
});
