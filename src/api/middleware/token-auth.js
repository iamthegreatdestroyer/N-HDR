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

import SecurityManager from "../../core/security/security-manager.js";

/**
 * Middleware for token-based authentication
 * @param {Object} config - Configuration object
 * @returns {Function} Express middleware function
 */
function tokenAuth(config) {
  const security = new SecurityManager(config);

  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Token is required",
        });
      }

      // Validate token
      const validationResult = await security.validateToken(token);
      if (!validationResult.valid) {
        return res.status(401).json({
          error: "Authentication failed",
          message: validationResult.message,
        });
      }

      // Attach validated user to request
      req.user = validationResult.user;
      next();
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({
        error: "Authentication error",
        message: "Failed to validate token",
      });
    }
  };
}

export default tokenAuth;
