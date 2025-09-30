/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 */

const SecurityManager = require("../../core/security/security-manager");

/**
 * Middleware for biometric authentication
 * @param {Object} config - Configuration object
 * @returns {Function} Express middleware function
 */
function biometricAuth(config) {
  const security = new SecurityManager(config);

  return async (req, res, next) => {
    try {
      // Get biometric data from request
      const { biometricData } = req.body;
      if (!biometricData) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Biometric data is required"
        });
      }

      // Validate biometric data
      const validationResult = await security.validateBiometric(biometricData);
      if (!validationResult.valid) {
        return res.status(401).json({
          error: "Authentication failed",
          message: validationResult.message
        });
      }

      // Attach validated identity to request
      req.identity = validationResult.identity;
      next();
    } catch (error) {
      console.error("Biometric validation error:", error);
      res.status(500).json({
        error: "Authentication error",
        message: "Failed to validate biometric data"
      });
    }
  };
}

module.exports = biometricAuth;