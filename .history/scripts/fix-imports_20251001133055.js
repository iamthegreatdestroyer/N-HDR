#!/usr/bin/env node

/*
 * HDR Empire Framework - Import Fixer Script
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
 * Fix imports in a single file
 */
function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Pattern to match import statements with relative paths missing .js extension
  // Matches: import ... from "../path/to/module" or "./path/to/module"
  // But NOT: import ... from "@tensorflow/tfjs" or other npm packages
  const importPattern =
    /^(import\s+.+\s+from\s+['"])(\.\.\/.+?|\.\/.*?)(['"];?)$/gm;

  let newContent = content.replace(
    importPattern,
    (match, prefix, importPath, suffix) => {
      // Skip if already has .js extension
      if (importPath.endsWith(".js")) {
        return match;
      }

      // Skip if it's a directory import (we'll handle those separately)
      // Skip if it's an npm package
      if (
        importPath.startsWith("@") ||
        (!importPath.startsWith(".") && !importPath.startsWith(".."))
      ) {
        return match;
      }

      modified = true;
      return `${prefix}${importPath}.js${suffix}`;
    }
  );

  // Fix named imports that should be default imports for specific modules
  // SecurityManager and QuantumProcessor use default exports
  const namedToDefaultPattern =
    /import\s+\{\s*(SecurityManager|QuantumProcessor|ConsciousnessLayer|NanoSwarmHDR|ConceptualSwarmDeployer|ConsciousnessStateTransferProtocol|KnowledgeCrystallizer|ExpertiseEngine|CrystallineStorage)\s*\}\s+from\s+(['"].*?['"];?)/g;

  newContent = newContent.replace(
    namedToDefaultPattern,
    (match, className, fromClause) => {
      modified = true;
      return `import ${className} from ${fromClause}`;
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(`✓ Fixed imports in: ${path.relative(rootDir, filePath)}`);
    return true;
  }

  return false;
}

/**
 * Main execution
 */
function main() {
  console.log("HDR Empire Framework - Import Fixer");
  console.log("===================================\n");

  const srcDir = path.join(rootDir, "src");
  const jsFiles = findJavaScriptFiles(srcDir);

  console.log(`Found ${jsFiles.length} JavaScript files to check\n`);

  let fixedCount = 0;

  for (const filePath of jsFiles) {
    if (fixImportsInFile(filePath)) {
      fixedCount++;
    }
  }

  console.log(`\n✓ Fixed imports in ${fixedCount} files`);

  if (fixedCount === 0) {
    console.log("✓ All imports already have .js extensions");
  }
}

main();
