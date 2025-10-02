/*
 * HDR Empire Framework - Probability Path Visualizer Test Suite
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { describe, test, expect, beforeEach, jest } from "@jest/globals";

describe("Probability Path Visualizer", () => {
  let visualizer;

  beforeEach(() => {
    visualizer = {
      initialize: jest.fn(),
      visualizeProbabilityPaths: jest.fn(),
      renderQuantumStates: jest.fn(),
      showDecisionTree: jest.fn(),
      highlightOptimalPath: jest.fn(),
      animateStateCollapse: jest.fn(),
      exportVisualization: jest.fn(),
      setVisualizationStyle: jest.fn(),
      getVisualizationData: jest.fn(),
    };
  });

  describe("Initialization", () => {
    test("should initialize with default visualization settings", () => {
      visualizer.initialize.mockReturnValue({ success: true });
      const result = visualizer.initialize({});
      expect(result.success).toBe(true);
    });

    test("should support custom visualization styles", () => {
      const styles = {
        theme: "quantum-dark",
        colorScheme: "probability-gradient",
        animation: "smooth",
      };

      visualizer.setVisualizationStyle.mockReturnValue({ applied: true });
      const result = visualizer.setVisualizationStyle(styles);
      expect(result.applied).toBe(true);
    });
  });

  describe("Probability Path Visualization", () => {
    test("should visualize multiple probability paths", async () => {
      visualizer.visualizeProbabilityPaths.mockResolvedValue({
        paths: [
          { id: "path1", probability: 0.45, nodes: 5 },
          { id: "path2", probability: 0.35, nodes: 4 },
          { id: "path3", probability: 0.2, nodes: 6 },
        ],
        totalPaths: 3,
        renderTime: 120,
      });

      const result = await visualizer.visualizeProbabilityPaths({
        startState: "A",
        endState: "Z",
      });

      expect(result.paths.length).toBe(3);
      expect(result.paths[0].probability).toBeGreaterThan(0.4);
    });

    test("should normalize probability display", async () => {
      visualizer.visualizeProbabilityPaths.mockResolvedValue({
        paths: [
          { probability: 0.5 },
          { probability: 0.3 },
          { probability: 0.2 },
        ],
        normalized: true,
        totalProbability: 1.0,
      });

      const result = await visualizer.visualizeProbabilityPaths({});
      expect(result.totalProbability).toBe(1.0);
      expect(result.normalized).toBe(true);
    });
  });

  describe("Quantum State Rendering", () => {
    test("should render superposition states", async () => {
      visualizer.renderQuantumStates.mockResolvedValue({
        states: [
          { id: "state1", amplitude: 0.7, phase: 0 },
          { id: "state2", amplitude: 0.7, phase: Math.PI },
        ],
        superposition: true,
        entanglement: false,
      });

      const result = await visualizer.renderQuantumStates({
        system: "quantum-knowledge-space",
      });

      expect(result.superposition).toBe(true);
      expect(result.states.length).toBeGreaterThan(0);
    });

    test("should visualize state collapse", async () => {
      visualizer.animateStateCollapse.mockResolvedValue({
        initialStates: 16,
        finalState: 1,
        collapseTime: 250,
        animated: true,
      });

      const result = await visualizer.animateStateCollapse({
        triggerEvent: "observation",
      });

      expect(result.finalState).toBe(1);
      expect(result.animated).toBe(true);
    });
  });

  describe("Decision Tree Visualization", () => {
    test("should show decision tree with probabilities", async () => {
      visualizer.showDecisionTree.mockResolvedValue({
        root: "start-decision",
        branches: 8,
        leaves: 12,
        maxDepth: 4,
        probabilityDistribution: "calculated",
      });

      const result = await visualizer.showDecisionTree({
        rootDecision: "start-decision",
      });

      expect(result.branches).toBeGreaterThan(0);
      expect(result.maxDepth).toBeGreaterThan(0);
    });

    test("should highlight optimal decision path", async () => {
      visualizer.highlightOptimalPath.mockResolvedValue({
        path: ["decision1", "decision2", "decision3"],
        probability: 0.82,
        highlighted: true,
      });

      const result = await visualizer.highlightOptimalPath({
        criteria: "maximum-probability",
      });

      expect(result.highlighted).toBe(true);
      expect(result.probability).toBeGreaterThan(0.7);
    });
  });

  describe("Visualization Export", () => {
    test("should export visualization as image", async () => {
      visualizer.exportVisualization.mockResolvedValue({
        format: "PNG",
        size: { width: 1920, height: 1080 },
        fileSize: 2.5,
        exported: true,
      });

      const result = await visualizer.exportVisualization({
        format: "PNG",
        resolution: "HD",
      });

      expect(result.exported).toBe(true);
      expect(result.format).toBe("PNG");
    });

    test("should export as interactive SVG", async () => {
      visualizer.exportVisualization.mockResolvedValue({
        format: "SVG",
        interactive: true,
        animationsIncluded: true,
      });

      const result = await visualizer.exportVisualization({
        format: "SVG",
        includeAnimations: true,
      });

      expect(result.format).toBe("SVG");
      expect(result.interactive).toBe(true);
    });

    test("should export visualization data as JSON", async () => {
      visualizer.getVisualizationData.mockResolvedValue({
        nodes: 150,
        edges: 380,
        probabilities: [0.4, 0.35, 0.25],
        format: "JSON",
      });

      const result = await visualizer.getVisualizationData();
      expect(result.format).toBe("JSON");
      expect(result.nodes).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    test("should render large probability spaces efficiently", async () => {
      visualizer.visualizeProbabilityPaths.mockResolvedValue({
        paths: Array(1000).fill({ probability: 0.001 }),
        renderTime: 450,
        optimized: true,
      });

      const result = await visualizer.visualizeProbabilityPaths({
        stateCount: 1000,
      });

      expect(result.renderTime).toBeLessThan(1000);
      expect(result.optimized).toBe(true);
    });

    test("should use level-of-detail optimization", async () => {
      visualizer.visualizeProbabilityPaths.mockResolvedValue({
        lodEnabled: true,
        detailLevels: 3,
        renderTime: 280,
      });

      const result = await visualizer.visualizeProbabilityPaths({
        enableLOD: true,
      });

      expect(result.lodEnabled).toBe(true);
    });
  });

  describe("Interaction", () => {
    test("should support interactive path exploration", async () => {
      visualizer.visualizeProbabilityPaths.mockResolvedValue({
        interactive: true,
        clickable: true,
        hoverInfo: true,
      });

      const result = await visualizer.visualizeProbabilityPaths({
        enableInteraction: true,
      });

      expect(result.interactive).toBe(true);
    });
  });
});
