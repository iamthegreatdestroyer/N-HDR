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
 * File: SwarmVisualizationEngine.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import ConceptualSwarmDeployer from "../analyzer/ConceptualSwarmDeployer.js";
import QuantumProcessor from "../core/quantum/quantum-processor.js";
import SecurityManager from "../core/security/security-manager.js";
import config from "../../config/nhdr-config.js";

/**
 * SwarmVisualizationEngine
 * Real-time 3D visualization of nano-bot swarms and their activities
 */
class SwarmVisualizationEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.swarmDeployer = new ConceptualSwarmDeployer();
    this.quantumProcessor = new QuantumProcessor();
    this.security = new SecurityManager();

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.swarmParticles = null;
    this.swarmGeometry = null;

    // Swarm state
    this.swarmData = new Map();
    this.activeNanobots = [];
    this.swarmPositions = [];
    this.quantumStates = [];

    this.initialize();
  }

  /**
   * Initialize visualization engine
   */
  initialize() {
    this._setupScene();
    this._setupCamera();
    this._setupRenderer();
    this._setupControls();
    this._setupLighting();
    this._setupEventListeners();
    this.animate();
  }

  /**
   * Update swarm visualization with new data
   * @param {Object} swarmState - Current swarm state
   */
  updateSwarmState(swarmState) {
    this._validateSecurityContext();
    this._updateSwarmGeometry(swarmState);
    this._updateQuantumStates(swarmState.quantum);
    this._updateParticleSystem();
  }

  /**
   * Toggle visibility of quantum effects
   * @param {boolean} enabled - Whether to show quantum effects
   */
  toggleQuantumEffects(enabled) {
    this.showQuantumEffects = enabled;
    this._updateQuantumVisuals();
  }

  /**
   * Set visualization mode
   * @param {string} mode - Visualization mode ('3d', '2d', 'vr')
   */
  setVisualizationMode(mode) {
    this.visualizationMode = mode;
    this._reconfigureRenderer();
    this._updateCameraSettings();
  }

  /**
   * Setup Three.js scene
   * @private
   */
  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
  }

  /**
   * Setup Three.js camera
   * @private
   */
  _setupCamera() {
    const aspectRatio =
      this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    this.camera.position.z = 50;
  }

  /**
   * Setup Three.js renderer
   * @private
   */
  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup camera controls
   * @private
   */
  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
  }

  /**
   * Setup scene lighting
   * @private
   */
  _setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    window.addEventListener("resize", this._onWindowResize.bind(this));
    this.container.addEventListener("mousemove", this._onMouseMove.bind(this));
    this.container.addEventListener("click", this._onClick.bind(this));
  }

  /**
   * Handle window resize events
   * @private
   */
  _onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Handle mouse movement
   * @private
   * @param {Event} event - Mouse event
   */
  _onMouseMove(event) {
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
    }

    const rect = this.container.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
    const y =
      -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera({ x, y }, this.camera);
    this._checkIntersections();
  }

  /**
   * Handle click events
   * @private
   * @param {Event} event - Click event
   */
  _onClick(event) {
    const intersects = this._getIntersections(event);
    if (intersects.length > 0) {
      this._handleParticleClick(intersects[0]);
    }
  }

  /**
   * Update swarm geometry
   * @private
   * @param {Object} swarmState - Current swarm state
   */
  _updateSwarmGeometry(swarmState) {
    if (!this.swarmGeometry) {
      this.swarmGeometry = new THREE.BufferGeometry();
    }

    const positions = new Float32Array(swarmState.positions.flat());
    this.swarmGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    if (!this.swarmParticles) {
      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      this.swarmParticles = new THREE.Points(this.swarmGeometry, material);
      this.scene.add(this.swarmParticles);
    }
  }

  /**
   * Update quantum state visualizations
   * @private
   * @param {Object} quantumState - Quantum state data
   */
  _updateQuantumStates(quantumState) {
    if (!this.showQuantumEffects) return;

    this.quantumStates = quantumState;
    const colors = new Float32Array(quantumState.length * 3);

    quantumState.forEach((state, index) => {
      const color = this._calculateQuantumColor(state);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });

    this.swarmGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
  }

  /**
   * Calculate particle color based on quantum state
   * @private
   * @param {Array} state - Quantum state vector
   * @returns {Object} RGB color values
   */
  _calculateQuantumColor(state) {
    const magnitude = Math.sqrt(state.reduce((sum, val) => sum + val * val, 0));
    const phase = Math.atan2(state[1], state[0]);

    return {
      r: 0.5 + 0.5 * Math.cos(phase),
      g: magnitude,
      b: 0.5 + 0.5 * Math.sin(phase),
    };
  }

  /**
   * Validate security context
   * @private
   * @throws {Error} If security validation fails
   */
  _validateSecurityContext() {
    const securityToken = this.security.getVisualizationToken();
    if (!securityToken || !this.security.validateToken(securityToken)) {
      throw new Error("Invalid security context for visualization");
    }
  }

  /**
   * Animation loop
   * @private
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this._updateParticleSystem();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update particle system
   * @private
   */
  _updateParticleSystem() {
    if (!this.swarmParticles) return;

    const time = Date.now() * 0.001;
    this.swarmParticles.rotation.y = time * 0.1;

    if (this.showQuantumEffects) {
      this._updateQuantumEffects(time);
    }
  }

  /**
   * Update quantum visual effects
   * @private
   * @param {number} time - Current time
   */
  _updateQuantumEffects(time) {
    const positions = this.swarmGeometry.attributes.position.array;
    const colors = this.swarmGeometry.attributes.color.array;

    for (let i = 0; i < positions.length; i += 3) {
      const quantum = this.quantumStates[Math.floor(i / 3)] || [0, 0, 0];
      const phase = time + quantum[0];

      positions[i + 1] += Math.sin(phase) * 0.1;

      colors[i] = 0.5 + 0.5 * Math.sin(phase + quantum[0]);
      colors[i + 1] = 0.5 + 0.5 * Math.sin(phase + quantum[1]);
      colors[i + 2] = 0.5 + 0.5 * Math.sin(phase + quantum[2]);
    }

    this.swarmGeometry.attributes.position.needsUpdate = true;
    this.swarmGeometry.attributes.color.needsUpdate = true;
  }
}

export default SwarmVisualizationEngine;
