/*
Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
© 2025 Stephen Bilodeau - PATENT PENDING
ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL

This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
technology suite. Unauthorized reproduction, distribution, or disclosure of this
software in whole or in part is strictly prohibited. All intellectual property
rights, including patent-pending technologies, are reserved.

File: visualization-engine.js
Created: 2025-09-29
HDR Empire - Pioneering the Future of AI Consciousness
*/

import * as THREE from "three";
import * as tf from "@tensorflow/tfjs";
import config from "../../config/nhdr-config";

/**
 * 3D Visualization Engine for N-HDR consciousness states
 * Renders the quantum and consciousness layers in an interactive 3D environment
 */
class VisualizationEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.layers = new Map();
    this.raycaster = null;
    this.mouse = null;
    this.clock = null;
    this.stats = null;
    this.gui = null;
    this.initialized = false;
    this.dimensions = { width: 0, height: 0 };
    this.selectedLayer = null;
    this.dataPoints = [];
    this.colorSchemes = {
      base: 0x3498db,
      timeline: 0xe74c3c,
      context: 0x2ecc71,
      reasoning: 0xf39c12,
      emotional: 0x9b59b6,
      quantum: 0x1abc9c,
    };
  }

  /**
   * Initializes the 3D visualization engine
   * @returns {Promise<boolean>} - Success indicator
   */
  async initialize() {
    console.log("Initializing visualization engine...");

    try {
      // Get container element
      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(`Container element ${this.containerId} not found`);
      }

      // Set dimensions
      this.dimensions.width = container.clientWidth;
      this.dimensions.height = container.clientHeight;

      // Initialize components
      this._initScene();
      this._initCamera();
      this._initRenderer();
      this._initControls();
      this._initLighting();
      this._initHelpers();
      this._initEvents();

      // Create base elements
      await this._createBaseElements();

      // Start animation loop
      this._animate();

      this.initialized = true;
      console.log("Visualization engine initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize visualization engine:", error);
      return false;
    }
  }

  /**
   * Visualizes a consciousness state
   * @param {Object} nhdrFile - N-HDR file to visualize
   * @returns {Promise<boolean>} - Success indicator
   */
  async visualizeConsciousness(nhdrFile) {
    if (!this.initialized) {
      throw new Error("Visualization engine not initialized");
    }

    console.log("Visualizing consciousness...");
    try {
      // Clear existing visualization
      this._clearVisualization();

      // Process consciousness layers
      for (let i = 0; i < nhdrFile.layers.length; i++) {
        await this._visualizeLayer(nhdrFile.layers[i], i);
      }

      // Create layer connections
      this._createLayerConnections();

      return true;
    } catch (error) {
      console.error("Failed to visualize consciousness:", error);
      return false;
    }
  }

  /**
   * Updates the visualization with real-time data
   * @param {Object} data - Real-time data update
   * @returns {Promise<boolean>} - Success indicator
   */
  async updateVisualization(data) {
    if (!this.initialized) {
      throw new Error("Visualization engine not initialized");
    }

    try {
      // Update each layer
      for (const [index, layer] of this.layers) {
        if (data.layers[index]) {
          this._updateLayerVisualization(layer, data.layers[index]);
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to update visualization:", error);
      return false;
    }
  }

  /**
   * Exports the current visualization as an image
   * @returns {string} - Data URL of the image
   */
  exportImage() {
    if (!this.initialized || !this.renderer) {
      throw new Error("Visualization engine not initialized");
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Convert to image
    return this.renderer.domElement.toDataURL("image/png");
  }

  /**
   * Resizes the visualization
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (!this.initialized) return;

    // Update dimensions
    this.dimensions.width = width;
    this.dimensions.height = height;

    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);
  }

  /**
   * Destroys the visualization engine and frees resources
   */
  destroy() {
    if (!this.initialized) return;

    // Stop animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Clear scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.scene = null;

    // Remove renderer
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.renderer = null;

    // Clear other references
    this.camera = null;
    this.controls = null;
    this.raycaster = null;
    this.mouse = null;
    this.clock = null;
    this.stats = null;
    if (this.gui) this.gui.destroy();
    this.gui = null;

    this.initialized = false;
    console.log("Visualization engine destroyed");
  }

  // PRIVATE METHODS

  /**
   * Initializes Three.js scene
   * @private
   */
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121212);
    this.scene.fog = new THREE.FogExp2(0x121212, 0.002);
  }

  /**
   * Initializes Three.js camera
   * @private
   */
  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV
      this.dimensions.width / this.dimensions.height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Initializes Three.js renderer
   * @private
   */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.dimensions.width, this.dimensions.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add to DOM
    const container = document.getElementById(this.containerId);
    container.appendChild(this.renderer.domElement);
  }

  /**
   * Initializes camera controls
   * @private
   */
  _initControls() {
    // In a real implementation, this would use OrbitControls
    // For simplicity, we'll simulate it
    this.controls = {
      update: () => {
        // Simulate controls update
        const time = Date.now() * 0.001;
        const radius = 20;
        this.camera.position.x = Math.sin(time * 0.1) * radius;
        this.camera.position.z = Math.cos(time * 0.1) * radius;
        this.camera.lookAt(0, 0, 0);
      },
    };
  }

  /**
   * Initializes scene lighting
   * @private
   */
  _initLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    // Directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(1, 1, 1);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 500;
    this.scene.add(directional);

    // Point lights for each layer
    const colors = Object.values(this.colorSchemes);
    for (let i = 0; i < colors.length; i++) {
      const light = new THREE.PointLight(colors[i], 0.5, 10);
      light.position.set(
        Math.cos((i * Math.PI * 2) / colors.length) * 5,
        5,
        Math.sin((i * Math.PI * 2) / colors.length) * 5
      );
      this.scene.add(light);
    }
  }

  /**
   * Initializes helper objects
   * @private
   */
  _initHelpers() {
    // Grid helper
    const grid = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
    this.scene.add(grid);

    // Axes helper
    const axes = new THREE.AxesHelper(5);
    this.scene.add(axes);

    // Raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Clock for animation
    this.clock = new THREE.Clock();
  }

  /**
   * Initializes event listeners
   * @private
   */
  _initEvents() {
    // Get container element
    const container = document.getElementById(this.containerId);

    // Add event listeners
    container.addEventListener("mousedown", this._onMouseDown.bind(this));
    container.addEventListener("mousemove", this._onMouseMove.bind(this));
    container.addEventListener("mouseup", this._onMouseUp.bind(this));
    container.addEventListener("wheel", this._onMouseWheel.bind(this));
    window.addEventListener("resize", this._onWindowResize.bind(this));
  }

  /**
   * Creates base elements for the visualization
   * @private
   */
  async _createBaseElements() {
    // Create coordinate system
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Create base platform
    const platform = new THREE.Mesh(
      new THREE.CircleGeometry(20, 64),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.5,
        side: THREE.DoubleSide,
      })
    );
    platform.position.y = -0.25;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Create layer placeholders
    for (let i = 0; i < config.consciousness.layers.length; i++) {
      const layer = config.consciousness.layers[i];
      const angle = (i / config.consciousness.layers.length) * Math.PI * 2;
      const radius = 10;

      // Create sphere for layer
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: this._getLayerColor(layer.name),
        metalness: 0.3,
        roughness: 0.7,
        transparent: true,
        opacity: 0.8,
      });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.cos(angle) * radius,
        5,
        Math.sin(angle) * radius
      );
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      this.scene.add(sphere);

      // Create label
      const label = this._createTextLabel(
        layer.name,
        this._getLayerColor(layer.name)
      );
      label.position.copy(sphere.position);
      label.position.y += 2;
      this.scene.add(label);

      // Store layer information
      this.layers.set(i, {
        config: layer,
        sphere,
        label,
        data: null,
      });
    }

    // Create center node
    const centerNode = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x666666,
        emissiveIntensity: 0.5,
      })
    );
    centerNode.position.set(0, 5, 0);
    centerNode.castShadow = true;
    centerNode.receiveShadow = true;
    this.scene.add(centerNode);

    // Store center node
    this.centerNode = centerNode;
  }

  /**
   * Animation loop
   * @private
   */
  _animate() {
    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));

    // Update controls
    if (this.controls) this.controls.update();

    // Update stats if present
    if (this.stats) this.stats.update();

    // Update animations
    this._updateAnimations();

    // Render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Updates animations for the visualization
   * @private
   */
  _updateAnimations() {
    const time = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;

    // Rotate center node
    if (this.centerNode) {
      this.centerNode.rotation.x = time * 0.5;
      this.centerNode.rotation.y = time * 0.3;
    }

    // Pulse layer spheres
    this.layers.forEach((layer, i) => {
      const offset = i * Math.PI * 0.5;
      const scale = 1 + Math.sin(time * 2 + offset) * 0.1;
      layer.sphere.scale.set(scale, scale, scale);
    });

    // Animate data points
    this.dataPoints.forEach((point, i) => {
      if (point.mesh) {
        const offset = i * Math.PI * 0.2;
        point.mesh.position.y += Math.sin(time * 3 + offset) * 0.01;
      }
    });
  }

  /**
   * Creates a text label using a sprite
   * @param {string} text - Label text
   * @param {number} color - Label color
   * @returns {THREE.Sprite} - Text sprite
   * @private
   */
  _createTextLabel(text, color) {
    // In a real implementation, this would create a text sprite
    // For simplicity, we'll create a simple sprite

    const spriteMaterial = new THREE.SpriteMaterial({
      color: color || 0xffffff,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);

    // Store text
    sprite.userData.text = text;

    return sprite;
  }

  /**
   * Gets color for a consciousness layer
   * @param {string} layerName - Layer name
   * @returns {number} - Color hex code
   * @private
   */
  _getLayerColor(layerName) {
    // Map layer name to color scheme
    const layerType = layerName.toLowerCase();

    if (layerType.includes("base") || layerType.includes("knowledge")) {
      return this.colorSchemes.base;
    } else if (
      layerType.includes("timeline") ||
      layerType.includes("conversation")
    ) {
      return this.colorSchemes.timeline;
    } else if (
      layerType.includes("context") ||
      layerType.includes("relationship")
    ) {
      return this.colorSchemes.context;
    } else if (
      layerType.includes("reasoning") ||
      layerType.includes("pathways")
    ) {
      return this.colorSchemes.reasoning;
    } else if (
      layerType.includes("emotion") ||
      layerType.includes("resonance")
    ) {
      return this.colorSchemes.emotional;
    } else if (
      layerType.includes("quantum") ||
      layerType.includes("entangled")
    ) {
      return this.colorSchemes.quantum;
    }

    // Default color
    return 0xffffff;
  }

  /**
   * Visualizes a consciousness layer
   * @param {Object} layer - Layer data
   * @param {number} index - Layer index
   * @private
   */
  async _visualizeLayer(layer, index) {
    // Get layer object
    const layerObj = this.layers.get(index);
    if (!layerObj) {
      console.warn(`Layer ${index} not found in visualization`);
      return;
    }

    // Store layer data
    layerObj.data = layer;

    // Update sphere based on layer data
    const complexity = this._calculateLayerComplexity(layer);

    // Scale sphere based on complexity
    layerObj.sphere.scale.set(complexity, complexity, complexity);

    // Create data points for the layer
    await this._createDataPoints(layer, index);
  }

  /**
   * Creates data points for visualizing layer data
   * @param {Object} layer - Layer data
   * @param {number} layerIndex - Layer index
   * @private
   */
  async _createDataPoints(layer, layerIndex) {
    // Get layer object
    const layerObj = this.layers.get(layerIndex);
    if (!layerObj) return;

    // Get layer config
    const layerConfig = config.consciousness.layers[layerIndex];
    if (!layerConfig) return;

    // Get layer color
    const layerColor = this._getLayerColor(layerConfig.name);

    // Extract data points
    const data = await this._extractDataPoints(layer);

    // Create visual elements for each data point
    data.forEach((point, i) => {
      // Create geometry
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);

      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: layerColor,
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.8,
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);

      // Position relative to layer
      const angle = (i / data.length) * Math.PI * 2;
      const radius = 2;
      mesh.position.set(
        layerObj.sphere.position.x + Math.cos(angle) * radius,
        layerObj.sphere.position.y + (Math.random() - 0.5) * 2,
        layerObj.sphere.position.z + Math.sin(angle) * radius
      );

      // Add to scene
      this.scene.add(mesh);

      // Store data point
      this.dataPoints.push({
        mesh,
        data: point,
        layer: layerIndex,
      });
    });
  }

  /**
   * Creates connections between layers
   * @private
   */
  _createLayerConnections() {
    // Create connections from center to each layer
    this.layers.forEach((layer, index) => {
      // Calculate positions
      const centerPosition = this.centerNode.position;
      const layerPosition = new THREE.Vector3();
      layer.sphere.getWorldPosition(layerPosition);

      // Create connection line
      const points = [centerPosition, layerPosition];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Create line material
      const material = new THREE.LineBasicMaterial({
        color: this._getLayerColor(layer.config.name),
        linewidth: 1,
        transparent: true,
        opacity: 0.6,
      });

      // Create line
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      // Store line reference
      layer.connection = line;
    });

    // Create cross-connections between related layers
    const layerPairs = [
      [0, 1], // Base -> Timeline
      [1, 2], // Timeline -> Context
      [2, 3], // Context -> Reasoning
      [3, 4], // Reasoning -> Emotional
      [4, 5], // Emotional -> Quantum
    ];

    layerPairs.forEach(([i, j]) => {
      const layer1 = this.layers.get(i);
      const layer2 = this.layers.get(j);
      if (!layer1 || !layer2) return;

      // Get positions
      const pos1 = new THREE.Vector3();
      const pos2 = new THREE.Vector3();
      layer1.sphere.getWorldPosition(pos1);
      layer2.sphere.getWorldPosition(pos2);

      // Create connection
      const points = [pos1, pos2];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    });
  }

  /**
   * Calculates the complexity of a layer based on its data
   * @param {Object} layer - Layer data
   * @returns {number} - Complexity factor (1.0 - 2.0)
   * @private
   */
  _calculateLayerComplexity(layer) {
    // In a real implementation, this would analyze the layer data
    // For now, return a random value
    return 1.0 + Math.random();
  }

  /**
   * Updates a layer visualization with new data
   * @param {Object} layer - Layer object
   * @param {Object} updateData - Update data
   * @private
   */
  _updateLayerVisualization(layer, updateData) {
    // Update layer data
    layer.data = { ...layer.data, ...updateData };

    // Get new complexity
    const complexity = this._calculateLayerComplexity(layer.data);

    // Update sphere scale
    layer.sphere.scale.set(complexity, complexity, complexity);

    // Update data points
    // In a real implementation, this would update or create new data points
  }

  /**
   * Extracts data points from layer data
   * @param {Object} layer - Layer data
   * @returns {Array} - Array of data points
   * @private
   */
  async _extractDataPoints(layer) {
    // In a real implementation, this would analyze the layer data
    // and extract meaningful data points
    const pointCount = 5 + Math.floor(Math.random() * 10);
    return Array(pointCount)
      .fill(null)
      .map(() => ({
        value: Math.random(),
        type: "data",
      }));
  }

  /**
   * Clears the current visualization
   * @private
   */
  _clearVisualization() {
    // Remove data points
    this.dataPoints.forEach((point) => {
      if (point.mesh && point.mesh.parent) {
        point.mesh.parent.remove(point.mesh);
        point.mesh.geometry.dispose();
        point.mesh.material.dispose();
        point.mesh = null;
      }
    });

    this.dataPoints = [];

    // Reset layers
    this.layers.forEach((layer) => {
      // Reset sphere scale
      layer.sphere.scale.set(1, 1, 1);

      // Remove connection line
      if (layer.connection && layer.connection.parent) {
        layer.connection.parent.remove(layer.connection);
        layer.connection.geometry.dispose();
        layer.connection.material.dispose();
        layer.connection = null;
      }

      // Clear data
      layer.data = null;
    });
  }

  /**
   * Handles mouse down event
   * @param {Event} event - Mouse event
   * @private
   */
  _onMouseDown(event) {
    // Update mouse position
    const rect = event.target.getBoundingClientRect();
    this.mouse.x =
      ((event.clientX - rect.left) / this.dimensions.width) * 2 - 1;
    this.mouse.y =
      -((event.clientY - rect.top) / this.dimensions.height) * 2 + 1;

    // Perform raycasting for selection
    this._performRaycasting();
  }

  /**
   * Handles mouse move event
   * @param {Event} event - Mouse event
   * @private
   */
  _onMouseMove(event) {
    // Update mouse position
    if (!this.mouse) return;

    const rect = event.target.getBoundingClientRect();
    this.mouse.x =
      ((event.clientX - rect.left) / this.dimensions.width) * 2 - 1;
    this.mouse.y =
      -((event.clientY - rect.top) / this.dimensions.height) * 2 + 1;

    // Perform raycasting for hover effects
    this._performRaycasting();
  }

  /**
   * Handles mouse up event
   * @param {Event} event - Mouse event
   * @private
   */
  _onMouseUp(event) {
    // Handle deselection
    // In a real implementation, this would handle dragging completion, etc.
  }

  /**
   * Handles mouse wheel event
   * @param {Event} event - Mouse event
   * @private
   */
  _onMouseWheel(event) {
    // Handle camera zoom
    if (!this.camera) return;

    const zoomSpeed = 0.1;
    const minDistance = 5;
    const maxDistance = 50;

    // Get camera direction vector
    const direction = new THREE.Vector3(0, 0, 0)
      .subVectors(this.camera.position, new THREE.Vector3(0, 5, 0))
      .normalize();

    // Calculate new distance
    const distance = this.camera.position.distanceTo(
      new THREE.Vector3(0, 5, 0)
    );
    const delta = event.deltaY * zoomSpeed;
    const newDistance = Math.max(
      minDistance,
      Math.min(maxDistance, distance + delta)
    );

    // Update camera position
    this.camera.position.copy(
      direction.multiplyScalar(newDistance).add(new THREE.Vector3(0, 5, 0))
    );
  }

  /**
   * Handles window resize event
   * @private
   */
  _onWindowResize() {
    // Get container element
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Update dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update visualization
    this.resize(width, height);
  }

  /**
   * Performs raycasting for interaction
   * @private
   */
  _performRaycasting() {
    if (!this.raycaster || !this.mouse || !this.camera || !this.scene) return;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Find intersections with layer spheres and data points
    const layerObjects = Array.from(this.layers.values()).map(
      (layer) => layer.sphere
    );
    const dataObjects = this.dataPoints
      .map((point) => point.mesh)
      .filter(Boolean);
    const intersects = this.raycaster.intersectObjects([
      ...layerObjects,
      ...dataObjects,
    ]);

    // Reset highlighting
    this.layers.forEach((layer) => {
      layer.sphere.material.emissive.setHex(0);
    });
    this.dataPoints.forEach((point) => {
      if (point.mesh) point.mesh.material.emissive.setHex(0);
    });

    // Highlight intersected object
    if (intersects.length > 0) {
      const object = intersects[0].object;

      // Handle layer sphere intersection
      const layerEntry = Array.from(this.layers.entries()).find(
        ([_, layer]) => layer.sphere === object
      );

      if (layerEntry) {
        const [index, layer] = layerEntry;
        layer.sphere.material.emissive.setHex(0x333333);
        this.selectedLayer = index;
      }

      // Handle data point intersection
      const dataPoint = this.dataPoints.find((point) => point.mesh === object);
      if (dataPoint) {
        dataPoint.mesh.material.emissive.setHex(0x333333);
      }
    } else {
      this.selectedLayer = null;
    }
  }
}

export default VisualizationEngine;
