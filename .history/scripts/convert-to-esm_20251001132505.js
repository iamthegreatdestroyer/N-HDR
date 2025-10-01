#!/usr/bin/env node

/*
 * HDR Empire Framework - CommonJS to ESM Converter
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

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
      if (!['node_modules', '.git', 'coverage', '.history', 'backups'].includes(file)) {
        findJavaScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Convert CommonJS exports to ESM in a single file
 */
function convertToESM(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace module.exports = ClassName; with export default ClassName;
  const moduleExportsPattern = /^module\.exports\s*=\s*(.+);$/gm;
  
  const newContent = content.replace(moduleExportsPattern, (match, className) => {
    modified = true;
    return `export default ${className};`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Converted to ESM: ${path.relative(rootDir, filePath)}`);
    return true;
  }
  
  return false;
}

/**
 * Main execution
 */
function main() {
  console.log('HDR Empire Framework - CommonJS to ESM Converter');
  console.log('================================================\n');
  
  const srcDir = path.join(rootDir, 'src');
  const jsFiles = findJavaScriptFiles(srcDir);
  
  console.log(`Found ${jsFiles.length} JavaScript files to check\n`);
  
  let convertedCount = 0;
  
  for (const filePath of jsFiles) {
    if (convertToESM(filePath)) {
      convertedCount++;
    }
  }
  
  console.log(`\n✓ Converted ${convertedCount} files to ESM`);
  
  if (convertedCount === 0) {
    console.log('✓ All files already use ESM exports');
  }
}

main();
