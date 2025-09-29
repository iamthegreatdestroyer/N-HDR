/**
 * @file Environment Detector for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

class EnvironmentDetector {
  constructor() {
    this.systemInfo = null;
    this.compatibilityStatus = null;
    this.requirements = {
      minCPUCores: 4,
      minMemoryGB: 8,
      minDiskGB: 20,
      supportedOS: ["linux", "darwin", "win32"],
      requiredDependencies: ["node", "npm", "python3", "git"],
    };
  }

  /**
   * Initializes the environment detector
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.gatherSystemInfo();
    await this.checkCompatibility();
  }

  /**
   * Gathers system information
   * @private
   */
  async gatherSystemInfo() {
    this.systemInfo = {
      platform: {
        type: os.platform(),
        release: os.release(),
        arch: os.arch(),
      },
      hardware: {
        cpuCores: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
      },
      virtualization: await this.detectVirtualization(),
      gpu: await this.detectGPU(),
      network: await this.getNetworkInfo(),
      dependencies: await this.checkDependencies(),
      quantum: await this.checkQuantumCapabilities(),
      swarm: await this.checkSwarmCapabilities(),
    };
  }

  /**
   * Detects virtualization environment
   * @private
   * @returns {Promise<object>} Virtualization info
   */
  async detectVirtualization() {
    try {
      if (os.platform() === "linux") {
        const { stdout } = await execAsync("systemd-detect-virt");
        return {
          isVirtual: stdout.trim() !== "none",
          type: stdout.trim(),
        };
      } else if (os.platform() === "win32") {
        const { stdout } = await execAsync('systeminfo | findstr /i "Hyper-V"');
        return {
          isVirtual: stdout.toLowerCase().includes("hyper-v"),
          type: "Hyper-V",
        };
      } else if (os.platform() === "darwin") {
        const { stdout } = await execAsync("sysctl hw.model");
        return {
          isVirtual: stdout.toLowerCase().includes("virtual"),
          type: stdout.includes("VMware") ? "VMware" : "Unknown",
        };
      }
    } catch {
      return {
        isVirtual: false,
        type: "Unknown",
      };
    }
  }

  /**
   * Detects GPU capabilities
   * @private
   * @returns {Promise<object>} GPU info
   */
  async detectGPU() {
    try {
      if (os.platform() === "win32") {
        const { stdout } = await execAsync(
          "wmic path win32_VideoController get name"
        );
        return {
          detected: true,
          devices: stdout
            .split("\n")
            .slice(1)
            .map((line) => line.trim())
            .filter(Boolean),
        };
      } else if (os.platform() === "linux") {
        const { stdout } = await execAsync("lspci | grep -i vga");
        return {
          detected: true,
          devices: stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        };
      } else if (os.platform() === "darwin") {
        const { stdout } = await execAsync(
          "system_profiler SPDisplaysDataType"
        );
        return {
          detected: true,
          devices: stdout
            .split("\n")
            .filter((line) => line.includes("Chipset Model:"))
            .map((line) => line.split(":")[1].trim()),
        };
      }
    } catch {
      return {
        detected: false,
        devices: [],
      };
    }
  }

  /**
   * Gets network information
   * @private
   * @returns {Promise<object>} Network info
   */
  async getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = {
      interfaces: interfaces,
      connectivity: await this.checkConnectivity(),
      bandwidth: await this.measureBandwidth(),
    };

    return networkInfo;
  }

  /**
   * Checks internet connectivity
   * @private
   * @returns {Promise<object>} Connectivity status
   */
  async checkConnectivity() {
    try {
      const hosts = ["8.8.8.8", "1.1.1.1"];
      const results = {};

      for (const host of hosts) {
        try {
          const { stdout } = await execAsync(`ping -c 1 ${host}`);
          const match = stdout.match(/time=(\d+(\.\d+)?)/);
          results[host] = match ? parseFloat(match[1]) : null;
        } catch {
          results[host] = null;
        }
      }

      return {
        online: Object.values(results).some((v) => v !== null),
        latency: results,
      };
    } catch {
      return {
        online: false,
        latency: {},
      };
    }
  }

  /**
   * Measures network bandwidth
   * @private
   * @returns {Promise<object>} Bandwidth measurements
   */
  async measureBandwidth() {
    try {
      const testFile = "https://speed.cloudflare.com/__down?bytes=1048576";
      const start = Date.now();

      const response = await fetch(testFile);
      const buffer = await response.arrayBuffer();

      const duration = (Date.now() - start) / 1000;
      const bytesPerSecond = buffer.byteLength / duration;
      const mbps = (bytesPerSecond * 8) / 1000000;

      return {
        measured: true,
        mbps: mbps,
        timestamp: new Date(),
      };
    } catch {
      return {
        measured: false,
        mbps: null,
      };
    }
  }

  /**
   * Checks required dependencies
   * @private
   * @returns {Promise<object>} Dependency status
   */
  async checkDependencies() {
    const status = {};

    for (const dep of this.requirements.requiredDependencies) {
      try {
        const { stdout } = await execAsync(`${dep} --version`);
        status[dep] = {
          installed: true,
          version: stdout.trim(),
        };
      } catch {
        status[dep] = {
          installed: false,
          version: null,
        };
      }
    }

    return status;
  }

  /**
   * Checks quantum processing capabilities
   * @private
   * @returns {Promise<object>} Quantum capabilities
   */
  async checkQuantumCapabilities() {
    return {
      tensorflowInstalled: await this.checkTensorFlow(),
      cudaAvailable: await this.checkCUDA(),
      quantumSimulation: {
        maxQubits: this.calculateMaxQubits(),
        precision: this.estimateQuantumPrecision(),
      },
    };
  }

  /**
   * Checks TensorFlow installation
   * @private
   * @returns {Promise<boolean>} Whether TensorFlow is installed
   */
  async checkTensorFlow() {
    try {
      await execAsync('python3 -c "import tensorflow"');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks CUDA availability
   * @private
   * @returns {Promise<boolean>} Whether CUDA is available
   */
  async checkCUDA() {
    try {
      await execAsync("nvidia-smi");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculates maximum supported qubits
   * @private
   * @returns {number} Maximum qubits
   */
  calculateMaxQubits() {
    const memoryGB = os.totalmem() / (1024 * 1024 * 1024);
    // Each qubit doubles memory requirements
    // Leave some memory for system and other processes
    const availableMemoryGB = memoryGB * 0.7;
    return Math.floor(Math.log2(availableMemoryGB * 1024));
  }

  /**
   * Estimates quantum simulation precision
   * @private
   * @returns {number} Estimated precision
   */
  estimateQuantumPrecision() {
    const cpuInfo = os.cpus()[0];
    const baselineFlops = 1e9; // 1 GFLOPS baseline
    const estimatedFlops = this.estimateFlops(cpuInfo);
    return Math.min(0.99999, (estimatedFlops / baselineFlops) * 0.9999);
  }

  /**
   * Estimates FLOPS based on CPU info
   * @private
   * @param {object} cpuInfo - CPU information
   * @returns {number} Estimated FLOPS
   */
  estimateFlops(cpuInfo) {
    const clockSpeed = cpuInfo.speed;
    const cores = os.cpus().length;
    // Rough estimate: assume 4 FLOPS per cycle per core
    return clockSpeed * 1e6 * cores * 4;
  }

  /**
   * Checks swarm capabilities
   * @private
   * @returns {Promise<object>} Swarm capabilities
   */
  async checkSwarmCapabilities() {
    return {
      networkLatency: await this.measureNetworkLatency(),
      maxConnections: this.estimateMaxConnections(),
      distributedProcessing: {
        supported: this.systemInfo.hardware.cpuCores >= 4,
        maxNodes: this.calculateMaxNodes(),
      },
    };
  }

  /**
   * Measures network latency
   * @private
   * @returns {Promise<object>} Latency measurements
   */
  async measureNetworkLatency() {
    const measurements = {};
    const endpoints = ["gateway.example.com", "swarm.example.com"];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        await fetch(`https://${endpoint}/ping`);
        measurements[endpoint] = Date.now() - start;
      } catch {
        measurements[endpoint] = null;
      }
    }

    return measurements;
  }

  /**
   * Estimates maximum connections
   * @private
   * @returns {number} Estimated max connections
   */
  estimateMaxConnections() {
    const memoryGB = os.totalmem() / (1024 * 1024 * 1024);
    // Assume each connection needs 10MB
    return Math.floor((memoryGB * 1024) / 10);
  }

  /**
   * Calculates maximum swarm nodes
   * @private
   * @returns {number} Maximum nodes
   */
  calculateMaxNodes() {
    const cores = os.cpus().length;
    const memory = os.totalmem() / (1024 * 1024 * 1024);
    return Math.min(cores * 2, Math.floor(memory / 2));
  }

  /**
   * Checks system compatibility
   * @private
   */
  async checkCompatibility() {
    const checks = [];

    // Check OS
    checks.push({
      name: "Operating System",
      passed: this.requirements.supportedOS.includes(os.platform()),
      details: `Running on ${os.platform()}`,
    });

    // Check CPU
    checks.push({
      name: "CPU Cores",
      passed:
        this.systemInfo.hardware.cpuCores >= this.requirements.minCPUCores,
      details: `${this.systemInfo.hardware.cpuCores} cores available`,
    });

    // Check Memory
    const memoryGB =
      this.systemInfo.hardware.totalMemory / (1024 * 1024 * 1024);
    checks.push({
      name: "Memory",
      passed: memoryGB >= this.requirements.minMemoryGB,
      details: `${Math.floor(memoryGB)}GB available`,
    });

    // Check Dependencies
    const missingDeps = Object.entries(this.systemInfo.dependencies)
      .filter(([, status]) => !status.installed)
      .map(([dep]) => dep);

    checks.push({
      name: "Dependencies",
      passed: missingDeps.length === 0,
      details: missingDeps.length
        ? `Missing: ${missingDeps.join(", ")}`
        : "All dependencies installed",
    });

    // Check Network
    checks.push({
      name: "Network",
      passed: this.systemInfo.network.connectivity.online,
      details: this.systemInfo.network.connectivity.online
        ? `Online, average latency: ${
            Object.values(this.systemInfo.network.connectivity.latency)
              .filter(Boolean)
              .reduce((a, b) => a + b, 0) /
            Object.values(this.systemInfo.network.connectivity.latency).filter(
              Boolean
            ).length
          }ms`
        : "Offline",
    });

    this.compatibilityStatus = {
      checks,
      compatible: checks.every((check) => check.passed),
      timestamp: new Date(),
    };
  }

  /**
   * Gets system compatibility status
   * @returns {object} Compatibility status
   */
  getCompatibilityStatus() {
    return this.compatibilityStatus;
  }

  /**
   * Exports environment information to markdown
   * @returns {string} Markdown formatted environment info
   */
  exportToMarkdown() {
    let markdown = "# N-HDR Environment Analysis\n\n";

    // System Information
    markdown += "## System Information\n\n";
    markdown += "### Platform\n";
    markdown += `- Type: ${this.systemInfo.platform.type}\n`;
    markdown += `- Release: ${this.systemInfo.platform.release}\n`;
    markdown += `- Architecture: ${this.systemInfo.platform.arch}\n\n`;

    markdown += "### Hardware\n";
    markdown += `- CPU Cores: ${this.systemInfo.hardware.cpuCores}\n`;
    markdown += `- Total Memory: ${Math.floor(
      this.systemInfo.hardware.totalMemory / (1024 * 1024 * 1024)
    )}GB\n`;
    markdown += `- Free Memory: ${Math.floor(
      this.systemInfo.hardware.freeMemory / (1024 * 1024 * 1024)
    )}GB\n\n`;

    // Compatibility Status
    markdown += "## Compatibility Status\n\n";
    markdown += "| Check | Status | Details |\n";
    markdown += "|-------|--------|----------|\n";

    for (const check of this.compatibilityStatus.checks) {
      markdown += `| ${check.name} | ${check.passed ? "✅" : "❌"} | ${
        check.details
      } |\n`;
    }

    return markdown;
  }
}

module.exports = EnvironmentDetector;
