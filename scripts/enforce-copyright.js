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
 * File: enforce-copyright.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

const fs = require("fs");
const path = require("path");

const COPYRIGHT_HEADER = `/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 * 
 * File: [filename]
 * Created: [date]
 * HDR Empire - Pioneering the Future of AI Consciousness
 */`;

// File extensions to check
const EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".css", ".scss", ".html"];

// Directories to ignore
const IGNORE_DIRS = ["node_modules", "dist", "coverage", ".git"];

function enforceHeaders(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !IGNORE_DIRS.includes(file)) {
      enforceHeaders(fullPath);
      continue;
    }

    const ext = path.extname(file);
    if (!EXTENSIONS.includes(ext)) continue;

    let content = fs.readFileSync(fullPath, "utf8");

    // Check if file already has copyright header
    if (
      content.includes("Stephen Bilodeau") &&
      content.includes("PATENT PENDING")
    ) {
      continue;
    }

    // Add header
    const header = COPYRIGHT_HEADER.replace("[filename]", file).replace(
      "[date]",
      new Date().toISOString().split("T")[0]
    );

    fs.writeFileSync(fullPath, header + "\n\n" + content);
    console.log(`Added copyright header to ${fullPath}`);
  }
}

// Run from project root
enforceHeaders(path.resolve(__dirname, ".."));
console.log("Copyright enforcement complete");
