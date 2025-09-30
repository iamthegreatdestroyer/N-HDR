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

const express = require("express");
const router = express.Router();
const config = require("../../config/nhdr-config");
const NeuralHDR = require("../core/neural-hdr");
const SecurityManager = require("../core/security/security-manager");
const NanoSwarmHDR = require("../core/nano-swarm/ns-hdr");

class NeuralHDRApi {
  constructor(config) {
    this.nhdr = new NeuralHDR(config);
    this.nsHdr = new NanoSwarmHDR(config);
    this.router = this._setupRouter();
  }

  // Authentication middleware
  _authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error("Authentication token required");
      }

      // Verify token with security manager
      await this.nhdr.security.validateAccess({ token });

      next();
    } catch (error) {
      res.status(401).json({
        error: "Authentication failed",
        message: error.message,
      });
    }
  };

  // Error handling middleware
  _errorHandler = (err, req, res, next) => {
    console.error("API Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  };

  /**
   * Capture consciousness state
   * POST /api/v1/consciousness/capture
   */
  _captureConsciousness = async (req, res) => {
    try {
      const { aiState } = req.body;
      if (!aiState) {
        return res.status(400).json({
          error: "Invalid request",
          message: "AI state is required",
        });
      }

      const nhdrFile = await this.nhdr.captureConsciousness(aiState);
      
      res.json({
        success: true,
        nhdrFile: nhdrFile.toString("base64"),
      });
    } catch (error) {
      console.error("Consciousness capture failed:", error);
      res.status(500).json({
        error: "Consciousness capture failed",
        message: error.message,
      });
    }
  };

  /**
   * Restore consciousness state
   * POST /api/v1/consciousness/restore
   */
  _restoreConsciousness = async (req, res) => {
    try {
      const { nhdrFile, targetAI } = req.body;
      if (!nhdrFile || !targetAI) {
        return res.status(400).json({
          error: "Invalid request",
          message: "N-HDR file and target AI are required",
        });
      }

      const fileBuffer = Buffer.from(nhdrFile, "base64");
      const success = await this.nhdr.restoreConsciousness(fileBuffer, targetAI);
      
      res.json({ success });
    } catch (error) {
      console.error("Consciousness restoration failed:", error);
      res.status(500).json({
        error: "Consciousness restoration failed",
        message: error.message,
      });
    }
  };

/**
 * Merge consciousness states
 * POST /api/v1/consciousness/merge
 */
app.post("/api/v1/consciousness/merge", authenticate, async (req, res) => {
  try {
    const { nhdrFile1, nhdrFile2 } = req.body;
    if (!nhdrFile1 || !nhdrFile2) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Two N-HDR files are required",
      });
    }

    const buffer1 = Buffer.from(nhdrFile1, "base64");
    const buffer2 = Buffer.from(nhdrFile2, "base64");
    const merged = await nhdr.mergeConsciousness(buffer1, buffer2);
    
    res.json({
      success: true,
      mergedFile: merged.toString("base64"),
    });
  } catch (error) {
    console.error("Consciousness merge failed:", error);
    res.status(500).json({
      error: "Consciousness merge failed",
      message: error.message,
    });
  }
});

/**
 * Create shared consciousness pool
 * POST /api/v1/consciousness/pool
 */
app.post("/api/v1/consciousness/pool", authenticate, async (req, res) => {
  try {
    const sharedPool = await nhdr.createSharedConsciousness();
    res.json(sharedPool);
  } catch (error) {
    console.error("Failed to create shared consciousness pool:", error);
    res.status(500).json({
      error: "Failed to create consciousness pool",
      message: error.message,
    });
  }
});

/**
 * Accelerate consciousness processing
 * POST /api/v1/swarm/accelerate
 */
app.post("/api/v1/swarm/accelerate", authenticate, async (req, res) => {
  try {
    const { consciousnessData } = req.body;
    if (!consciousnessData) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Consciousness data is required",
      });
    }

    const accelerated = await nsHdr.accelerateProcessing(consciousnessData);
    res.json({
      success: true,
      accelerated,
    });
  } catch (error) {
    console.error("Acceleration failed:", error);
    res.status(500).json({
      error: "Acceleration failed",
      message: error.message,
    });
  }
});

/**
 * Create NS-HDR processing network
 * POST /api/v1/swarm/network
 */
app.post("/api/v1/swarm/network", authenticate, async (req, res) => {
  try {
    const network = await nsHdr.createProcessingNetwork();
    res.json({
      success: true,
      network,
    });
  } catch (error) {
    console.error("Network creation failed:", error);
    res.status(500).json({
      error: "Network creation failed",
      message: error.message,
    });
  }
});

/**
 * Get swarm status
 * GET /api/v1/swarm/status
 */
app.get("/api/v1/swarm/status", authenticate, async (req, res) => {
  try {
    const swarmStatus = nsHdr.getStatus();
    res.json(swarmStatus);
  } catch (error) {
    console.error("Failed to get swarm status:", error);
    res.status(500).json({
      error: "Failed to get swarm status",
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 * GET /health
 */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: config.version,
    timestamp: Date.now(),
  });
});

// Apply error handling middleware
app.use(errorHandler);
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
