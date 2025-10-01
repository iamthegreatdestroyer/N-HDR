#!/usr/bin/env node

/**
 * HDR Empire Framework - Protocol Execution CLI
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { executeHDREmpireProtocol } from '../core/HDREmpireProtocolOrchestrator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Main CLI Entry Point
 */
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                 HDR EMPIRE FRAMEWORK - PROTOCOL EXECUTOR                  ║
║                                                                           ║
║                        Master Architect                                   ║
║                       STEPHEN BILODEAU                                    ║
║                                                                           ║
║               © 2025 - Patent Pending - All Rights Reserved              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  console.log('Initializing HDR Empire Protocol execution...\n');

  try {
    const result = await executeHDREmpireProtocol({
      sourceDirectory: path.join(projectRoot, 'src'),
      outputDirectory: path.join(projectRoot, 'output'),
      timestampDirectory: path.join(projectRoot, 'timestamps'),
      enableMonitoring: true
    });

    console.log('\n' + '═'.repeat(80));
    console.log('EXECUTION SUMMARY');
    console.log('═'.repeat(80));
    console.log(`✅ Phase 1: ${result.phases.phase1.documentation.length} systems documented`);
    console.log(`✅ Phase 2: ${result.phases.phase2.demos.length} demos completed`);
    console.log(`✅ Phase 3: ${result.phases.phase3.domains.length} domains analyzed`);
    console.log(`📊 Report: ${result.report.path}`);
    console.log('═'.repeat(80));

    console.log('\n🎉 HDR EMPIRE PROTOCOL EXECUTION SUCCESSFUL!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ EXECUTION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Execution interrupted by user');
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Execution terminated');
  console.log('Shutting down gracefully...');
  process.exit(0);
});

// Execute
main();
