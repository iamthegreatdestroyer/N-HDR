/**
 * Example Registry for Neural-HDR System
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL 
 * 
 * Manages and stores code examples for the Neural-HDR system components.
 */

class ExampleRegistry {
    constructor() {
        this.examples = new Map();
        this.categories = new Set();
        this._initializeDefaultExamples();
    }

    /**
     * Adds an example to the registry
     * @param {string} category - Category of the example
     * @param {string} name - Name of the example
     * @param {string} code - Example code
     * @param {string} description - Description of the example
     */
    addExample(category, name, code, description) {
        if (!this.examples.has(category)) {
            this.examples.set(category, new Map());
            this.categories.add(category);
        }

        this.examples.get(category).set(name, {
            code,
            description,
            timestamp: new Date()
        });
    }

    /**
     * Gets an example from the registry
     * @param {string} category - Category of the example
     * @param {string} name - Name of the example
     * @returns {Object} Example object
     */
    getExample(category, name) {
        if (!this.examples.has(category)) {
            throw new Error(`Category '${category}' not found`);
        }

        const categoryExamples = this.examples.get(category);
        if (!categoryExamples.has(name)) {
            throw new Error(`Example '${name}' not found in category '${category}'`);
        }

        return categoryExamples.get(name);
    }

    /**
     * Gets all examples in a category
     * @param {string} category - Category to get examples from
     * @returns {Map} Map of examples in the category
     */
    getCategoryExamples(category) {
        if (!this.examples.has(category)) {
            throw new Error(`Category '${category}' not found`);
        }

        return this.examples.get(category);
    }

    /**
     * Gets all categories
     * @returns {Set} Set of categories
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Initializes default examples for the Neural-HDR system
     * @private
     */
    _initializeDefaultExamples() {
        // Quantum Security Examples
        this.addExample(
            'quantum-security',
            'basic-entropy-generation',
            `const { QuantumEntropyGenerator } = require('neural-hdr');

const generator = new QuantumEntropyGenerator();
const randomBytes = generator.getRandomBytes(32);
console.log('Random bytes:', randomBytes);`,
            'Basic example of generating quantum-derived random bytes'
        );

        this.addExample(
            'quantum-security',
            'vanishing-key-management',
            `const { VanishingKeyManager } = require('neural-hdr');

const keyManager = new VanishingKeyManager();
const key = await keyManager.generateKey('sensitive-data', { lifetime: '1h' });
console.log('Generated key:', key);

// Verify key is still valid
const isValid = await keyManager.verifyKey(key);
console.log('Key is valid:', isValid);`,
            'Example of generating and managing vanishing keys'
        );

        // Consciousness Layer Examples
        this.addExample(
            'consciousness',
            'state-preservation',
            `const { ConsciousnessLayer } = require('neural-hdr');

const layer = new ConsciousnessLayer();
const entityId = 'entity-123';
const state = {
    memories: [...],
    patterns: [...],
    connections: [...]
};

await layer.preserveState(entityId, state);
console.log('State preserved successfully');

// Later, retrieve the state
const retrievedState = await layer.retrieveState(entityId);
console.log('Retrieved state:', retrievedState);`,
            'Example of preserving and retrieving consciousness state'
        );

        this.addExample(
            'consciousness',
            'quantum-entanglement',
            `const { QuantumEntanglement } = require('neural-hdr');

const entangler = new QuantumEntanglement();
const entityA = 'entity-123';
const entityB = 'entity-456';

// Create entanglement between entities
const pairId = await entangler.createEntanglement(entityA, entityB);
console.log('Created entanglement:', pairId);

// Measure entanglement strength
const strength = await entangler.measureEntanglement(pairId);
console.log('Entanglement strength:', strength);`,
            'Example of creating and measuring quantum entanglement between entities'
        );

        // NanoBot Examples
        this.addExample(
            'nanobot',
            'basic-task-processing',
            `const { NanoBot } = require('neural-hdr');

const bot = new NanoBot('bot-123');
const task = {
    type: 'process',
    data: { /* task data */ },
    options: {
        priority: 'high',
        thermal: { maxTemp: 75 }
    }
};

const result = await bot.processTask(task);
console.log('Task result:', result);`,
            'Example of basic task processing with a NanoBot'
        );

        this.addExample(
            'nanobot',
            'swarm-management',
            `const { SwarmManager } = require('neural-hdr');

const manager = new SwarmManager(100, {
    thermal: true,
    quantum: true
});

// Add tasks to the swarm
const tasks = [
    { type: 'process', data: { /* task 1 data */ } },
    { type: 'analyze', data: { /* task 2 data */ } }
];

await manager.addTasks(tasks);

// Get swarm statistics
const stats = manager.getStatistics();
console.log('Swarm statistics:', stats);`,
            'Example of managing a swarm of NanoBots'
        );

        // Thermal Management Examples
        this.addExample(
            'thermal',
            'thermal-monitoring',
            `const { ThermalManager } = require('neural-hdr');

const manager = new ThermalManager({
    maxTemp: 80,
    warningTemp: 70
});

manager.on('warning', (temp) => {
    console.log('Warning: High temperature detected:', temp);
});

manager.on('critical', (temp) => {
    console.log('Critical: Temperature exceeds maximum:', temp);
});

// Start monitoring
manager.startMonitoring();`,
            'Example of monitoring thermal conditions'
        );
    }
}

module.exports = ExampleRegistry;