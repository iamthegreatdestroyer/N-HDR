/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation health metrics system for quality assessment
 */

const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');

class HealthMetrics {
  constructor(options = {}) {
    this.options = {
      minCoverage: 80, // Minimum documentation coverage percentage
      minReadability: 60, // Minimum readability score
      minExampleCoverage: 70, // Minimum code example coverage
      minApiCoverage: 90, // Minimum API documentation coverage
      maxComplexity: 70, // Maximum documentation complexity score
      checksInterval: 3600000, // Run checks every hour
      ...options
    };

    this.metrics = {
      coverage: 0,
      readability: 0,
      exampleCoverage: 0,
      apiCoverage: 0,
      complexity: 0,
      lastUpdate: null,
      issues: []
    };
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring() {
    this.checkInterval = setInterval(() => {
      this.runHealthCheck();
    }, this.options.checksInterval);

    // Run initial check
    this.runHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Run a complete health check of the documentation
   * @returns {Object} Health check results
   */
  async runHealthCheck() {
    try {
      // Reset issues array
      this.metrics.issues = [];

      // Run all checks
      await Promise.all([
        this.checkDocumentationCoverage(),
        this.checkReadabilityScore(),
        this.checkExampleCoverage(),
        this.checkApiCoverage(),
        this.checkComplexity()
      ]);

      // Update timestamp
      this.metrics.lastUpdate = new Date();

      // Calculate overall health score
      const overallScore = this.calculateOverallScore();
      this.metrics.overallScore = overallScore;

      return {
        ...this.metrics,
        status: this.getHealthStatus(overallScore)
      };
    } catch (error) {
      console.error('Error running health check:', error);
      throw error;
    }
  }

  /**
   * Check documentation coverage
   * @returns {Promise<number>} Coverage percentage
   */
  async checkDocumentationCoverage() {
    try {
      const codeFiles = await this.getAllSourceFiles();
      const docFiles = await this.getAllDocFiles();
      
      let totalClasses = 0;
      let documentedClasses = 0;
      
      for (const file of codeFiles) {
        const content = await fs.readFile(file, 'utf8');
        const classes = this.extractClasses(content);
        
        totalClasses += classes.length;
        documentedClasses += classes.filter(c => 
          this.hasDocumentation(c)
        ).length;
      }
      
      const coverage = (documentedClasses / totalClasses) * 100;
      this.metrics.coverage = coverage;
      
      if (coverage < this.options.minCoverage) {
        this.metrics.issues.push({
          type: 'coverage',
          message: `Documentation coverage (${coverage.toFixed(1)}%) is below minimum requirement (${this.options.minCoverage}%)`,
          severity: 'high'
        });
      }
      
      return coverage;
    } catch (error) {
      console.error('Error checking documentation coverage:', error);
      throw error;
    }
  }

  /**
   * Check documentation readability
   * @returns {Promise<number>} Readability score
   */
  async checkReadabilityScore() {
    try {
      const docFiles = await this.getAllDocFiles();
      let totalScore = 0;
      
      for (const file of docFiles) {
        const content = await fs.readFile(file, 'utf8');
        const score = this.calculateReadabilityScore(content);
        totalScore += score;
      }
      
      const averageScore = totalScore / docFiles.length;
      this.metrics.readability = averageScore;
      
      if (averageScore < this.options.minReadability) {
        this.metrics.issues.push({
          type: 'readability',
          message: `Documentation readability score (${averageScore.toFixed(1)}) is below minimum requirement (${this.options.minReadability})`,
          severity: 'medium'
        });
      }
      
      return averageScore;
    } catch (error) {
      console.error('Error checking readability:', error);
      throw error;
    }
  }

  /**
   * Check code example coverage
   * @returns {Promise<number>} Example coverage percentage
   */
  async checkExampleCoverage() {
    try {
      const apiFiles = await this.getApiFiles();
      let totalApis = 0;
      let apisWithExamples = 0;
      
      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        const apis = this.extractApis(content);
        
        totalApis += apis.length;
        apisWithExamples += apis.filter(api => 
          this.hasCodeExample(api)
        ).length;
      }
      
      const coverage = (apisWithExamples / totalApis) * 100;
      this.metrics.exampleCoverage = coverage;
      
      if (coverage < this.options.minExampleCoverage) {
        this.metrics.issues.push({
          type: 'examples',
          message: `Code example coverage (${coverage.toFixed(1)}%) is below minimum requirement (${this.options.minExampleCoverage}%)`,
          severity: 'medium'
        });
      }
      
      return coverage;
    } catch (error) {
      console.error('Error checking example coverage:', error);
      throw error;
    }
  }

  /**
   * Check API documentation coverage
   * @returns {Promise<number>} API coverage percentage
   */
  async checkApiCoverage() {
    try {
      const apiFiles = await this.getApiFiles();
      let totalMethods = 0;
      let documentedMethods = 0;
      
      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        const methods = this.extractMethods(content);
        
        totalMethods += methods.length;
        documentedMethods += methods.filter(m => 
          this.hasApiDocumentation(m)
        ).length;
      }
      
      const coverage = (documentedMethods / totalMethods) * 100;
      this.metrics.apiCoverage = coverage;
      
      if (coverage < this.options.minApiCoverage) {
        this.metrics.issues.push({
          type: 'api',
          message: `API documentation coverage (${coverage.toFixed(1)}%) is below minimum requirement (${this.options.minApiCoverage}%)`,
          severity: 'high'
        });
      }
      
      return coverage;
    } catch (error) {
      console.error('Error checking API coverage:', error);
      throw error;
    }
  }

  /**
   * Check documentation complexity
   * @returns {Promise<number>} Complexity score
   */
  async checkComplexity() {
    try {
      const docFiles = await this.getAllDocFiles();
      let totalComplexity = 0;
      
      for (const file of docFiles) {
        const content = await fs.readFile(file, 'utf8');
        const complexity = this.calculateComplexity(content);
        totalComplexity += complexity;
      }
      
      const averageComplexity = totalComplexity / docFiles.length;
      this.metrics.complexity = averageComplexity;
      
      if (averageComplexity > this.options.maxComplexity) {
        this.metrics.issues.push({
          type: 'complexity',
          message: `Documentation complexity score (${averageComplexity.toFixed(1)}) exceeds maximum threshold (${this.options.maxComplexity})`,
          severity: 'medium'
        });
      }
      
      return averageComplexity;
    } catch (error) {
      console.error('Error checking complexity:', error);
      throw error;
    }
  }

  /**
   * Calculate readability score using multiple algorithms
   * @param {string} text - Text to analyze
   * @returns {number} Readability score
   */
  calculateReadabilityScore(text) {
    // Remove code blocks and markdown
    const cleanText = this.removeMarkdown(text);
    
    // Calculate various readability metrics
    const fleschScore = this.calculateFleschScore(cleanText);
    const fogIndex = this.calculateGunningFog(cleanText);
    const colemanLiau = this.calculateColemanLiau(cleanText);
    
    // Return weighted average
    return (fleschScore * 0.4) + 
           (Math.max(0, 100 - fogIndex * 5) * 0.3) + 
           (Math.max(0, 100 - colemanLiau * 5) * 0.3);
  }

  /**
   * Calculate Flesch Reading Ease score
   * @param {string} text - Text to analyze
   * @returns {number} Flesch score
   */
  calculateFleschScore(text) {
    const words = text.split(/\\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const syllables = this.countSyllables(text);
    
    const wordsPerSentence = words.length / sentences.length;
    const syllablesPerWord = syllables / words.length;
    
    return 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  }

  /**
   * Calculate Gunning Fog Index
   * @param {string} text - Text to analyze
   * @returns {number} Fog index
   */
  calculateGunningFog(text) {
    const words = text.split(/\\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const complexWords = words.filter(word => 
      this.countSyllables(word) >= 3
    );
    
    const averageSentenceLength = words.length / sentences.length;
    const percentageComplex = (complexWords.length / words.length) * 100;
    
    return 0.4 * (averageSentenceLength + percentageComplex);
  }

  /**
   * Calculate Coleman-Liau Index
   * @param {string} text - Text to analyze
   * @returns {number} Coleman-Liau index
   */
  calculateColemanLiau(text) {
    const characters = text.replace(/\\s/g, '').length;
    const words = text.split(/\\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    
    const L = (characters / words.length) * 100;
    const S = (sentences.length / words.length) * 100;
    
    return 0.0588 * L - 0.296 * S - 15.8;
  }

  /**
   * Calculate documentation complexity
   * @param {string} content - Documentation content
   * @returns {number} Complexity score
   */
  calculateComplexity(content) {
    // Factor 1: Nesting depth of headings
    const headingDepth = this.calculateHeadingDepth(content);
    
    // Factor 2: Code block complexity
    const codeComplexity = this.calculateCodeComplexity(content);
    
    // Factor 3: Technical terminology density
    const termDensity = this.calculateTerminologyDensity(content);
    
    // Factor 4: Link and reference complexity
    const refComplexity = this.calculateReferenceComplexity(content);
    
    // Calculate weighted score
    return (headingDepth * 0.3) + 
           (codeComplexity * 0.3) + 
           (termDensity * 0.2) + 
           (refComplexity * 0.2);
  }

  /**
   * Calculate overall health score
   * @returns {number} Overall score
   */
  calculateOverallScore() {
    const weights = {
      coverage: 0.25,
      readability: 0.2,
      exampleCoverage: 0.2,
      apiCoverage: 0.25,
      complexity: 0.1
    };
    
    return (this.metrics.coverage * weights.coverage) +
           (this.metrics.readability * weights.readability) +
           (this.metrics.exampleCoverage * weights.exampleCoverage) +
           (this.metrics.apiCoverage * weights.apiCoverage) +
           (Math.max(0, 100 - this.metrics.complexity) * weights.complexity);
  }

  /**
   * Get health status based on score
   * @param {number} score - Overall health score
   * @returns {string} Health status
   */
  getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  /**
   * Get all source code files
   * @returns {Promise<string[]>} Array of file paths
   */
  async getAllSourceFiles() {
    return this.findFiles(/\\.(js|ts)$/);
  }

  /**
   * Get all documentation files
   * @returns {Promise<string[]>} Array of file paths
   */
  async getAllDocFiles() {
    return this.findFiles(/\\.(md|mdx)$/);
  }

  /**
   * Get API-related files
   * @returns {Promise<string[]>} Array of file paths
   */
  async getApiFiles() {
    return this.findFiles(/api.*\\.(js|ts)$/);
  }

  /**
   * Find files matching pattern
   * @param {RegExp} pattern - File pattern to match
   * @returns {Promise<string[]>} Array of file paths
   */
  async findFiles(pattern) {
    const results = [];
    
    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    }
    
    await scan(process.cwd());
    return results;
  }

  /**
   * Extract class definitions from source code
   * @param {string} content - Source code content
   * @returns {Array} Array of class information
   */
  extractClasses(content) {
    const classRegex = /class\\s+(\\w+)\\s*{([^}]*)}/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        body: match[2]
      });
    }
    
    return classes;
  }

  /**
   * Extract API methods from source code
   * @param {string} content - Source code content
   * @returns {Array} Array of method information
   */
  extractMethods(content) {
    const methodRegex = /(?:\\/\\*\\*([^*]|\\*[^/])*\\*\\/\\s+)?(?:async\\s+)?(?:\\w+\\s+)?(\\w+)\\s*\\([^)]*\\)\\s*{/g;
    const methods = [];
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[2],
        docs: match[1] || ''
      });
    }
    
    return methods;
  }

  /**
   * Extract API definitions from source code
   * @param {string} content - Source code content
   * @returns {Array} Array of API information
   */
  extractApis(content) {
    const apiRegex = /\\/\\*\\*([^*]|\\*[^/])*\\*\\/\\s+(?:async\\s+)?(?:\\w+\\s+)?(\\w+)\\s*\\([^)]*\\)\\s*{/g;
    const apis = [];
    let match;
    
    while ((match = apiRegex.exec(content)) !== null) {
      apis.push({
        name: match[2],
        docs: match[1] || ''
      });
    }
    
    return apis;
  }

  /**
   * Check if a class has documentation
   * @param {Object} classInfo - Class information
   * @returns {boolean} Has documentation
   */
  hasDocumentation(classInfo) {
    return /\\/\\*\\*([^*]|\\*[^/])*\\*\\//.test(classInfo.body);
  }

  /**
   * Check if an API has code examples
   * @param {Object} apiInfo - API information
   * @returns {boolean} Has examples
   */
  hasCodeExample(apiInfo) {
    return /@example/.test(apiInfo.docs);
  }

  /**
   * Check if a method has API documentation
   * @param {Object} methodInfo - Method information
   * @returns {boolean} Has API documentation
   */
  hasApiDocumentation(methodInfo) {
    return methodInfo.docs && 
           /@param/.test(methodInfo.docs) && 
           /@returns/.test(methodInfo.docs);
  }

  /**
   * Remove markdown syntax from text
   * @param {string} text - Text with markdown
   * @returns {string} Clean text
   */
  removeMarkdown(text) {
    return text
      .replace(/```[^`]*```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\\[([^\\]]*)\\]\\([^)]*\\)/g, '$1') // Remove links
      .replace(/[#*_~]/g, ''); // Remove formatting
  }

  /**
   * Count syllables in a word
   * @param {string} word - Word to analyze
   * @returns {number} Number of syllables
   */
  countSyllables(word) {
    word = word.toLowerCase();
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    return word.match(/[aeiouy]{1,2}/g)?.length || 1;
  }

  /**
   * Calculate heading depth in markdown
   * @param {string} content - Markdown content
   * @returns {number} Heading depth score
   */
  calculateHeadingDepth(content) {
    const headings = content.match(/^#{1,6}\s/gm) || [];
    let maxDepth = 0;
    let depthCounts = new Array(6).fill(0);
    
    headings.forEach(heading => {
      const depth = heading.trim().length;
      maxDepth = Math.max(maxDepth, depth);
      depthCounts[depth - 1]++;
    });
    
    return (maxDepth / 6) * 50 + 
           (depthCounts.reduce((sum, count) => sum + count, 0) / headings.length) * 50;
  }

  /**
   * Calculate code block complexity
   * @param {string} content - Documentation content
   * @returns {number} Code complexity score
   */
  calculateCodeComplexity(content) {
    const codeBlocks = content.match(/```[^`]*```/g) || [];
    let totalComplexity = 0;
    
    codeBlocks.forEach(block => {
      const code = block.replace(/```.*\\n?|```/g, '');
      
      // Factor 1: Lines of code
      const lines = code.split('\\n').length;
      
      // Factor 2: Nesting depth
      const nesting = Math.max(...code.split('\\n').map(line => 
        (line.match(/^\\s+/)?.[0].length || 0) / 2
      ));
      
      // Factor 3: Control structures
      const controls = (code.match(
        /if|for|while|switch|try|catch|map|reduce|filter/g
      ) || []).length;
      
      totalComplexity += (lines * 0.3) + (nesting * 0.4) + (controls * 0.3);
    });
    
    return Math.min(100, totalComplexity);
  }

  /**
   * Calculate technical terminology density
   * @param {string} content - Documentation content
   * @returns {number} Terminology density score
   */
  calculateTerminologyDensity(content) {
    const text = this.removeMarkdown(content);
    const words = text.split(/\\s+/).filter(Boolean);
    
    const technicalTerms = words.filter(word => 
      /^[A-Z]\\w+(?:[A-Z]\\w+)*$/.test(word) || // CamelCase
      /\\w+(?:-\\w+)+/.test(word) || // kebab-case
      /\\w+(?:_\\w+)+/.test(word) // snake_case
    );
    
    return Math.min(100, (technicalTerms.length / words.length) * 200);
  }

  /**
   * Calculate reference complexity
   * @param {string} content - Documentation content
   * @returns {number} Reference complexity score
   */
  calculateReferenceComplexity(content) {
    // Factor 1: Number of links
    const links = (content.match(/\\[([^\\]]*)\\]\\([^)]*\\)/g) || []).length;
    
    // Factor 2: Number of references
    const refs = (content.match(/\\[\\^\\d+\\]/g) || []).length;
    
    // Factor 3: Number of cross-references
    const crossRefs = (content.match(/#[\\w-]+/g) || []).length;
    
    return Math.min(100, (links + refs * 2 + crossRefs * 1.5) * 2);
  }
}

module.exports = HealthMetrics;