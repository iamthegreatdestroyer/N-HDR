#!/usr/bin/env node

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
 * File: generate-docs.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * CLI tool for generating comprehensive N-HDR documentation with customizable
 * options and formats.
 */

const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const DocumentationGenerator = require('../docs/documentation-generator');

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('source', {
        alias: 's',
        description: 'Source directory containing code files',
        type: 'string',
        default: 'src'
    })
    .option('output', {
        alias: 'o',
        description: 'Output directory for documentation',
        type: 'string',
        default: 'docs'
    })
    .option('templates', {
        alias: 't',
        description: 'Templates directory',
        type: 'string',
        default: 'src/docs/templates'
    })
    .option('format', {
        alias: 'f',
        description: 'Output format (html or markdown)',
        choices: ['html', 'markdown'],
        default: 'html'
    })
    .option('diagrams', {
        alias: 'd',
        description: 'Generate diagrams',
        type: 'boolean',
        default: true
    })
    .option('examples', {
        alias: 'e',
        description: 'Include code examples',
        type: 'boolean',
        default: true
    })
    .option('exclude', {
        alias: 'x',
        description: 'Patterns to exclude (comma-separated)',
        type: 'string',
        default: 'node_modules,*.test.js'
    })
    .help()
    .alias('help', 'h')
    .argv;

/**
 * Convert exclude patterns to RegExp array
 * @param {string} patterns - Comma-separated patterns
 * @returns {Array} Array of RegExp objects
 */
function parseExcludePatterns(patterns) {
    return patterns.split(',')
        .map(pattern => pattern.trim())
        .filter(Boolean)
        .map(pattern => new RegExp(pattern.replace('*', '.*')));
}

/**
 * Run documentation generator
 */
async function main() {
    try {
        console.log('N-HDR Documentation Generator');
        console.log('----------------------------');

        const options = {
            sourceDir: path.resolve(process.cwd(), argv.source),
            outputDir: path.resolve(process.cwd(), argv.output),
            templatesDir: path.resolve(process.cwd(), argv.templates),
            format: argv.format,
            includeDiagrams: argv.diagrams,
            includeExamples: argv.examples,
            excludePatterns: parseExcludePatterns(argv.exclude)
        };

        console.log('Configuration:', JSON.stringify(options, null, 2));
        console.log('\nGenerating documentation...');

        const generator = new DocumentationGenerator(options);
        const success = await generator.generateDocs();

        if (success) {
            console.log('\nDocumentation generated successfully!');
            console.log(`Output directory: ${options.outputDir}`);
        } else {
            console.error('\nError generating documentation.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run generator
main();