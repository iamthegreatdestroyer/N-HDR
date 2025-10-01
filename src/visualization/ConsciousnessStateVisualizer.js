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
 * File: ConsciousnessStateVisualizer.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import * as THREE from "three";
import * as tf from "@tensorflow/tfjs";
import ConsciousnessLayer from "../consciousness/consciousness-layer.js";
import QuantumProcessor from "../core/quantum/quantum-processor.js";
import SecurityManager from "../core/security/security-manager.js";
import KnowledgeCrystallizer from "../ohdr/KnowledgeCrystallizer.js";
import ExpertiseEngine from "../ohdr/ExpertiseEngine.js";
import CrystallineStorage from "../ohdr/CrystallineStorage.js";
import config from "../../config/nhdr-config.js";

/**
 * ConsciousnessStateVisualizer
 * Holographic-style visualization of N-HDR consciousness states
 */
class ConsciousnessStateVisualizer {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.consciousnessLayer = new ConsciousnessLayer();
    this.quantumProcessor = new QuantumProcessor();
    this.security = new SecurityManager();

    // O-HDR components
    this.crystallizer = new KnowledgeCrystallizer();
    this.expertiseEngine = new ExpertiseEngine();
    this.crystallineStorage = new CrystallineStorage();

    // O-HDR visualization layers
    this.crystalLayer = null;
    this.expertiseLayer = null;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.hologram = null;

    // State management
    this.states = new Map();
    this.activeState = null;
    this.stateTransition = null;

    this.initialize();
  }

  /**
   * Creates crystal visualization layer
   * @private
   * @param {Object} crystal - Crystal data to visualize
   */
  _createCrystalLayer(crystal) {
    const geometry = new THREE.IcosahedronGeometry(2, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    });

    this.crystalLayer = new THREE.Mesh(geometry, material);

    // Add glow effect
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.5 },
        p: { value: 2.0 },
        glowColor: { value: new THREE.Color(0x00ff88) },
        viewVector: { value: new THREE.Vector3() },
      },
      vertexShader: this._getGlowVertexShader(),
      fragmentShader: this._getGlowFragmentShader(),
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const glowMesh = new THREE.Mesh(geometry.clone(), glowMaterial);
    glowMesh.scale.multiplyScalar(1.2);
    this.crystalLayer.add(glowMesh);

    // Position based on stability
    this.crystalLayer.position.set(0, crystal.stability * 2, 0);
    this.scene.add(this.crystalLayer);
  }

  /**
   * Creates expertise visualization layer
   * @private
   * @param {Object} expertise - Expertise data to visualize
   */
  _createExpertiseLayer(expertise) {
    // Create branching network visualization
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.6,
    });

    // Create expertise pattern network
    const points = [];
    expertise.patterns.forEach((pattern, i) => {
      const theta = (i / expertise.patterns.length) * Math.PI * 2;
      const y = pattern.coherence * 3;
      const x = Math.cos(theta) * 4;
      const z = Math.sin(theta) * 4;
      points.push(new THREE.Vector3(x, y, z));
    });

    // Connect patterns that are related
    const indices = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (
          this._areExpertisePatternsRelated(
            expertise.patterns[i],
            expertise.patterns[j]
          )
        ) {
          indices.push(i, j);
        }
      }
    }

    geometry.setFromPoints(points);
    this.expertiseLayer = new THREE.LineSegments(geometry, material);
    this.scene.add(this.expertiseLayer);
  }

  /**
   * Updates crystal visualization
   * @private
   * @param {Object} crystal - Updated crystal data
   */
  _updateCrystalVisualization(crystal) {
    if (!this.crystalLayer) {
      this._createCrystalLayer(crystal);
      return;
    }

    // Update position and scale based on stability
    const scale = 1 + crystal.stability * 0.5;
    this.crystalLayer.scale.set(scale, scale, scale);
    this.crystalLayer.position.y = crystal.stability * 2;

    // Update glow intensity based on patterns
    const glow = this.crystalLayer.children[0];
    glow.material.uniforms.c.value = 0.5 + crystal.patterns.length * 0.1;
  }

  /**
   * Updates expertise visualization
   * @private
   * @param {Object} expertise - Updated expertise data
   */
  _updateExpertiseVisualization(expertise) {
    if (!this.expertiseLayer) {
      this._createExpertiseLayer(expertise);
      return;
    }

    // Update pattern positions
    const points = [];
    expertise.patterns.forEach((pattern, i) => {
      const theta = (i / expertise.patterns.length) * Math.PI * 2;
      const y = pattern.coherence * 3;
      const x = Math.cos(theta) * 4;
      const z = Math.sin(theta) * 4;
      points.push(new THREE.Vector3(x, y, z));
    });

    this.expertiseLayer.geometry.setFromPoints(points);
  }

  /**
   * Checks if two expertise patterns are related
   * @private
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {boolean} - Whether patterns are related
   */
  _areExpertisePatternsRelated(pattern1, pattern2) {
    // Calculate pattern correlation
    const correlation = tf
      .tensor1d(pattern1.features)
      .dot(tf.tensor1d(pattern2.features))
      .dataSync()[0];

    return correlation > 0.7;
  }

  /**
   * Gets the vertex shader for glow effect
   * @private
   * @returns {string} - Shader code
   */
  _getGlowVertexShader() {
    return `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
        intensity = pow(dot(normalize(viewVector), actual_normal), 6.0);
      }
    `;
  }

  /**
   * Gets the fragment shader for glow effect
   * @private
   * @returns {string} - Shader code
   */
  _getGlowFragmentShader() {
    return `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        gl_FragColor = vec4(glowColor * intensity, 1.0);
      }
    `;
  }

  /**
   * Initialize visualization system
   */
  initialize() {
    this._setupScene();
    this._setupCamera();
    this._setupRenderer();
    this._setupHologram();
    this._setupEventListeners();
    this.animate();
  }

  /**
   * Visualize consciousness state
   * @param {Object} state - Consciousness state data
   */
  visualizeState(state) {
    this._validateSecurityContext();
    this._processStateData(state);
    this._updateHologram();
  }

  /**
   * Transition between states
   * @param {string} fromStateId - Source state ID
   * @param {string} toStateId - Target state ID
   */
  transitionStates(fromStateId, toStateId) {
    const fromState = this.states.get(fromStateId);
    const toState = this.states.get(toStateId);

    if (!fromState || !toState) {
      throw new Error("Invalid state IDs for transition");
    }

    this._initializeTransition(fromState, toState);
  }

  /**
   * Setup Three.js scene
   * @private
   */
  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000022);

    // Add ambient and point lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    const pointLight = new THREE.PointLight(0x4080ff, 1, 100);
    pointLight.position.set(10, 10, 10);

    this.scene.add(ambientLight);
    this.scene.add(pointLight);
  }

  /**
   * Setup Three.js camera
   * @private
   */
  _setupCamera() {
    const aspectRatio =
      this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    this.camera.position.z = 30;
  }

  /**
   * Setup Three.js renderer
   * @private
   */
  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup holographic visualization
   * @private
   */
  _setupHologram() {
    const geometry = new THREE.SphereGeometry(10, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: this._getHologramVertexShader(),
      fragmentShader: this._getHologramFragmentShader(),
      transparent: true,
      uniforms: {
        time: { value: 0 },
        stateData: { value: new Float32Array(64 * 64) },
        intensity: { value: 1.0 },
      },
    });

    this.hologram = new THREE.Mesh(geometry, material);
    this.scene.add(this.hologram);
  }

  /**
   * Get hologram vertex shader
   * @private
   * @returns {string} Vertex shader code
   */
  _getHologramVertexShader() {
    return `
      uniform float time;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vStateValue;
      
      void main() {
        vNormal = normal;
        vUv = uv;
        vec3 newPosition = position;
        
        float displacement = sin(time * 2.0 + position.y * 4.0) * 0.3 * intensity;
        newPosition += normal * displacement;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;
  }

  /**
   * Get hologram fragment shader
   * @private
   * @returns {string} Fragment shader code
   */
  _getHologramFragmentShader() {
    return `
      uniform float time;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vStateValue;
      
      void main() {
        vec3 hologramColor = vec3(0.2, 0.4, 1.0);
        float pulse = sin(time * 3.0) * 0.5 + 0.5;
        float edge = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        
        vec3 color = hologramColor * (edge * pulse * intensity);
        float alpha = edge * 0.7 * intensity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    window.addEventListener("resize", this._onWindowResize.bind(this));
    this.container.addEventListener("mousemove", this._onMouseMove.bind(this));
  }

  /**
   * Handle window resize
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
    const rect = this.container.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
    const y =
      -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;

    // Update hologram rotation based on mouse position
    if (this.hologram) {
      this.hologram.rotation.y = (x * Math.PI) / 4;
      this.hologram.rotation.x = (y * Math.PI) / 4;
    }
  }

  /**
   * Process consciousness state data
   * @private
   * @param {Object} state - Consciousness state
   */
  _processStateData(state) {
    return tf.tidy(() => {
      const tensor = tf.tensor(state.data);
      const processed = this.quantumProcessor.processQuantumState(tensor);
      return this._tensorToVisualData(processed);
    });
  }

  /**
   * Convert tensor to visual data
   * @private
   * @param {tf.Tensor} tensor - Input tensor
   * @returns {Float32Array} Visual data array
   */
  _tensorToVisualData(tensor) {
    const data = tensor.dataSync();
    const visualData = new Float32Array(64 * 64);

    for (let i = 0; i < data.length; i++) {
      const mapped = this._mapStateValue(data[i]);
      visualData[i] = mapped;
    }

    return visualData;
  }

  /**
   * Map state value to visual range
   * @private
   * @param {number} value - Input value
   * @returns {number} Mapped value
   */
  _mapStateValue(value) {
    return (Math.tanh(value) + 1) / 2;
  }

  /**
   * Update hologram visualization
   * @private
   */
  _updateHologram() {
    if (!this.hologram || !this.activeState) return;

    const stateData = this._processStateData(this.activeState);
    this.hologram.material.uniforms.stateData.value = stateData;
    this.hologram.material.uniforms.time.value = Date.now() * 0.001;
  }

  /**
   * Initialize state transition
   * @private
   * @param {Object} fromState - Source state
   * @param {Object} toState - Target state
   */
  _initializeTransition(fromState, toState) {
    this.stateTransition = {
      from: fromState,
      to: toState,
      progress: 0,
      duration: 1000, // milliseconds
      startTime: Date.now(),
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

    if (this.stateTransition) {
      this._updateTransition();
    }

    this._updateHologram();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update state transition
   * @private
   */
  _updateTransition() {
    const elapsed = Date.now() - this.stateTransition.startTime;
    const progress = Math.min(elapsed / this.stateTransition.duration, 1);

    if (progress >= 1) {
      this.activeState = this.stateTransition.to;
      this.stateTransition = null;
    } else {
      this.activeState = this._interpolateStates(
        this.stateTransition.from,
        this.stateTransition.to,
        progress
      );
    }
  }

  /**
   * Interpolate between states
   * @private
   * @param {Object} fromState - Source state
   * @param {Object} toState - Target state
   * @param {number} progress - Transition progress
   * @returns {Object} Interpolated state
   */
  _interpolateStates(fromState, toState, progress) {
    return tf.tidy(() => {
      const fromTensor = tf.tensor(fromState.data);
      const toTensor = tf.tensor(toState.data);
      return tf
        .add(tf.mul(fromTensor, 1 - progress), tf.mul(toTensor, progress))
        .arraySync();
    });
  }
}

export default ConsciousnessStateVisualizer;
