/**
 * HDR Empire Framework - Code Splitting Utilities
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * Dynamic import utilities for lazy loading and code splitting
 */

/**
 * Lazy load module with caching
 */
class ModuleLoader {
  constructor() {
    this.moduleCache = new Map();
    this.loadingPromises = new Map();
  }
  
  /**
   * Load module dynamically with caching
   */
  async load(modulePath) {
    // Return cached module
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }
    
    // Return existing loading promise
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }
    
    // Start loading
    const loadPromise = import(modulePath)
      .then((module) => {
        this.moduleCache.set(modulePath, module);
        this.loadingPromises.delete(modulePath);
        return module;
      })
      .catch((error) => {
        this.loadingPromises.delete(modulePath);
        throw new Error(`Failed to load module ${modulePath}: ${error.message}`);
      });
    
    this.loadingPromises.set(modulePath, loadPromise);
    return loadPromise;
  }
  
  /**
   * Preload modules in background
   */
  async preload(modulePaths) {
    const promises = modulePaths.map((path) => this.load(path));
    return Promise.all(promises);
  }
  
  /**
   * Clear module cache
   */
  clearCache() {
    this.moduleCache.clear();
  }
}

/**
 * HDR System lazy loaders
 */
const moduleLoader = new ModuleLoader();

export const loadNeuralHDR = () => moduleLoader.load('../core/neural-hdr.js');
export const loadNanoSwarmHDR = () => moduleLoader.load('../core/nano-swarm/NanoSwarmManager.js');
export const loadOmniscientHDR = () => moduleLoader.load('../ohdr/OmniscientHDRSystem.js');
export const loadRealityHDR = () => moduleLoader.load('../core/reality-hdr/RealityCompressor.js');
export const loadQuantumHDR = () => moduleLoader.load('../core/quantum-hdr/QuantumStateManager.js');
export const loadDreamHDR = () => moduleLoader.load('../core/dream-hdr/DreamPatternEngine.js');
export const loadVoidBladeHDR = () => moduleLoader.load('../core/void-blade-hdr/VoidBladeSecuritySystem.js');

/**
 * Preload critical systems
 */
export async function preloadCriticalSystems() {
  return moduleLoader.preload([
    '../core/neural-hdr.js',
    '../core/void-blade-hdr/VoidBladeSecuritySystem.js'
  ]);
}

/**
 * Preload all HDR systems
 */
export async function preloadAllSystems() {
  return moduleLoader.preload([
    '../core/neural-hdr.js',
    '../core/nano-swarm/NanoSwarmManager.js',
    '../ohdr/OmniscientHDRSystem.js',
    '../core/reality-hdr/RealityCompressor.js',
    '../core/quantum-hdr/QuantumStateManager.js',
    '../core/dream-hdr/DreamPatternEngine.js',
    '../core/void-blade-hdr/VoidBladeSecuritySystem.js'
  ]);
}

export default moduleLoader;
