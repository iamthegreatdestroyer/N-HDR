/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation validation system for ensuring documentation quality and completeness.
 */

import Ajv from "ajv";
import markdownlint from "markdownlint";
import { unified } from "unified";
import markdown from "remark-parse";
import yaml from "js-yaml";
import path from "path";
const fs = require('fs').promises;

class DocumentationValidator {
  /**
   * Create a new documentation validator
   * @param {Object} options - Validator options
   */
  constructor(options = {}) {
    this.options = {
      validateMarkdown: true,
      validateExamples: true,
      validateStructure: true,
      validateLinks: true,
      validateLicense: true,
      ...options
    };

    this.ajv = new Ajv({ allErrors: true });
    this.markdownlintConfig = {
      'default': true,
      'line-length': false,
      'no-inline-html': false
    };
  }

  /**
   * Validate documentation content
   * @param {Object} documentation - Documentation content and metadata
   * @returns {Promise<Object>} Validation results
   */
  async validate(documentation) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      metrics: {}
    };

    try {
      // Structure validation
      if (this.options.validateStructure) {
        const structureResults = await this._validateStructure(documentation);
        this._mergeResults(results, structureResults);
      }

      // Markdown validation
      if (this.options.validateMarkdown) {
        const markdownResults = await this._validateMarkdown(documentation);
        this._mergeResults(results, markdownResults);
      }

      // Example validation
      if (this.options.validateExamples) {
        const exampleResults = await this._validateExamples(documentation);
        this._mergeResults(results, exampleResults);
      }

      // Link validation
      if (this.options.validateLinks) {
        const linkResults = await this._validateLinks(documentation);
        this._mergeResults(results, linkResults);
      }

      // License validation
      if (this.options.validateLicense) {
        const licenseResults = await this._validateLicense(documentation);
        this._mergeResults(results, licenseResults);
      }

      // Calculate metrics
      results.metrics = this._calculateMetrics(documentation, results);

    } catch (error) {
      results.valid = false;
      results.errors.push({
        type: 'system',
        message: \`Validation system error: \${error.message}\`,
        error
      });
    }

    return results;
  }

  /**
   * Validate documentation structure
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _validateStructure(documentation) {
    const results = { valid: true, errors: [], warnings: [] };

    // Required sections
    const requiredSections = ['overview', 'installation', 'api', 'examples'];
    const missingSections = requiredSections.filter(section => 
      !documentation.sections?.some(s => s.id === section)
    );

    if (missingSections.length > 0) {
      results.valid = false;
      results.errors.push({
        type: 'structure',
        message: \`Missing required sections: \${missingSections.join(', ')}\`
      });
    }

    // Section content
    for (const section of documentation.sections || []) {
      if (!section.content || section.content.trim().length < 50) {
        results.warnings.push({
          type: 'structure',
          message: \`Section '\${section.id}' has insufficient content\`
        });
      }
    }

    // Metadata validation
    const requiredMetadata = ['version', 'lastUpdated', 'author'];
    const missingMetadata = requiredMetadata.filter(field => 
      !documentation.metadata?.[field]
    );

    if (missingMetadata.length > 0) {
      results.warnings.push({
        type: 'structure',
        message: \`Missing metadata fields: \${missingMetadata.join(', ')}\`
      });
    }

    return results;
  }

  /**
   * Validate markdown content
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _validateMarkdown(documentation) {
    const results = { valid: true, errors: [], warnings: [] };

    for (const section of documentation.sections || []) {
      // Skip non-markdown sections
      if (section.format !== 'markdown') continue;

      // Run markdownlint
      const lintResults = markdownlint.sync({
        strings: { [section.id]: section.content },
        config: this.markdownlintConfig
      });

      const sectionResults = lintResults[section.id] || [];
      
      for (const result of sectionResults) {
        results.warnings.push({
          type: 'markdown',
          section: section.id,
          line: result.lineNumber,
          message: result.ruleDescription,
          ruleInfo: result.ruleInformation
        });
      }

      // Check heading structure
      const headings = this._extractHeadings(section.content);
      const headingErrors = this._validateHeadingStructure(headings);
      
      if (headingErrors.length > 0) {
        results.errors.push(...headingErrors.map(error => ({
          type: 'markdown',
          section: section.id,
          ...error
        })));
        results.valid = false;
      }
    }

    return results;
  }

  /**
   * Validate code examples
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _validateExamples(documentation) {
    const results = { valid: true, errors: [], warnings: [] };

    for (const section of documentation.sections || []) {
      const examples = this._extractExamples(section.content);

      for (const example of examples) {
        try {
          // Basic syntax validation
          const syntaxValid = await this._validateSyntax(example.code, example.language);
          
          if (!syntaxValid) {
            results.errors.push({
              type: 'example',
              section: section.id,
              message: \`Invalid \${example.language} syntax in example\`,
              code: example.code
            });
            results.valid = false;
          }

          // Import validation
          const imports = this._validateImports(example.code);
          
          if (imports.invalid.length > 0) {
            results.warnings.push({
              type: 'example',
              section: section.id,
              message: \`Invalid imports in example: \${imports.invalid.join(', ')}\`,
              code: example.code
            });
          }

          // API usage validation
          const apiUsage = await this._validateApiUsage(example.code);
          
          if (apiUsage.errors.length > 0) {
            results.errors.push(...apiUsage.errors.map(error => ({
              type: 'example',
              section: section.id,
              message: \`Invalid API usage: \${error}\`,
              code: example.code
            })));
            results.valid = false;
          }

        } catch (error) {
          results.errors.push({
            type: 'example',
            section: section.id,
            message: \`Example validation error: \${error.message}\`,
            code: example.code,
            error
          });
          results.valid = false;
        }
      }
    }

    return results;
  }

  /**
   * Validate documentation links
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _validateLinks(documentation) {
    const results = { valid: true, errors: [], warnings: [] };
    const links = new Set();
    const invalidLinks = [];
    const brokenLinks = [];

    // Extract and validate all links
    for (const section of documentation.sections || []) {
      const sectionLinks = this._extractLinks(section.content);
      
      for (const link of sectionLinks) {
        links.add(link);

        // Validate link format
        if (!this._isValidLinkFormat(link)) {
          invalidLinks.push({ section: section.id, link });
          continue;
        }

        // Check if link is reachable
        try {
          const isReachable = await this._isLinkReachable(link);
          if (!isReachable) {
            brokenLinks.push({ section: section.id, link });
          }
        } catch (error) {
          results.warnings.push({
            type: 'link',
            section: section.id,
            message: \`Failed to check link: \${link}\`,
            error: error.message
          });
        }
      }
    }

    // Report invalid links
    if (invalidLinks.length > 0) {
      results.errors.push({
        type: 'link',
        message: 'Invalid link format detected',
        links: invalidLinks
      });
      results.valid = false;
    }

    // Report broken links
    if (brokenLinks.length > 0) {
      results.errors.push({
        type: 'link',
        message: 'Broken links detected',
        links: brokenLinks
      });
      results.valid = false;
    }

    return results;
  }

  /**
   * Validate license information
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _validateLicense(documentation) {
    const results = { valid: true, errors: [], warnings: [] };
    const requiredLicenseText = [
      '© 2025 Stephen Bilodeau',
      'PATENT PENDING',
      'ALL RIGHTS RESERVED',
      'PROPRIETARY AND CONFIDENTIAL'
    ];

    // Check each section for license information
    for (const section of documentation.sections || []) {
      const content = section.content.toUpperCase();
      const missingTerms = requiredLicenseText.filter(
        term => !content.includes(term.toUpperCase())
      );

      if (missingTerms.length > 0) {
        results.warnings.push({
          type: 'license',
          section: section.id,
          message: \`Missing license terms: \${missingTerms.join(', ')}\`
        });
      }
    }

    // Validate license section
    const licenseSection = documentation.sections?.find(s => 
      s.id.toLowerCase() === 'license'
    );

    if (!licenseSection) {
      results.errors.push({
        type: 'license',
        message: 'Missing dedicated license section'
      });
      results.valid = false;
    } else {
      const missingTerms = requiredLicenseText.filter(
        term => !licenseSection.content.toUpperCase().includes(term.toUpperCase())
      );

      if (missingTerms.length > 0) {
        results.errors.push({
          type: 'license',
          message: \`License section missing required terms: \${missingTerms.join(', ')}\`
        });
        results.valid = false;
      }
    }

    return results;
  }

  /**
   * Calculate documentation metrics
   * @param {Object} documentation - Documentation content
   * @param {Object} validationResults - Validation results
   * @returns {Object} Documentation metrics
   * @private
   */
  _calculateMetrics(documentation, validationResults) {
    return {
      sections: documentation.sections?.length || 0,
      totalWords: this._countWords(documentation),
      averageSectionLength: this._calculateAverageSectionLength(documentation),
      codeExamples: this._countCodeExamples(documentation),
      errorCount: validationResults.errors.length,
      warningCount: validationResults.warnings.length,
      validationScore: this._calculateValidationScore(validationResults),
      readabilityScore: this._calculateReadabilityScore(documentation),
      completenessScore: this._calculateCompletenessScore(documentation)
    };
  }

  /**
   * Extract headings from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<Object>} Extracted headings
   * @private
   */
  _extractHeadings(content) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        position: match.index
      });
    }

    return headings;
  }

  /**
   * Validate heading structure
   * @param {Array<Object>} headings - Extracted headings
   * @returns {Array<Object>} Validation errors
   * @private
   */
  _validateHeadingStructure(headings) {
    const errors = [];
    let lastLevel = 0;

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];

      // Check for skipped levels
      if (heading.level > lastLevel + 1 && lastLevel !== 0) {
        errors.push({
          message: \`Heading level skipped from \${lastLevel} to \${heading.level}\`,
          heading: heading.text
        });
      }

      lastLevel = heading.level;
    }

    return errors;
  }

  /**
   * Extract code examples from content
   * @param {string} content - Documentation content
   * @returns {Array<Object>} Extracted code examples
   * @private
   */
  _extractExamples(content) {
    const examples = [];
    const codeBlockRegex = /\`\`\`(\w+)?\n([\s\S]+?)\`\`\`/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      examples.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return examples;
  }

  /**
   * Extract links from content
   * @param {string} content - Documentation content
   * @returns {Array<string>} Extracted links
   * @private
   */
  _extractLinks(content) {
    const links = new Set();
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    let match;

    // Extract Markdown links
    while ((match = markdownLinkRegex.exec(content)) !== null) {
      links.add(match[2]);
    }

    // Extract HTML links
    while ((match = htmlLinkRegex.exec(content)) !== null) {
      links.add(match[1]);
    }

    return Array.from(links);
  }

  /**
   * Validate link format
   * @param {string} link - Link URL
   * @returns {boolean} Whether the link format is valid
   * @private
   */
  _isValidLinkFormat(link) {
    // Handle relative links
    if (link.startsWith('/') || link.startsWith('./') || link.startsWith('../')) {
      return true;
    }

    // Handle anchor links
    if (link.startsWith('#')) {
      return true;
    }

    // Handle absolute URLs
    try {
      new URL(link);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a link is reachable
   * @param {string} link - Link URL
   * @returns {Promise<boolean>} Whether the link is reachable
   * @private
   */
  async _isLinkReachable(link) {
    // Skip anchor links and relative paths
    if (link.startsWith('#') || link.startsWith('/') || 
        link.startsWith('./') || link.startsWith('../')) {
      return true;
    }

    try {
      const response = await fetch(link, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Calculate word count
   * @param {Object} documentation - Documentation content
   * @returns {number} Total word count
   * @private
   */
  _countWords(documentation) {
    let totalWords = 0;

    for (const section of documentation.sections || []) {
      // Remove code blocks and HTML
      const cleanContent = section.content
        .replace(/\`\`\`[\s\S]+?\`\`\`/g, '')
        .replace(/<[^>]+>/g, '');

      // Count words
      totalWords += cleanContent.trim().split(/\s+/).length;
    }

    return totalWords;
  }

  /**
   * Calculate average section length
   * @param {Object} documentation - Documentation content
   * @returns {number} Average section length in words
   * @private
   */
  _calculateAverageSectionLength(documentation) {
    if (!documentation.sections?.length) return 0;
    return this._countWords(documentation) / documentation.sections.length;
  }

  /**
   * Count code examples
   * @param {Object} documentation - Documentation content
   * @returns {number} Number of code examples
   * @private
   */
  _countCodeExamples(documentation) {
    let count = 0;

    for (const section of documentation.sections || []) {
      count += this._extractExamples(section.content).length;
    }

    return count;
  }

  /**
   * Calculate validation score
   * @param {Object} results - Validation results
   * @returns {number} Validation score (0-100)
   * @private
   */
  _calculateValidationScore(results) {
    const errorWeight = 5;
    const warningWeight = 1;
    const baseScore = 100;

    const deductions = 
      (results.errors.length * errorWeight) + 
      (results.warnings.length * warningWeight);

    return Math.max(0, Math.min(100, baseScore - deductions));
  }

  /**
   * Calculate readability score
   * @param {Object} documentation - Documentation content
   * @returns {number} Readability score (0-100)
   * @private
   */
  _calculateReadabilityScore(documentation) {
    let totalScore = 0;
    let totalSections = 0;

    for (const section of documentation.sections || []) {
      // Skip non-text sections
      if (section.format !== 'markdown') continue;

      const cleanContent = section.content
        .replace(/\`\`\`[\s\S]+?\`\`\`/g, '')
        .replace(/<[^>]+>/g, '');

      // Calculate automated readability index
      const words = cleanContent.trim().split(/\s+/);
      const sentences = cleanContent.split(/[.!?]+/).length;
      const characters = cleanContent.replace(/\s/g, '').length;

      if (words.length === 0 || sentences === 0) continue;

      const avgWordsPerSentence = words.length / sentences;
      const avgCharactersPerWord = characters / words.length;

      // Simplified readability score (0-100)
      const sectionScore = Math.max(0, Math.min(100,
        100 - (
          Math.abs(avgWordsPerSentence - 15) * 2 +
          Math.abs(avgCharactersPerWord - 5) * 10
        )
      ));

      totalScore += sectionScore;
      totalSections++;
    }

    return totalSections > 0 ? totalScore / totalSections : 0;
  }

  /**
   * Calculate completeness score
   * @param {Object} documentation - Documentation content
   * @returns {number} Completeness score (0-100)
   * @private
   */
  _calculateCompletenessScore(documentation) {
    const requiredSections = [
      'overview',
      'installation',
      'api',
      'examples',
      'configuration',
      'troubleshooting',
      'license'
    ];

    const requiredElements = [
      'code examples',
      'links',
      'headings',
      'metadata'
    ];

    let score = 0;
    const maxScore = 100;

    // Check sections (60% of score)
    const presentSections = requiredSections.filter(section =>
      documentation.sections?.some(s => s.id === section)
    );
    score += (presentSections.length / requiredSections.length) * 60;

    // Check elements (40% of score)
    const elementScores = {
      'code examples': this._countCodeExamples(documentation) > 0 ? 10 : 0,
      'links': this._hasLinks(documentation) ? 10 : 0,
      'headings': this._hasProperHeadings(documentation) ? 10 : 0,
      'metadata': this._hasRequiredMetadata(documentation) ? 10 : 0
    };

    score += Object.values(elementScores).reduce((sum, value) => sum + value, 0);

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Check if documentation has links
   * @param {Object} documentation - Documentation content
   * @returns {boolean} Whether documentation has links
   * @private
   */
  _hasLinks(documentation) {
    for (const section of documentation.sections || []) {
      if (this._extractLinks(section.content).length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if documentation has proper headings
   * @param {Object} documentation - Documentation content
   * @returns {boolean} Whether documentation has proper headings
   * @private
   */
  _hasProperHeadings(documentation) {
    for (const section of documentation.sections || []) {
      const headings = this._extractHeadings(section.content);
      if (headings.length > 0 && this._validateHeadingStructure(headings).length === 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if documentation has required metadata
   * @param {Object} documentation - Documentation content
   * @returns {boolean} Whether documentation has required metadata
   * @private
   */
  _hasRequiredMetadata(documentation) {
    const requiredFields = ['version', 'lastUpdated', 'author'];
    return requiredFields.every(field => documentation.metadata?.[field]);
  }

  /**
   * Merge validation results
   * @param {Object} target - Target results object
   * @param {Object} source - Source results object
   * @private
   */
  _mergeResults(target, source) {
    target.valid = target.valid && source.valid;
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
  }
}

export default DocumentationValidator;