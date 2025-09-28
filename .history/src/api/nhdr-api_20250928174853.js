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
 * File: nhdr-api.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import NeuralHDR from "../core/neural-hdr";
import NanoSwarmHDR from "../core/nano-swarm/ns-hdr";
import config from "../../config/nhdr-config";

// Create Express app
const app = express();
const nhdr = new NeuralHDR();
const nsHdr = new NanoSwarmHDR();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "50mb" }));

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const validated = await nhdr.security.validateAccess({ token });

    if (!validated) {
      return res.status(403).json({ error: "Invalid authentication token" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    version: config.version,
    timestamp: Date.now(),
  });
});

/**
 * Capture consciousness endpoint
 */
app.post("/api/consciousness/capture", authenticate, async (req, res) => {
  try {
    const { aiState } = req.body;

    if (!aiState) {
      return res.status(400).json({ error: "AI state data required" });
    }

    // Capture consciousness
    const nhdrFile = await nhdr.captureConsciousness(aiState);

    // Accelerate if NS-HDR enabled
    if (config.acceleration.nanoSwarmIntegration) {
      const accelerated = await nsHdr.accelerateProcessing(nhdrFile);
      return res.json({ data: accelerated });
    }

    res.json({ data: nhdrFile });
  } catch (error) {
    console.error("Consciousness capture failed:", error);
    res.status(500).json({ error: "Failed to capture consciousness" });
  }
});

/**
 * Restore consciousness endpoint
 */
app.post("/api/consciousness/restore", authenticate, async (req, res) => {
  try {
    const { nhdrFile, targetAI } = req.body;

    if (!nhdrFile || !targetAI) {
      return res
        .status(400)
        .json({ error: "NHDR file and target AI required" });
    }

    // Restore consciousness
    const success = await nhdr.restoreConsciousness(nhdrFile, targetAI);

    res.json({ success });
  } catch (error) {
    console.error("Consciousness restoration failed:", error);
    res.status(500).json({ error: "Failed to restore consciousness" });
  }
});

/**
 * Merge consciousness endpoint
 */
app.post("/api/consciousness/merge", authenticate, async (req, res) => {
  try {
    const { nhdrFile1, nhdrFile2 } = req.body;

    if (!nhdrFile1 || !nhdrFile2) {
      return res.status(400).json({ error: "Two NHDR files required" });
    }

    // Merge consciousness states
    const merged = await nhdr.mergeConsciousness(nhdrFile1, nhdrFile2);

    res.json({ data: merged });
  } catch (error) {
    console.error("Consciousness merge failed:", error);
    res.status(500).json({ error: "Failed to merge consciousness" });
  }
});

/**
 * Create shared consciousness endpoint
 */
app.post("/api/consciousness/share", authenticate, async (req, res) => {
  try {
    // Create shared consciousness pool
    const sharedPool = await nhdr.createSharedConsciousness();

    res.json({ data: sharedPool });
  } catch (error) {
    console.error("Shared consciousness creation failed:", error);
    res.status(500).json({ error: "Failed to create shared consciousness" });
  }
});

/**
 * NS-HDR optimization endpoint
 */
app.post("/api/ns-hdr/optimize", authenticate, async (req, res) => {
  try {
    const { quantumState } = req.body;

    if (!quantumState) {
      return res.status(400).json({ error: "Quantum state required" });
    }

    // Optimize quantum processing
    const optimized = await nsHdr.optimizeQuantumProcessing(quantumState);

    res.json({ data: optimized });
  } catch (error) {
    console.error("NS-HDR optimization failed:", error);
    res.status(500).json({ error: "Failed to optimize quantum processing" });
  }
});

/**
 * NS-HDR network creation endpoint
 */
app.post("/api/ns-hdr/network", authenticate, async (req, res) => {
  try {
    // Create processing network
    const network = await nsHdr.createProcessingNetwork();

    res.json({ data: network });
  } catch (error) {
    console.error("Network creation failed:", error);
    res.status(500).json({ error: "Failed to create processing network" });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
