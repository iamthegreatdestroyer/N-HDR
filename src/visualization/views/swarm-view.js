/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SWARM VIEW
 * Real-time visualization of NanoBot swarm operations and behavior
 */

import BaseView from "../base-view.js";
import THREE from "three";

/**
 * @class SwarmView
 * @extends BaseView
 * @description Visualizes NanoBot swarm operations and collective behavior
 */
class SwarmView extends BaseView {
  /**
   * Create new SwarmView
   * @param {Object} options - View options
   */
  constructor(options = {}) {
    super({
      ...options,
      refreshRate: options.refreshRate || 100, // High refresh rate for swarm
    });

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.swarmField = null;
    this.nanobots = new Map();
    this.clusters = new Map();
    this.trails = new Map();
    this.taskMarkers = new Map();
  }

  /**
   * Initialize swarm visualization
   * @protected
   */
  async _initializeView() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.fog = new THREE.FogExp2(0x111111, 0.05);

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.renderer.domElement);

    // Set up camera
    this.camera.position.z = 20;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Initialize swarm elements
    await this._initializeSwarmField();

    // Start animation
    if (this.options.animationEnabled) {
      this._animate();
    }

    // Add event listeners
    window.addEventListener("resize", this._onResize.bind(this));
  }

  /**
   * Update swarm visualization
   * @param {Map} metrics - Current metrics
   * @protected
   */
  _updateView(metrics) {
    // Update NanoBot states
    if (metrics.has("swarm.nanobots")) {
      const nanobotData = metrics.get("swarm.nanobots").value;
      this._updateNanoBots(nanobotData);
    }

    // Update swarm clusters
    if (metrics.has("swarm.clusters")) {
      const clusterData = metrics.get("swarm.clusters").value;
      this._updateClusters(clusterData);
    }

    // Update task distribution
    if (metrics.has("swarm.tasks")) {
      const taskData = metrics.get("swarm.tasks").value;
      this._updateTaskMarkers(taskData);
    }

    // Update swarm field
    if (metrics.has("swarm.field")) {
      const fieldData = metrics.get("swarm.field").value;
      this._updateSwarmField(fieldData);
    }

    // Update movement trails
    if (metrics.has("swarm.movements")) {
      const movementData = metrics.get("swarm.movements").value;
      this._updateMovementTrails(movementData);
    }
  }

  /**
   * Render swarm visualization
   * @protected
   */
  async _renderContent() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Clean up swarm visualization
   * @protected
   */
  _cleanupView() {
    // Remove event listeners
    window.removeEventListener("resize", this._onResize.bind(this));

    // Dispose Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Clean up swarm field
    if (this.swarmField) {
      this._disposeSwarmField();
    }

    // Clean up nanobots
    for (const bot of this.nanobots.values()) {
      this._disposeNanoBot(bot);
    }
    this.nanobots.clear();

    // Clean up clusters
    for (const cluster of this.clusters.values()) {
      this._disposeCluster(cluster);
    }
    this.clusters.clear();

    // Clean up trails
    for (const trail of this.trails.values()) {
      this._disposeTrail(trail);
    }
    this.trails.clear();

    // Clean up task markers
    for (const marker of this.taskMarkers.values()) {
      this._disposeTaskMarker(marker);
    }
    this.taskMarkers.clear();
  }

  /**
   * Initialize swarm field
   * @private
   */
  async _initializeSwarmField() {
    // Create swarm field geometry
    const fieldGeometry = new THREE.BoxGeometry(30, 20, 30);
    const fieldMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        color: { value: new THREE.Color(0x0088ff) },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 color;
        
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          float noise = sin(vPosition.x * 0.1 + time) * 
                       cos(vPosition.y * 0.1 + time) * 
                       sin(vPosition.z * 0.1 + time);
                       
          float alpha = 0.1 * intensity * (0.5 + 0.5 * noise);
          vec3 finalColor = color * (0.5 + 0.5 * noise);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      wireframe: true,
    });

    this.swarmField = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.scene.add(this.swarmField);
  }

  /**
   * Update NanoBot visualizations
   * @param {Array} nanobotData - NanoBot state data
   * @private
   */
  _updateNanoBots(nanobotData) {
    for (const data of nanobotData) {
      if (!this.nanobots.has(data.id)) {
        // Create new NanoBot visualization
        const nanobot = this._createNanoBot(data);
        this.nanobots.set(data.id, nanobot);
        this.scene.add(nanobot);
      }

      // Update NanoBot
      const nanobot = this.nanobots.get(data.id);
      this._updateNanoBotState(nanobot, data);

      // Create movement trail
      this._createMovementTrail(data);
    }

    // Remove inactive nanobots
    const activeIds = new Set(nanobotData.map((d) => d.id));
    for (const [id, bot] of this.nanobots.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(bot);
        this._disposeNanoBot(bot);
        this.nanobots.delete(id);
      }
    }
  }

  /**
   * Create NanoBot visualization
   * @param {Object} data - NanoBot data
   * @returns {THREE.Group} NanoBot group
   * @private
   */
  _createNanoBot(data) {
    const group = new THREE.Group();

    // Create core
    const coreGeometry = new THREE.OctahedronGeometry(0.2, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Add energy field
    const fieldGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    group.add(field);

    return group;
  }

  /**
   * Update NanoBot state
   * @param {THREE.Group} nanobot - NanoBot group
   * @param {Object} data - NanoBot state data
   * @private
   */
  _updateNanoBotState(nanobot, data) {
    // Update position
    nanobot.position.set(data.position.x, data.position.y, data.position.z);

    // Update rotation based on movement
    if (data.velocity) {
      nanobot.lookAt(
        nanobot.position.x + data.velocity.x,
        nanobot.position.y + data.velocity.y,
        nanobot.position.z + data.velocity.z
      );
    }

    // Update appearance based on state
    const core = nanobot.children[0];
    const field = nanobot.children[1];

    // Core color based on task type
    const taskColor = new THREE.Color();
    taskColor.setHSL(data.taskType / 10, 1, 0.5);
    core.material.color.copy(taskColor);
    core.material.emissive.copy(taskColor);

    // Core intensity based on energy
    core.material.emissiveIntensity = 0.2 + data.energy * 0.8;

    // Field size based on activity
    const scale = 0.8 + data.activity * 0.4;
    field.scale.set(scale, scale, scale);

    // Field opacity based on shield strength
    field.material.opacity = 0.1 + data.shield * 0.2;
  }

  /**
   * Create movement trail
   * @param {Object} data - NanoBot movement data
   * @private
   */
  _createMovementTrail(data) {
    const points = data.trail || [];
    if (points.length < 2) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
    });

    const trail = new THREE.Line(geometry, material);

    // Remove old trail
    if (this.trails.has(data.id)) {
      const oldTrail = this.trails.get(data.id);
      this.scene.remove(oldTrail);
      this._disposeTrail(oldTrail);
    }

    this.trails.set(data.id, trail);
    this.scene.add(trail);

    // Fade out trail
    setTimeout(() => {
      const fadeOut = () => {
        trail.material.opacity *= 0.95;
        if (trail.material.opacity > 0.01) {
          requestAnimationFrame(fadeOut);
        } else {
          this.scene.remove(trail);
          this._disposeTrail(trail);
          this.trails.delete(data.id);
        }
      };
      fadeOut();
    }, 1000);
  }

  /**
   * Update swarm clusters
   * @param {Array} clusterData - Cluster data
   * @private
   */
  _updateClusters(clusterData) {
    for (const data of clusterData) {
      if (!this.clusters.has(data.id)) {
        // Create new cluster visualization
        const cluster = this._createCluster(data);
        this.clusters.set(data.id, cluster);
        this.scene.add(cluster);
      }

      // Update cluster
      const cluster = this.clusters.get(data.id);
      this._updateClusterState(cluster, data);
    }

    // Remove inactive clusters
    const activeIds = new Set(clusterData.map((d) => d.id));
    for (const [id, cluster] of this.clusters.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(cluster);
        this._disposeCluster(cluster);
        this.clusters.delete(id);
      }
    }
  }

  /**
   * Create cluster visualization
   * @param {Object} data - Cluster data
   * @returns {THREE.Mesh} Cluster mesh
   * @private
   */
  _createCluster(data) {
    const geometry = new THREE.DodecahedronGeometry(data.size || 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update cluster state
   * @param {THREE.Mesh} cluster - Cluster mesh
   * @param {Object} data - Cluster state data
   * @private
   */
  _updateClusterState(cluster, data) {
    // Update position
    cluster.position.set(data.center.x, data.center.y, data.center.z);

    // Update size
    const scale = data.size || 1;
    cluster.scale.set(scale, scale, scale);

    // Update appearance based on coherence
    const color = new THREE.Color();
    color.setHSL(0.3, 1, 0.5 * data.coherence);
    cluster.material.color.copy(color);
    cluster.material.opacity = 0.1 + 0.2 * data.coherence;

    // Rotate based on collective movement
    if (data.rotation) {
      cluster.rotation.x += data.rotation.x * 0.01;
      cluster.rotation.y += data.rotation.y * 0.01;
      cluster.rotation.z += data.rotation.z * 0.01;
    }
  }

  /**
   * Update task markers
   * @param {Array} taskData - Task data
   * @private
   */
  _updateTaskMarkers(taskData) {
    for (const data of taskData) {
      if (!this.taskMarkers.has(data.id)) {
        // Create new task marker
        const marker = this._createTaskMarker(data);
        this.taskMarkers.set(data.id, marker);
        this.scene.add(marker);
      }

      // Update marker
      const marker = this.taskMarkers.get(data.id);
      this._updateTaskMarkerState(marker, data);
    }

    // Remove completed tasks
    const activeIds = new Set(taskData.map((d) => d.id));
    for (const [id, marker] of this.taskMarkers.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(marker);
        this._disposeTaskMarker(marker);
        this.taskMarkers.delete(id);
      }
    }
  }

  /**
   * Create task marker visualization
   * @param {Object} data - Task data
   * @returns {THREE.Group} Task marker group
   * @private
   */
  _createTaskMarker(data) {
    const group = new THREE.Group();

    // Create marker shape based on task type
    let shape;
    switch (data.type) {
      case "processing":
        shape = new THREE.ConeGeometry(0.3, 0.6, 8);
        break;
      case "scanning":
        shape = new THREE.RingGeometry(0.2, 0.4, 8);
        break;
      case "transfer":
        shape = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        break;
      default:
        shape = new THREE.SphereGeometry(0.3, 8, 8);
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(shape, material);
    group.add(mesh);

    // Add progress ring
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  /**
   * Update task marker state
   * @param {THREE.Group} marker - Task marker group
   * @param {Object} data - Task state data
   * @private
   */
  _updateTaskMarkerState(marker, data) {
    // Update position
    marker.position.set(data.position.x, data.position.y, data.position.z);

    // Update progress ring
    const ring = marker.children[1];
    ring.scale.setScalar(1 - data.progress);

    // Update color based on priority
    const color = new THREE.Color();
    color.setHSL(0.3 * (1 - data.priority), 1, 0.5);
    marker.children.forEach((child) => {
      child.material.color.copy(color);
    });

    // Pulse based on urgency
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005 * data.urgency);
    marker.scale.setScalar(pulse);
  }

  /**
   * Update swarm field
   * @param {Object} fieldData - Field state data
   * @private
   */
  _updateSwarmField(fieldData) {
    if (!this.swarmField) return;

    // Update shader uniforms
    this.swarmField.material.uniforms.time.value += 0.01;
    this.swarmField.material.uniforms.intensity.value =
      fieldData.intensity || 1;

    // Update field color based on activity
    const color = new THREE.Color();
    color.setHSL(0.6, 1, 0.5 * fieldData.activity);
    this.swarmField.material.uniforms.color.value = color;
  }

  /**
   * Handle window resize
   * @private
   */
  _onResize() {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  }

  /**
   * Animation loop
   * @private
   */
  _animate() {
    if (!this.isInitialized) return;

    requestAnimationFrame(this._animate.bind(this));
    this.render();

    // Rotate swarm field slowly
    if (this.swarmField) {
      this.swarmField.rotation.y += 0.001;
    }

    // Update trail opacities
    for (const trail of this.trails.values()) {
      if (trail.material.opacity > 0) {
        trail.material.opacity *= 0.99;
      }
    }
  }

  /**
   * Dispose swarm field resources
   * @private
   */
  _disposeSwarmField() {
    if (this.swarmField.geometry) this.swarmField.geometry.dispose();
    if (this.swarmField.material) this.swarmField.material.dispose();
  }

  /**
   * Dispose NanoBot resources
   * @param {THREE.Group} nanobot - NanoBot group
   * @private
   */
  _disposeNanoBot(nanobot) {
    for (const child of nanobot.children) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }

  /**
   * Dispose cluster resources
   * @param {THREE.Mesh} cluster - Cluster mesh
   * @private
   */
  _disposeCluster(cluster) {
    if (cluster.geometry) cluster.geometry.dispose();
    if (cluster.material) cluster.material.dispose();
  }

  /**
   * Dispose trail resources
   * @param {THREE.Line} trail - Trail line
   * @private
   */
  _disposeTrail(trail) {
    if (trail.geometry) trail.geometry.dispose();
    if (trail.material) trail.material.dispose();
  }

  /**
   * Dispose task marker resources
   * @param {THREE.Group} marker - Task marker group
   * @private
   */
  _disposeTaskMarker(marker) {
    for (const child of marker.children) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
}

export default SwarmView;
