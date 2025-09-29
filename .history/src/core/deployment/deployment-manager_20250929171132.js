/**
 * @file Deployment Manager for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const fs = require("fs").promises;
const path = require("path");
const childProcess = require("child_process");
const { promisify } = require("util");
const exec = promisify(childProcess.exec);

class DeploymentManager {
  constructor() {
    this.config = new Map();
    this.environments = new Map();
    this.deploymentHistory = [];
  }

  /**
   * Initializes the deployment manager
   * @param {object} config - Deployment configuration
   */
  async initialize(config = {}) {
    this.config = new Map(Object.entries(config));
    await this.validateEnvironments();
  }

  /**
   * Validates deployment environments
   * @private
   */
  async validateEnvironments() {
    const environments = this.config.get("environments") || {};

    for (const [name, env] of Object.entries(environments)) {
      try {
        await this.validateEnvironment(env);
        this.environments.set(name, {
          ...env,
          status: "valid",
          lastValidated: new Date(),
        });
      } catch (error) {
        this.environments.set(name, {
          ...env,
          status: "invalid",
          error: error.message,
          lastValidated: new Date(),
        });
      }
    }
  }

  /**
   * Validates a specific environment
   * @private
   * @param {object} env - Environment configuration
   */
  async validateEnvironment(env) {
    // Check required environment variables
    const requiredVars = [
      "NODE_ENV",
      "QUANTUM_LAYERS",
      "SECURITY_LEVEL",
      "NS_HDR_ENDPOINT",
    ];

    for (const variable of requiredVars) {
      if (!env[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
      }
    }

    // Validate directory structure
    const requiredDirs = ["config", "src/core", "src/api", "logs"];

    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(env.basePath, dir));
      } catch {
        throw new Error(`Missing required directory: ${dir}`);
      }
    }

    // Validate dependencies
    await this.validateDependencies(env);
  }

  /**
   * Validates system dependencies
   * @private
   * @param {object} env - Environment configuration
   */
  async validateDependencies(env) {
    const { dependencies } = require(path.join(env.basePath, "package.json"));

    for (const [dep, version] of Object.entries(dependencies)) {
      try {
        await exec(`npm list ${dep}@${version} --json`);
      } catch {
        throw new Error(`Missing or invalid dependency: ${dep}@${version}`);
      }
    }
  }

  /**
   * Deploys the system to a specific environment
   * @param {string} environment - Target environment name
   * @param {object} options - Deployment options
   * @returns {object} Deployment result
   */
  async deploy(environment, options = {}) {
    const env = this.environments.get(environment);
    if (!env) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    if (env.status !== "valid") {
      throw new Error(`Environment ${environment} is not valid: ${env.error}`);
    }

    const deployment = {
      id: Date.now().toString(36),
      environment,
      timestamp: new Date(),
      steps: [],
    };

    try {
      // Backup current state
      await this.backupCurrentState(env);
      deployment.steps.push({
        name: "backup",
        status: "completed",
      });

      // Validate deployment package
      await this.validateDeploymentPackage(env);
      deployment.steps.push({
        name: "validation",
        status: "completed",
      });

      // Configure environment
      await this.configureEnvironment(env);
      deployment.steps.push({
        name: "configuration",
        status: "completed",
      });

      // Deploy core components
      await this.deployCoreComponents(env);
      deployment.steps.push({
        name: "core-deployment",
        status: "completed",
      });

      // Start services
      await this.startServices(env);
      deployment.steps.push({
        name: "service-start",
        status: "completed",
      });

      // Run health checks
      await this.runHealthChecks(env);
      deployment.steps.push({
        name: "health-check",
        status: "completed",
      });

      deployment.status = "success";
    } catch (error) {
      deployment.status = "failed";
      deployment.error = error.message;

      // Rollback if needed
      if (options.autoRollback) {
        await this.rollback(deployment.id);
        deployment.steps.push({
          name: "rollback",
          status: "completed",
        });
      }
    }

    this.deploymentHistory.push(deployment);
    return deployment;
  }

  /**
   * Backs up the current state
   * @private
   * @param {object} env - Environment configuration
   */
  async backupCurrentState(env) {
    const backupDir = path.join(env.basePath, "backups", Date.now().toString());
    await fs.mkdir(backupDir, { recursive: true });

    const filesToBackup = ["config", "src", "package.json", ".env"];

    for (const file of filesToBackup) {
      const source = path.join(env.basePath, file);
      const target = path.join(backupDir, file);
      await fs.cp(source, target, { recursive: true });
    }
  }

  /**
   * Validates the deployment package
   * @private
   * @param {object} env - Environment configuration
   */
  async validateDeploymentPackage(env) {
    // Check package integrity
    const { stdout } = await exec("npm audit", { cwd: env.basePath });
    if (stdout.includes("critical")) {
      throw new Error(
        "Critical security vulnerabilities found in dependencies"
      );
    }

    // Run tests
    await exec("npm test", { cwd: env.basePath });
  }

  /**
   * Configures the deployment environment
   * @private
   * @param {object} env - Environment configuration
   */
  async configureEnvironment(env) {
    // Set environment variables
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }

    // Configure system settings
    await fs.writeFile(
      path.join(env.basePath, "config", "system.json"),
      JSON.stringify(this.config.get("system"), null, 2)
    );
  }

  /**
   * Deploys core system components
   * @private
   * @param {object} env - Environment configuration
   */
  async deployCoreComponents(env) {
    const components = [
      "neural-hdr",
      "security-manager",
      "quantum-processor",
      "ns-hdr",
    ];

    for (const component of components) {
      await this.deployComponent(component, env);
    }
  }

  /**
   * Deploys a specific component
   * @private
   * @param {string} component - Component name
   * @param {object} env - Environment configuration
   */
  async deployComponent(component, env) {
    const source = path.join(env.basePath, "src", "core", component);
    const target = path.join(env.deployPath, "core", component);

    await fs.mkdir(target, { recursive: true });
    await fs.cp(source, target, { recursive: true });

    // Run component-specific initialization
    const initScript = path.join(target, "init.js");
    if (await this.fileExists(initScript)) {
      await exec(`node ${initScript}`, { cwd: target });
    }
  }

  /**
   * Starts system services
   * @private
   * @param {object} env - Environment configuration
   */
  async startServices(env) {
    const services = [
      "neural-hdr-service",
      "quantum-service",
      "ns-hdr-service",
    ];

    for (const service of services) {
      await exec(`pm2 start ${service}.js`, { cwd: env.deployPath });
    }
  }

  /**
   * Runs system health checks
   * @private
   * @param {object} env - Environment configuration
   */
  async runHealthChecks(env) {
    const checks = [
      this.checkApiHealth.bind(this),
      this.checkDatabaseConnection.bind(this),
      this.checkQuantumProcessor.bind(this),
      this.checkSwarmConnection.bind(this),
    ];

    for (const check of checks) {
      await check(env);
    }
  }

  /**
   * Checks API health
   * @private
   * @param {object} env - Environment configuration
   */
  async checkApiHealth(env) {
    const response = await fetch(`${env.apiEndpoint}/health`);
    if (!response.ok) {
      throw new Error("API health check failed");
    }
  }

  /**
   * Checks database connection
   * @private
   * @param {object} env - Environment configuration
   */
  async checkDatabaseConnection(env) {
    await exec("node scripts/check-db.js", { cwd: env.basePath });
  }

  /**
   * Checks quantum processor status
   * @private
   * @param {object} env - Environment configuration
   */
  async checkQuantumProcessor(env) {
    await exec("node scripts/check-quantum.js", { cwd: env.basePath });
  }

  /**
   * Checks NS-HDR connection
   * @private
   * @param {object} env - Environment configuration
   */
  async checkSwarmConnection(env) {
    await exec("node scripts/check-swarm.js", { cwd: env.basePath });
  }

  /**
   * Rolls back a deployment
   * @param {string} deploymentId - ID of the deployment to roll back
   * @returns {object} Rollback result
   */
  async rollback(deploymentId) {
    const deployment = this.deploymentHistory.find(
      (d) => d.id === deploymentId
    );
    if (!deployment) {
      throw new Error(`Unknown deployment: ${deploymentId}`);
    }

    const env = this.environments.get(deployment.environment);
    const backupDir = path.join(env.basePath, "backups", deploymentId);

    if (!(await this.fileExists(backupDir))) {
      throw new Error("Backup not found");
    }

    // Stop services
    await exec("pm2 stop all", { cwd: env.deployPath });

    // Restore backup
    await fs.cp(backupDir, env.basePath, { recursive: true });

    // Restart services
    await this.startServices(env);

    return {
      status: "success",
      timestamp: new Date(),
    };
  }

  /**
   * Checks if a file exists
   * @private
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} Whether the file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets deployment history
   * @param {string} environment - Optional environment filter
   * @returns {Array} Deployment history
   */
  getDeploymentHistory(environment = null) {
    let history = this.deploymentHistory;

    if (environment) {
      history = history.filter((d) => d.environment === environment);
    }

    return history;
  }

  /**
   * Exports deployment configuration to markdown
   * @returns {string} Markdown formatted configuration
   */
  exportToMarkdown() {
    let markdown = "# N-HDR Deployment Configuration\n\n";

    // Environment Configuration
    markdown += "## Environments\n\n";
    for (const [name, env] of this.environments.entries()) {
      markdown += `### ${name}\n\n`;
      markdown += "| Setting | Value |\n|---------|-------|\n";
      for (const [key, value] of Object.entries(env)) {
        if (typeof value !== "object") {
          markdown += `| ${key} | ${value} |\n`;
        }
      }
      markdown += "\n";
    }

    // Deployment History
    markdown += "## Recent Deployments\n\n";
    markdown += "| ID | Environment | Status | Timestamp |\n";
    markdown += "|----|-------------|--------|-----------|";

    const recentDeployments = this.deploymentHistory.slice(-5).reverse();

    for (const deployment of recentDeployments) {
      markdown += `\n| ${deployment.id} | ${deployment.environment} | ${
        deployment.status
      } | ${deployment.timestamp.toISOString()} |`;
    }

    return markdown;
  }
}

module.exports = DeploymentManager;
