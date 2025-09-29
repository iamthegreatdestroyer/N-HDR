/**
 * @file Platform Optimization Manager for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const os = require('os');
const { performance } = require('perf_hooks');
const { cpus } = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class PlatformOptimizationManager {
    constructor() {
        this.platform = os.platform();
        this.optimizations = new Map();
        this.metrics = new Map();
        this.profiles = new Map();
    }

    /**
     * Initializes the optimization manager
     */
    async initialize() {
        await this.detectPlatformCapabilities();
        await this.createOptimizationProfiles();
        await this.applyDefaultOptimizations();
    }

    /**
     * Detects platform capabilities
     * @private
     */
    async detectPlatformCapabilities() {
        this.capabilities = {
            cpu: await this.analyzeCPUCapabilities(),
            memory: await this.analyzeMemoryCapabilities(),
            gpu: await this.detectGPUCapabilities(),
            network: await this.analyzeNetworkCapabilities(),
            storage: await this.analyzeStorageCapabilities(),
            platform: await this.analyzePlatformSpecifics()
        };
    }

    /**
     * Analyzes CPU capabilities
     * @private
     * @returns {object} CPU capabilities
     */
    async analyzeCPUCapabilities() {
        const cpuInfo = cpus();
        
        // Calculate CPU metrics
        const clockSpeeds = cpuInfo.map(cpu => cpu.speed);
        const avgClockSpeed = clockSpeeds.reduce((a, b) => a + b, 0) / clockSpeeds.length;
        
        // Detect CPU features
        const features = new Set();
        if (this.platform === 'linux') {
            try {
                const { stdout } = await execAsync('cat /proc/cpuinfo');
                if (stdout.includes('sse4_2')) features.add('sse4.2');
                if (stdout.includes('avx2')) features.add('avx2');
                if (stdout.includes('avx512')) features.add('avx512');
            } catch {
                // Fallback to basic feature detection
            }
        }

        return {
            cores: cpuInfo.length,
            avgClockSpeed,
            features: Array.from(features),
            architecture: process.arch,
            loadAverage: os.loadavg()
        };
    }

    /**
     * Analyzes memory capabilities
     * @private
     * @returns {object} Memory capabilities
     */
    async analyzeMemoryCapabilities() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        let swapInfo = { total: 0, free: 0 };
        if (this.platform === 'linux') {
            try {
                const { stdout } = await execAsync('free -b');
                const lines = stdout.split('\n');
                const swapLine = lines.find(l => l.startsWith('Swap:'));
                if (swapLine) {
                    const [, total, free] = swapLine.split(/\s+/);
                    swapInfo = {
                        total: parseInt(total),
                        free: parseInt(free)
                    };
                }
            } catch {
                // Fallback to basic swap info
            }
        }

        return {
            total: totalMem,
            free: freeMem,
            swap: swapInfo,
            pageSize: os.constants.pageSize
        };
    }

    /**
     * Detects GPU capabilities
     * @private
     * @returns {object} GPU capabilities
     */
    async detectGPUCapabilities() {
        const gpuInfo = {
            available: false,
            devices: [],
            cuda: false,
            tensorCores: false
        };

        if (this.platform === 'win32') {
            try {
                const { stdout } = await execAsync('nvidia-smi -L');
                gpuInfo.available = true;
                gpuInfo.devices = stdout.split('\n')
                    .filter(Boolean)
                    .map(line => {
                        const match = line.match(/GPU \d+: (.+) \(UUID: .+\)/);
                        return match ? match[1] : null;
                    })
                    .filter(Boolean);
                
                // Check CUDA support
                const cudaVersion = await this.checkCUDASupport();
                gpuInfo.cuda = cudaVersion !== null;
            } catch {
                // No NVIDIA GPU available
            }
        } else if (this.platform === 'linux') {
            try {
                const { stdout } = await execAsync('lspci | grep -i nvidia');
                gpuInfo.available = stdout.length > 0;
                gpuInfo.devices = stdout.split('\n')
                    .filter(Boolean)
                    .map(line => {
                        const match = line.match(/\d+:\d+\.\d+ (.+)/);
                        return match ? match[1] : null;
                    })
                    .filter(Boolean);
                
                // Check CUDA support
                const cudaVersion = await this.checkCUDASupport();
                gpuInfo.cuda = cudaVersion !== null;
            } catch {
                // No NVIDIA GPU available
            }
        }

        return gpuInfo;
    }

    /**
     * Checks CUDA support
     * @private
     * @returns {string|null} CUDA version
     */
    async checkCUDASupport() {
        try {
            const { stdout } = await execAsync('nvcc --version');
            const match = stdout.match(/release (\d+\.\d+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    /**
     * Analyzes network capabilities
     * @private
     * @returns {object} Network capabilities
     */
    async analyzeNetworkCapabilities() {
        const interfaces = os.networkInterfaces();
        const networkMetrics = {
            interfaces: {},
            throughput: await this.measureNetworkThroughput(),
            latency: await this.measureNetworkLatency()
        };

        for (const [name, addrs] of Object.entries(interfaces)) {
            networkMetrics.interfaces[name] = addrs.map(addr => ({
                address: addr.address,
                family: addr.family,
                internal: addr.internal
            }));
        }

        return networkMetrics;
    }

    /**
     * Measures network throughput
     * @private
     * @returns {object} Throughput measurements
     */
    async measureNetworkThroughput() {
        try {
            const testFile = 'https://speed.cloudflare.com/__down?bytes=1048576';
            const measurements = [];

            for (let i = 0; i < 3; i++) {
                const start = performance.now();
                const response = await fetch(testFile);
                const buffer = await response.arrayBuffer();
                const duration = (performance.now() - start) / 1000;
                measurements.push(buffer.byteLength / duration);
            }

            return {
                bytesPerSecond: measurements.reduce((a, b) => a + b, 0) / measurements.length,
                samples: measurements.length
            };
        } catch {
            return {
                bytesPerSecond: 0,
                samples: 0
            };
        }
    }

    /**
     * Measures network latency
     * @private
     * @returns {object} Latency measurements
     */
    async measureNetworkLatency() {
        const targets = ['8.8.8.8', '1.1.1.1'];
        const measurements = {};

        for (const target of targets) {
            try {
                const { stdout } = await execAsync(`ping -c 4 ${target}`);
                const match = stdout.match(/min\/avg\/max(?:\/mdev)? = (\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)/);
                if (match) {
                    measurements[target] = {
                        min: parseFloat(match[1]),
                        avg: parseFloat(match[2]),
                        max: parseFloat(match[3])
                    };
                }
            } catch {
                measurements[target] = null;
            }
        }

        return measurements;
    }

    /**
     * Analyzes storage capabilities
     * @private
     * @returns {object} Storage capabilities
     */
    async analyzeStorageCapabilities() {
        const storage = {
            type: await this.detectStorageType(),
            performance: await this.measureStoragePerformance()
        };

        if (this.platform === 'linux') {
            try {
                const { stdout } = await execAsync('df -h /');
                const lines = stdout.split('\n');
                const rootLine = lines[1];
                const [filesystem, size, used, available] = rootLine.split(/\s+/);
                
                storage.filesystem = {
                    name: filesystem,
                    size,
                    used,
                    available
                };
            } catch {
                // Fallback to basic storage info
            }
        }

        return storage;
    }

    /**
     * Detects storage type
     * @private
     * @returns {string} Storage type
     */
    async detectStorageType() {
        if (this.platform === 'linux') {
            try {
                const { stdout } = await execAsync('lsblk -d -o name,rota');
                return stdout.includes('0') ? 'ssd' : 'hdd';
            } catch {
                return 'unknown';
            }
        }
        return 'unknown';
    }

    /**
     * Measures storage performance
     * @private
     * @returns {object} Storage performance metrics
     */
    async measureStoragePerformance() {
        const testFile = 'nhdr-storage-test';
        const testSize = 100 * 1024 * 1024; // 100MB

        try {
            // Write test
            const writeStart = performance.now();
            await fs.writeFile(testFile, Buffer.alloc(testSize));
            const writeDuration = (performance.now() - writeStart) / 1000;

            // Read test
            const readStart = performance.now();
            await fs.readFile(testFile);
            const readDuration = (performance.now() - readStart) / 1000;

            // Clean up
            await fs.unlink(testFile);

            return {
                writeSpeed: testSize / writeDuration,
                readSpeed: testSize / readDuration
            };
        } catch {
            return {
                writeSpeed: 0,
                readSpeed: 0
            };
        }
    }

    /**
     * Analyzes platform-specific features
     * @private
     * @returns {object} Platform features
     */
    async analyzePlatformSpecifics() {
        const features = {
            platform: this.platform,
            release: os.release(),
            specific: {}
        };

        if (this.platform === 'win32') {
            features.specific = await this.analyzeWindowsFeatures();
        } else if (this.platform === 'linux') {
            features.specific = await this.analyzeLinuxFeatures();
        } else if (this.platform === 'darwin') {
            features.specific = await this.analyzeMacFeatures();
        }

        return features;
    }

    /**
     * Analyzes Windows-specific features
     * @private
     * @returns {object} Windows features
     */
    async analyzeWindowsFeatures() {
        try {
            const { stdout: systemInfo } = await execAsync('systeminfo');
            return {
                windowsVersion: systemInfo.match(/OS Version:\s+(.+)/)?.[1],
                hypervisorPresent: systemInfo.includes('Hyper-V'),
                secureBootEnabled: systemInfo.includes('Secure Boot State: On')
            };
        } catch {
            return {};
        }
    }

    /**
     * Analyzes Linux-specific features
     * @private
     * @returns {object} Linux features
     */
    async analyzeLinuxFeatures() {
        const features = {};

        try {
            // Check for containerization
            const { stdout: cgroupInfo } = await execAsync('cat /proc/1/cgroup');
            features.containerized = cgroupInfo.includes('docker') || cgroupInfo.includes('kubepods');

            // Check for systemd
            features.systemd = await this.hasSystemd();

            // Get kernel parameters
            const { stdout: sysctl } = await execAsync('sysctl -a');
            features.kernelParameters = {
                maxFiles: sysctl.match(/fs.file-max = (\d+)/)?.[1],
                maxThreads: sysctl.match(/kernel.threads-max = (\d+)/)?.[1]
            };
        } catch {
            // Fallback to basic features
        }

        return features;
    }

    /**
     * Checks if system uses systemd
     * @private
     * @returns {Promise<boolean>} Whether systemd is present
     */
    async hasSystemd() {
        try {
            await execAsync('systemctl --version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Analyzes macOS-specific features
     * @private
     * @returns {object} macOS features
     */
    async analyzeMacFeatures() {
        try {
            const { stdout: systemVersion } = await execAsync('sw_vers');
            return {
                version: systemVersion.match(/ProductVersion:\s+(.+)/)?.[1],
                architecture: process.arch === 'arm64' ? 'Apple Silicon' : 'Intel'
            };
        } catch {
            return {};
        }
    }

    /**
     * Creates optimization profiles
     * @private
     */
    async createOptimizationProfiles() {
        // Base profile
        this.profiles.set('base', {
            threadPool: Math.max(2, os.cpus().length - 1),
            memoryLimit: Math.floor(os.totalmem() * 0.7),
            batchSize: 1000,
            cacheSize: 100 * 1024 * 1024 // 100MB
        });

        // High performance profile
        this.profiles.set('performance', {
            threadPool: os.cpus().length,
            memoryLimit: Math.floor(os.totalmem() * 0.9),
            batchSize: 5000,
            cacheSize: 500 * 1024 * 1024 // 500MB
        });

        // Memory efficient profile
        this.profiles.set('memory-efficient', {
            threadPool: Math.max(2, Math.floor(os.cpus().length / 2)),
            memoryLimit: Math.floor(os.totalmem() * 0.5),
            batchSize: 500,
            cacheSize: 50 * 1024 * 1024 // 50MB
        });

        // Platform-specific profiles
        if (this.capabilities.gpu.cuda) {
            this.profiles.set('gpu-accelerated', {
                ...this.profiles.get('performance'),
                useGPU: true,
                gpuMemoryLimit: 4 * 1024 * 1024 * 1024 // 4GB
            });
        }

        if (this.platform === 'linux' && this.capabilities.cpu.features.includes('avx512')) {
            this.profiles.set('linux-optimized', {
                ...this.profiles.get('performance'),
                useAVX512: true,
                hugepages: true
            });
        }
    }

    /**
     * Applies default optimizations
     * @private
     */
    async applyDefaultOptimizations() {
        // Select appropriate profile based on platform and capabilities
        let profile = 'base';
        
        if (this.capabilities.gpu.cuda) {
            profile = 'gpu-accelerated';
        } else if (this.platform === 'linux' && this.capabilities.cpu.features.includes('avx512')) {
            profile = 'linux-optimized';
        } else if (os.totalmem() < 8 * 1024 * 1024 * 1024) { // Less than 8GB RAM
            profile = 'memory-efficient';
        } else {
            profile = 'performance';
        }

        await this.applyProfile(profile);
    }

    /**
     * Applies an optimization profile
     * @param {string} profileName - Name of the profile to apply
     * @returns {Promise<object>} Applied optimizations
     */
    async applyProfile(profileName) {
        const profile = this.profiles.get(profileName);
        if (!profile) {
            throw new Error(`Unknown profile: ${profileName}`);
        }

        const optimizations = new Map();

        // Thread pool optimization
        optimizations.set('threadPool', {
            value: profile.threadPool,
            applied: await this.optimizeThreadPool(profile.threadPool)
        });

        // Memory optimization
        optimizations.set('memory', {
            value: profile.memoryLimit,
            applied: await this.optimizeMemory(profile.memoryLimit)
        });

        // Cache optimization
        optimizations.set('cache', {
            value: profile.cacheSize,
            applied: await this.optimizeCache(profile.cacheSize)
        });

        // GPU optimization if available
        if (profile.useGPU && this.capabilities.gpu.cuda) {
            optimizations.set('gpu', {
                value: profile.gpuMemoryLimit,
                applied: await this.optimizeGPU(profile.gpuMemoryLimit)
            });
        }

        // Platform-specific optimizations
        if (this.platform === 'linux') {
            optimizations.set('linux', {
                value: profile.hugepages,
                applied: await this.optimizeLinux(profile)
            });
        }

        this.optimizations = optimizations;
        return Object.fromEntries(optimizations);
    }

    /**
     * Optimizes thread pool configuration
     * @private
     * @param {number} threads - Number of threads
     * @returns {Promise<boolean>} Whether optimization was applied
     */
    async optimizeThreadPool(threads) {
        try {
            process.env.UV_THREADPOOL_SIZE = threads.toString();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Optimizes memory usage
     * @private
     * @param {number} limit - Memory limit in bytes
     * @returns {Promise<boolean>} Whether optimization was applied
     */
    async optimizeMemory(limit) {
        try {
            // Set V8 heap limit
            const limitInMB = Math.floor(limit / (1024 * 1024));
            const v8 = require('v8');
            v8.setHeapSizeLimit(limit);
            
            // Configure garbage collection
            global.gc && global.gc();
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Optimizes cache configuration
     * @private
     * @param {number} size - Cache size in bytes
     * @returns {Promise<boolean>} Whether optimization was applied
     */
    async optimizeCache(size) {
        try {
            // Configure cache size for various components
            const components = [
                'neural-hdr',
                'quantum-processor',
                'ns-hdr'
            ];

            for (const component of components) {
                const componentPath = path.join(process.cwd(), 'src', 'core', component);
                if (await fs.exists(componentPath)) {
                    const config = path.join(componentPath, 'config.json');
                    const settings = require(config);
                    settings.cacheSize = size;
                    await fs.writeFile(config, JSON.stringify(settings, null, 2));
                }
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Optimizes GPU usage
     * @private
     * @param {number} memoryLimit - GPU memory limit
     * @returns {Promise<boolean>} Whether optimization was applied
     */
    async optimizeGPU(memoryLimit) {
        try {
            if (!this.capabilities.gpu.cuda) {
                return false;
            }

            // Set CUDA device properties
            process.env.CUDA_VISIBLE_DEVICES = '0';
            process.env.TF_FORCE_GPU_ALLOW_GROWTH = 'true';
            process.env.TF_GPU_MEMORY_LIMIT = memoryLimit.toString();

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Applies Linux-specific optimizations
     * @private
     * @param {object} profile - Optimization profile
     * @returns {Promise<boolean>} Whether optimizations were applied
     */
    async optimizeLinux(profile) {
        if (this.platform !== 'linux') {
            return false;
        }

        try {
            // Enable huge pages if specified
            if (profile.hugepages) {
                await execAsync('sudo sysctl -w vm.nr_hugepages=1024');
            }

            // Optimize network settings
            await execAsync(`
                sudo sysctl -w net.core.rmem_max=16777216
                sudo sysctl -w net.core.wmem_max=16777216
                sudo sysctl -w net.ipv4.tcp_rmem='4096 87380 16777216'
                sudo sysctl -w net.ipv4.tcp_wmem='4096 87380 16777216'
            `);

            // Optimize file system
            await execAsync(`
                sudo sysctl -w fs.file-max=2097152
                sudo sysctl -w fs.nr_open=2097152
            `);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets current optimization status
     * @returns {object} Optimization status
     */
    getOptimizationStatus() {
        return {
            platform: this.platform,
            capabilities: this.capabilities,
            activeOptimizations: Object.fromEntries(this.optimizations),
            metrics: Object.fromEntries(this.metrics)
        };
    }

    /**
     * Exports optimization information to markdown
     * @returns {string} Markdown formatted optimization info
     */
    exportToMarkdown() {
        let markdown = '# N-HDR Platform Optimization Status\n\n';

        // Platform Information
        markdown += '## Platform Information\n\n';
        markdown += `- Platform: ${this.platform}\n`;
        markdown += `- Architecture: ${process.arch}\n`;
        markdown += `- Node.js Version: ${process.version}\n\n`;

        // Capabilities
        markdown += '## System Capabilities\n\n';
        
        // CPU
        markdown += '### CPU\n';
        markdown += `- Cores: ${this.capabilities.cpu.cores}\n`;
        markdown += `- Average Clock Speed: ${this.capabilities.cpu.avgClockSpeed} MHz\n`;
        markdown += `- Features: ${this.capabilities.cpu.features.join(', ') || 'None detected'}\n\n`;

        // Memory
        const totalMemGB = Math.round(this.capabilities.memory.total / (1024 * 1024 * 1024));
        markdown += '### Memory\n';
        markdown += `- Total Memory: ${totalMemGB}GB\n`;
        markdown += `- Page Size: ${this.capabilities.memory.pageSize} bytes\n\n`;

        // GPU
        markdown += '### GPU\n';
        if (this.capabilities.gpu.available) {
            markdown += '- GPU Support: Available\n';
            markdown += `- Devices: ${this.capabilities.gpu.devices.join(', ')}\n`;
            markdown += `- CUDA Support: ${this.capabilities.gpu.cuda ? 'Yes' : 'No'}\n\n`;
        } else {
            markdown += '- GPU Support: Not available\n\n';
        }

        // Active Optimizations
        markdown += '## Active Optimizations\n\n';
        markdown += '| Category | Value | Status |\n';
        markdown += '|----------|--------|--------|\n';
        
        for (const [category, opt] of this.optimizations) {
            markdown += `| ${category} | ${opt.value} | ${opt.applied ? '✅' : '❌'} |\n`;
        }

        return markdown;
    }
}

module.exports = PlatformOptimizationManager;