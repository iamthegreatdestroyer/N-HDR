/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * QUANTUM VIEW COMPONENT
 * Visualization of quantum state and operations
 */

const EventEmitter = require('events');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

class QuantumView extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            updateInterval: options.updateInterval || 1000,
            historySize: options.historySize || 60,
            entropyThreshold: options.entropyThreshold || 0.8,
            ...options
        };

        this.data = {
            entropy: new Array(this.options.historySize).fill(0),
            entanglement: new Array(this.options.historySize).fill(0),
            operations: [],
            states: new Map()
        };

        this.initialized = false;
    }

    /**
     * Initialize the quantum view
     * @param {blessed.screen} screen - Blessed screen instance
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - View width
     * @param {number} height - View height
     */
    initialize(screen, x, y, width, height) {
        this.screen = screen;

        // Create container
        this.container = blessed.box({
            top: y,
            left: x,
            width,
            height,
            label: ' Quantum Status ',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'cyan'
                }
            }
        });
        screen.append(this.container);

        // Entropy and entanglement graph
        this.quantumGraph = contrib.line({
            top: 0,
            left: 0,
            width: '75%',
            height: '60%',
            label: 'Quantum Metrics',
            style: {
                line: ['cyan', 'magenta'],
                text: 'white',
                baseline: 'white'
            },
            xLabelPadding: 3,
            xPadding: 5,
            showLegend: true,
            legend: {
                width: 20
            }
        });
        this.container.append(this.quantumGraph);

        // Current metrics display
        this.metricsDisplay = blessed.box({
            top: 0,
            right: 0,
            width: '25%',
            height: '60%',
            label: 'Current Status',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'white'
                }
            },
            content: '',
            tags: true
        });
        this.container.append(this.metricsDisplay);

        // Quantum operations log
        this.operationsLog = blessed.log({
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            label: 'Quantum Operations',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'magenta'
                }
            },
            scrollable: true,
            scrollbar: {
                style: {
                    bg: 'white'
                }
            },
            mouse: true,
            tags: true
        });
        this.container.append(this.operationsLog);

        this.initialized = true;
    }

    /**
     * Update the quantum view with new data
     * @param {Map} metrics - Current system metrics
     */
    update(metrics) {
        if (!this.initialized) {
            return;
        }

        // Extract quantum metrics
        const currentEntropy = metrics.get('quantum.entropy') || 0;
        const currentEntanglement = metrics.get('quantum.entanglement') || 0;
        const quantumOps = metrics.get('quantum.operations') || [];
        const quantumStates = metrics.get('quantum.states') || new Map();

        // Update histories
        this.data.entropy.shift();
        this.data.entropy.push(currentEntropy);
        this.data.entanglement.shift();
        this.data.entanglement.push(currentEntanglement);

        // Update operations log
        this.data.operations = [...this.data.operations, ...quantumOps].slice(-100);
        
        // Update quantum states
        this.data.states = new Map(quantumStates);

        // Update quantum metrics graph
        this.quantumGraph.setData([
            {
                title: 'Entropy',
                x: [...Array(this.options.historySize)].map((_, i) => i),
                y: this.data.entropy,
                style: {
                    line: 'cyan'
                }
            },
            {
                title: 'Entanglement',
                x: [...Array(this.options.historySize)].map((_, i) => i),
                y: this.data.entanglement,
                style: {
                    line: 'magenta'
                }
            }
        ]);

        // Update metrics display
        const entropyStatus = this._getEntropyStatus(currentEntropy);
        const entanglementStatus = this._getEntanglementStatus(currentEntanglement);
        
        this.metricsDisplay.setContent(
            `{bold}Entropy:{/bold} ${currentEntropy.toFixed(3)}\n` +
            `Status: ${entropyStatus}\n\n` +
            `{bold}Entanglement:{/bold} ${currentEntanglement.toFixed(3)}\n` +
            `Status: ${entanglementStatus}\n\n` +
            `{bold}Active States:{/bold} ${this.data.states.size}`
        );

        // Add new operations to log
        quantumOps.forEach(op => {
            const timestamp = new Date().toISOString();
            const status = op.success ? '{green-fg}SUCCESS{/}' : '{red-fg}FAILED{/}';
            this.operationsLog.log(
                `[${timestamp}] ${status} - ${op.type}: ${op.description}`
            );
        });

        // Refresh screen
        this.screen.render();
    }

    /**
     * Get entropy status description
     * @private
     * @param {number} entropy - Current entropy value
     * @returns {string} Status description
     */
    _getEntropyStatus(entropy) {
        if (entropy >= this.options.entropyThreshold) {
            return '{green-fg}Optimal{/}';
        } else if (entropy >= this.options.entropyThreshold * 0.7) {
            return '{yellow-fg}Acceptable{/}';
        }
        return '{red-fg}Low{/}';
    }

    /**
     * Get entanglement status description
     * @private
     * @param {number} entanglement - Current entanglement value
     * @returns {string} Status description
     */
    _getEntanglementStatus(entanglement) {
        if (entanglement >= 0.9) {
            return '{green-fg}Strong{/}';
        } else if (entanglement >= 0.5) {
            return '{yellow-fg}Moderate{/}';
        }
        return '{red-fg}Weak{/}';
    }

    /**
     * Clean up view resources
     */
    cleanup() {
        if (this.container && this.container.detach) {
            this.container.detach();
        }
        this.initialized = false;
    }

    /**
     * Get view export data
     * @returns {Object} View data for export
     */
    getExportData() {
        return {
            currentEntropy: this.data.entropy[this.data.entropy.length - 1],
            currentEntanglement: this.data.entanglement[this.data.entanglement.length - 1],
            entropyHistory: this.data.entropy,
            entanglementHistory: this.data.entanglement,
            operations: this.data.operations,
            states: Array.from(this.data.states.entries())
        };
    }

    /**
     * Get view configuration
     * @returns {Object} View configuration
     */
    getConfiguration() {
        return {
            updateInterval: this.options.updateInterval,
            historySize: this.options.historySize,
            entropyThreshold: this.options.entropyThreshold
        };
    }

    /**
     * Set view configuration
     * @param {Object} config - New configuration
     */
    setConfiguration(config) {
        Object.assign(this.options, config);
        
        // Adjust data arrays if history size changed
        if (config.historySize && config.historySize !== this.data.entropy.length) {
            this.data.entropy = new Array(config.historySize).fill(0);
            this.data.entanglement = new Array(config.historySize).fill(0);
        }

        this.emit('configurationChanged', this.options);
    }
}

module.exports = QuantumView;