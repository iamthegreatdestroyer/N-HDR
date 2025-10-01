#!/usr/bin/env node

/*
 * HDR Empire Framework - Require to Import Converter
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

/**
 * Recursively find all JavaScript files in a directory
 */
function findJavaScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, coverage, and history directories
      if (
        !["node_modules", ".git", "coverage", ".history", "backups"].includes(
          file
        )
      ) {
        findJavaScriptFiles(filePath, fileList);
      }
    } else if (
      file.endsWith(".js") &&
      !file.includes(".test.") &&
      !file.includes(".spec.")
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Convert require() to import statements in a single file
 */
function convertRequireToImport(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  let newContent = content;

  // Pattern 1: const ClassName = require("./path");
  const requirePattern1 =
    /^const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\);?$/gm;
  newContent = newContent.replace(
    requirePattern1,
    (match, className, modulePath) => {
      modified = true;
      // Add .js extension if it's a relative path and doesn't have one
      if (
        (modulePath.startsWith("./") || modulePath.startsWith("../")) &&
        !modulePath.endsWith(".js")
      ) {
        modulePath += ".js";
      }
      return `import ${className} from "${modulePath}";`;
    }
  );

  // Pattern 2: const { something } = require("./path");
  const requirePattern2 =
    /^const\s+\{([^}]+)\}\s*=\s*require\(["']([^"']+)["']\);?$/gm;
  newContent = newContent.replace(
    requirePattern2,
    (match, imports, modulePath) => {
      modified = true;
      // Add .js extension if it's a relative path and doesn't have one
      if (
        (modulePath.startsWith("./") || modulePath.startsWith("../")) &&
        !modulePath.endsWith(".js")
      ) {
        modulePath += ".js";
      }
      return `import {${imports}} from "${modulePath}";`;
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(
      `✓ Converted require to import: ${path.relative(rootDir, filePath)}`
    );
    return true;
  }

  return false;
}

/**
 * Main execution
 */
function main() {
  console.log("HDR Empire Framework - Require to Import Converter");
  console.log("===================================================\n");

  const srcDir = path.join(rootDir, "src");
  const jsFiles = findJavaScriptFiles(srcDir);

  console.log(`Found ${jsFiles.length} JavaScript files to check\n`);

  let convertedCount = 0;

  for (const filePath of jsFiles) {
    if (convertRequireToImport(filePath)) {
      convertedCount++;
    }
  }

  console.log(`\n✓ Converted ${convertedCount} files from require to import`);

  if (convertedCount === 0) {
    console.log("✓ All files already use import statements");
  }
}

main();
