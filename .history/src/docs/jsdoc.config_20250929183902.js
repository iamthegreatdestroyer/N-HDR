/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation Generator Configuration
 */

module.exports = {
    // Source code configuration
    source: {
        include: ['src'],
        exclude: ['src/docs', 'src/**/test', 'src/**/*.test.js'],
        includePattern: '.+\\.js$',
        excludePattern: '(^|\\/|\\\\)_'
    },

    // Output configuration
    opts: {
        destination: './docs',
        recurse: true,
        template: './node_modules/better-docs',
        tutorials: './docs/tutorials',
        readme: './README.md'
    },

    // Documentation plugins
    plugins: [
        'plugins/markdown',
        'better-docs/typescript',
        'better-docs/category'
    ],

    // Documentation tags
    tags: {
        allowUnknownTags: ['category', 'subcategory', 'component'],
        dictionaries: ['jsdoc', 'closure']
    },

    // Source code parsing options
    sourceType: 'module',
    parserOptions: {
        ecmaVersion: 2022
    },

    // Documentation templates
    templates: {
        cleverLinks: false,
        monospaceLinks: false,
        systemName: 'Neural-HDR',
        systemSummary: 'AI Consciousness State Preservation & Transfer System',
        systemVersion: '1.0.0',
        systemAuthor: 'Stephen Bilodeau',
        systemCopyright: '© 2025 HDR Empire - PATENT PENDING - ALL RIGHTS RESERVED',
        includeDate: true,
        dateFormat: 'YYYY-MM-DD',
        navType: 'vertical',
        theme: 'dark',
        linenums: true,
        collapseSymbols: true,
        inverseNav: true,
        outputSourceFiles: true,
        outputSourcePath: true,
        search: true,
        sort: true,
        stylesheets: [
            './docs/styles/custom.css'
        ],
        scripts: [
            './docs/scripts/custom.js'
        ],
        analytics: {
            ga: 'UA-XXXXX-XXX'
        }
    },

    // Documentation layout
    opts: {
        private: true,
        recurse: true,
        lenient: true,
        destination: './docs',
        template: './node_modules/better-docs',
        readme: './README.md',
        package: './package.json',
        tutorials: './docs/tutorials',
        articles: './docs/articles',
        changelog: './CHANGELOG.md'
    },

    // Documentation categories
    docdash: {
        static: true,
        sort: true,
        sectionOrder: [
            'Classes',
            'Modules',
            'Externals',
            'Events',
            'Namespaces',
            'Mixins',
            'Tutorials',
            'Interfaces'
        ],
        meta: {
            title: 'Neural-HDR Documentation',
            description: 'Documentation for the Neural-HDR AI Consciousness System',
            keyword: 'neural-hdr, ai, consciousness, quantum, documentation'
        },
        menu: {
            'GitHub Repository': {
                href: 'https://github.com/hdr-empire/neural-hdr',
                target: '_blank'
            },
            'Bug Reports': {
                href: 'https://github.com/hdr-empire/neural-hdr/issues',
                target: '_blank'
            }
        },
        search: true,
        collapse: true,
        typedefs: true,
        removeQuotes: true,
        scripts: [],
        stylesheets: [],
        navLinks: [
            {
                label: 'Core',
                href: 'core.html'
            },
            {
                label: 'Security',
                href: 'security.html'
            },
            {
                label: 'Thermal',
                href: 'thermal.html'
            },
            {
                label: 'Consciousness',
                href: 'consciousness.html'
            },
            {
                label: 'API',
                href: 'api.html'
            }
        ]
    },

    // Documentation sections
    sections: {
        core: {
            title: 'Core Components',
            files: [
                'src/core/*.js',
                'src/core/**/*.js'
            ],
            order: [
                'NanoBot',
                'SwarmManager',
                'SwarmController'
            ]
        },
        security: {
            title: 'Security Components',
            files: [
                'src/core/security/*.js',
                'src/core/security/**/*.js'
            ],
            order: [
                'QuantumEntropyGenerator',
                'VanishingKeyManager',
                'SecureTaskExecution'
            ]
        },
        thermal: {
            title: 'Thermal Management',
            files: [
                'src/core/thermal/*.js',
                'src/core/thermal/**/*.js'
            ],
            order: [
                'ThermalManager',
                'AdaptiveThrottling',
                'PredictiveCooling'
            ]
        },
        consciousness: {
            title: 'Consciousness Layer',
            files: [
                'src/core/consciousness/*.js',
                'src/core/consciousness/**/*.js'
            ],
            order: [
                'ConsciousnessLayer',
                'StatePreservation',
                'QuantumEntanglement',
                'DimensionalMapping',
                'EmergenceEngine'
            ]
        },
        api: {
            title: 'API Reference',
            files: [
                'src/api/*.js',
                'src/api/**/*.js'
            ],
            order: [
                'ApiServer',
                'WebSocketServer',
                'IntegrationManager'
            ]
        }
    }
};