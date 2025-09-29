/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * THERMAL VIEW
 * Real-time visualization of thermal management system
 */

const BaseView = require('../base-view');
const THREE = require('three');

/**
 * @class ThermalView
 * @extends BaseView
 * @description Visualizes thermal state and management of the N-HDR system
 */
class ThermalView extends BaseView {
  /**
   * Create new ThermalView
   * @param {Object} options - View options
   */
  constructor(options = {}) {
    super({
      ...options,
      refreshRate: options.refreshRate || 500 // Faster refresh for thermal
    });

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.nanobots = new Map();
    this.heatmap = null;
  }

  /**
   * Initialize thermal visualization
   * @protected
   */
  async _initializeView() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000
    );
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Set up camera
    this.camera.position.z = 5;

    // Initialize heatmap
    this._initializeHeatmap();

    // Start animation loop
    if (this.options.animationEnabled) {
      this._animate();
    }

    // Add event listeners
    window.addEventListener('resize', this._onResize.bind(this));
  }

  /**
   * Update thermal visualization
   * @param {Map} metrics - Current metrics
   * @protected
   */
  _updateView(metrics) {
    // Update nanobot temperatures
    if (metrics.has('thermal.nanobots')) {
      const nanobotData = metrics.get('thermal.nanobots').value;
      this._updateNanobots(nanobotData);
    }

    // Update system temperature
    if (metrics.has('thermal.system')) {
      const systemTemp = metrics.get('thermal.system').value;
      this._updateSystemTemperature(systemTemp);
    }

    // Update thermal efficiency
    if (metrics.has('thermal.efficiency')) {
      const efficiency = metrics.get('thermal.efficiency').value;
      this._updateEfficiencyIndicator(efficiency);
    }

    // Update heatmap
    if (metrics.has('thermal.distribution')) {
      const distribution = metrics.get('thermal.distribution').value;
      this._updateHeatmap(distribution);
    }
  }

  /**
   * Render thermal visualization
   * @protected
   */
  async _renderContent() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Clean up thermal visualization
   * @protected
   */
  _cleanupView() {
    // Remove event listeners
    window.removeEventListener('resize', this._onResize.bind(this));

    // Dispose Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Clear nanobots
    for (const nanobot of this.nanobots.values()) {
      this._disposeNanobot(nanobot);
    }
    this.nanobots.clear();

    // Clear heatmap
    if (this.heatmap) {
      this._disposeHeatmap();
    }
  }

  /**
   * Initialize thermal heatmap
   * @private
   */
  _initializeHeatmap() {
    const geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTemperature: { value: 0 },
        uColorHot: { value: new THREE.Color(0xff0000) },
        uColorCold: { value: new THREE.Color(0x0000ff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uTemperature;
        uniform vec3 uColorHot;
        uniform vec3 uColorCold;
        varying vec2 vUv;

        void main() {
          float temp = uTemperature * (0.5 + 0.5 * sin(vUv.x * 10.0 + uTime));
          vec3 color = mix(uColorCold, uColorHot, temp);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true
    });

    this.heatmap = new THREE.Mesh(geometry, material);
    this.heatmap.position.z = -5;
    this.scene.add(this.heatmap);
  }

  /**
   * Update nanobot visualizations
   * @param {Array} nanobotData - Nanobot temperature data
   * @private
   */
  _updateNanobots(nanobotData) {
    // Update or create nanobot visualizations
    for (const data of nanobotData) {
      const { id, temperature, position } = data;

      if (!this.nanobots.has(id)) {
        // Create new nanobot visualization
        const nanobot = this._createNanobot();
        this.nanobots.set(id, nanobot);
        this.scene.add(nanobot);
      }

      // Update nanobot
      const nanobot = this.nanobots.get(id);
      this._updateNanobotTemperature(nanobot, temperature);
      this._updateNanobotPosition(nanobot, position);
    }

    // Remove obsolete nanobots
    const currentIds = new Set(nanobotData.map(d => d.id));
    for (const [id, nanobot] of this.nanobots.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(nanobot);
        this._disposeNanobot(nanobot);
        this.nanobots.delete(id);
      }
    }
  }

  /**
   * Create nanobot visualization
   * @returns {THREE.Object3D} Nanobot mesh
   * @private
   */
  _createNanobot() {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update nanobot temperature visualization
   * @param {THREE.Object3D} nanobot - Nanobot mesh
   * @param {number} temperature - Current temperature
   * @private
   */
  _updateNanobotTemperature(nanobot, temperature) {
    // Temperature color gradient (blue to red)
    const normalizedTemp = (temperature - 20) / 80; // 20°C to 100°C range
    const color = new THREE.Color();
    color.setHSL(0.7 * (1 - normalizedTemp), 1, 0.5);

    nanobot.material.color.copy(color);
    nanobot.material.emissive.copy(color);
    nanobot.material.emissiveIntensity = 0.3 + normalizedTemp * 0.7;
  }

  /**
   * Update nanobot position
   * @param {THREE.Object3D} nanobot - Nanobot mesh
   * @param {Object} position - New position
   * @private
   */
  _updateNanobotPosition(nanobot, position) {
    nanobot.position.set(position.x, position.y, position.z);
  }

  /**
   * Update system temperature visualization
   * @param {number} temperature - System temperature
   * @private
   */
  _updateSystemTemperature(temperature) {
    const normalizedTemp = temperature / 100; // 0-100°C range
    if (this.heatmap) {
      this.heatmap.material.uniforms.uTemperature.value = normalizedTemp;
    }
  }

  /**
   * Update thermal efficiency indicator
   * @param {number} efficiency - Current efficiency
   * @private
   */
  _updateEfficiencyIndicator(efficiency) {
    // Update ambient light intensity based on efficiency
    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(this.ambientLight);
    }
    this.ambientLight.intensity = 0.3 + efficiency * 0.7;
  }

  /**
   * Update thermal distribution heatmap
   * @param {Array} distribution - Thermal distribution data
   * @private
   */
  _updateHeatmap(distribution) {
    if (!this.heatmap) return;

    // Update heatmap shader uniforms
    this.heatmap.material.uniforms.uTime.value += 0.01;
    
    // Update vertex colors based on distribution
    const colors = new Float32Array(distribution.length * 3);
    for (let i = 0; i < distribution.length; i++) {
      const temp = distribution[i];
      const color = new THREE.Color();
      color.setHSL(0.7 * (1 - temp), 1, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    this.heatmap.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }

  /**
   * Handle window resize
   * @private
   */
  _onResize() {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Animation loop
   * @private
   */
  _animate() {
    if (!this.isInitialized) return;

    requestAnimationFrame(this._animate.bind(this));
    this.render();

    // Rotate heatmap slowly
    if (this.heatmap) {
      this.heatmap.rotation.z += 0.001;
    }
  }

  /**
   * Dispose nanobot resources
   * @param {THREE.Object3D} nanobot - Nanobot mesh
   * @private
   */
  _disposeNanobot(nanobot) {
    if (nanobot.geometry) nanobot.geometry.dispose();
    if (nanobot.material) nanobot.material.dispose();
  }

  /**
   * Dispose heatmap resources
   * @private
   */
  _disposeHeatmap() {
    if (this.heatmap.geometry) this.heatmap.geometry.dispose();
    if (this.heatmap.material) this.heatmap.material.dispose();
  }
}

module.exports = ThermalView;