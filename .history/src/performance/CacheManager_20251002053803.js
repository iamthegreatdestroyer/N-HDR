/**
 * HDR Empire Framework - Advanced Cache Manager
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * Multi-tier caching system with LRU, TTL, and intelligent invalidation
 */

import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

/**
 * Multi-tier cache manager with in-memory (L1) and Redis (L2) caching
 */
class CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // L1 Cache (in-memory) options
      l1MaxSize: options.l1MaxSize || 1000,
      l1TTL: options.l1TTL || 60 * 1000, // 1 minute
      
      // L2 Cache (Redis) options
      l2Enabled: options.l2Enabled !== false,
      l2TTL: options.l2TTL || 3600, // 1 hour
      redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      
      // Cache strategy
      strategy: options.strategy || 'write-through', // 'write-through' | 'write-behind' | 'write-around'
      compressionEnabled: options.compressionEnabled || false,
      compressionThreshold: options.compressionThreshold || 1024, // bytes
      
      // Monitoring
      metricsEnabled: options.metricsEnabled !== false,
      ...options
    };
    
    // Initialize L1 cache (in-memory)
    this.l1Cache = new LRUCache({
      max: this.options.l1MaxSize,
      ttl: this.options.l1TTL,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      dispose: (value, key) => {
        this.emit('l1:evict', { key, value });
      }
    });
    
    // Initialize L2 cache (Redis)
    if (this.options.l2Enabled) {
      this.l2Cache = new Redis(this.options.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3
      });
      
      this.l2Cache.on('error', (err) => {
        this.emit('l2:error', err);
        console.error('Redis error:', err);
      });
      
      this.l2Cache.on('connect', () => {
        this.emit('l2:connect');
      });
    }
    
    // Metrics
    this.metrics = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      overall: { hits: 0, misses: 0 }
    };
    
    // Setup metric reporting
    if (this.options.metricsEnabled) {
      this.metricsInterval = setInterval(() => {
        this.emit('metrics', this.getMetrics());
      }, 30000); // Every 30 seconds
    }
  }
  
  /**
   * Get value from cache (checks L1 first, then L2)
   */
  async get(key) {
    const cacheKey = this._getCacheKey(key);
    
    // Try L1 cache first
    const l1Value = this.l1Cache.get(cacheKey);
    if (l1Value !== undefined) {
      this.metrics.l1.hits++;
      this.metrics.overall.hits++;
      this.emit('hit', { level: 'L1', key });
      return this._deserialize(l1Value);
    }
    
    this.metrics.l1.misses++;
    
    // Try L2 cache (Redis)
    if (this.options.l2Enabled) {
      try {
        const l2Value = await this.l2Cache.get(cacheKey);
        if (l2Value !== null) {
          this.metrics.l2.hits++;
          this.metrics.overall.hits++;
          this.emit('hit', { level: 'L2', key });
          
          // Promote to L1 cache
          const deserialized = this._deserialize(l2Value);
          this.l1Cache.set(cacheKey, l2Value);
          
          return deserialized;
        }
        this.metrics.l2.misses++;
      } catch (error) {
        this.emit('error', { operation: 'get', key, error });
      }
    }
    
    this.metrics.overall.misses++;
    this.emit('miss', { key });
    return null;
  }
  
  /**
   * Set value in cache (writes to both L1 and L2)
   */
  async set(key, value, ttl = null) {
    const cacheKey = this._getCacheKey(key);
    const serialized = this._serialize(value);
    
    // Write to L1 cache
    this.l1Cache.set(cacheKey, serialized);
    this.metrics.l1.sets++;
    
    // Write to L2 cache based on strategy
    if (this.options.l2Enabled) {
      const effectiveTTL = ttl || this.options.l2TTL;
      
      try {
        if (this.options.strategy === 'write-through') {
          // Synchronous write to L2
          await this.l2Cache.setex(cacheKey, effectiveTTL, serialized);
          this.metrics.l2.sets++;
        } else if (this.options.strategy === 'write-behind') {
          // Asynchronous write to L2
          this.l2Cache.setex(cacheKey, effectiveTTL, serialized).catch((err) => {
            this.emit('error', { operation: 'set', key, error: err });
          });
          this.metrics.l2.sets++;
        }
        // 'write-around' skips L2 cache entirely
      } catch (error) {
        this.emit('error', { operation: 'set', key, error });
      }
    }
    
    this.emit('set', { key, size: serialized.length });
    return true;
  }
  
  /**
   * Delete key from both caches
   */
  async delete(key) {
    const cacheKey = this._getCacheKey(key);
    
    // Delete from L1
    const l1Deleted = this.l1Cache.delete(cacheKey);
    if (l1Deleted) {
      this.metrics.l1.deletes++;
    }
    
    // Delete from L2
    if (this.options.l2Enabled) {
      try {
        const l2Deleted = await this.l2Cache.del(cacheKey);
        if (l2Deleted > 0) {
          this.metrics.l2.deletes++;
        }
      } catch (error) {
        this.emit('error', { operation: 'delete', key, error });
      }
    }
    
    this.emit('delete', { key });
    return true;
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern) {
    const regex = this._patternToRegex(pattern);
    let count = 0;
    
    // Invalidate L1
    for (const key of this.l1Cache.keys()) {
      if (regex.test(key)) {
        this.l1Cache.delete(key);
        count++;
      }
    }
    
    // Invalidate L2
    if (this.options.l2Enabled) {
      try {
        const keys = await this.l2Cache.keys(pattern);
        if (keys.length > 0) {
          await this.l2Cache.del(...keys);
          count += keys.length;
        }
      } catch (error) {
        this.emit('error', { operation: 'invalidate', pattern, error });
      }
    }
    
    this.emit('invalidate', { pattern, count });
    return count;
  }
  
  /**
   * Clear all caches
   */
  async clear() {
    this.l1Cache.clear();
    
    if (this.options.l2Enabled) {
      try {
        await this.l2Cache.flushdb();
      } catch (error) {
        this.emit('error', { operation: 'clear', error });
      }
    }
    
    this.emit('clear');
  }
  
  /**
   * Get cache statistics
   */
  getMetrics() {
    const l1HitRate = this.metrics.l1.hits / (this.metrics.l1.hits + this.metrics.l1.misses) || 0;
    const l2HitRate = this.metrics.l2.hits / (this.metrics.l2.hits + this.metrics.l2.misses) || 0;
    const overallHitRate = this.metrics.overall.hits / (this.metrics.overall.hits + this.metrics.overall.misses) || 0;
    
    return {
      l1: {
        ...this.metrics.l1,
        hitRate: l1HitRate,
        size: this.l1Cache.size,
        maxSize: this.options.l1MaxSize
      },
      l2: {
        ...this.metrics.l2,
        hitRate: l2HitRate,
        enabled: this.options.l2Enabled
      },
      overall: {
        ...this.metrics.overall,
        hitRate: overallHitRate
      }
    };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      overall: { hits: 0, misses: 0 }
    };
  }
  
  /**
   * Warmup cache with frequently accessed data
   */
  async warmup(dataProvider) {
    const data = await dataProvider();
    
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
    
    this.emit('warmup', { count: Object.keys(data).length });
  }
  
  /**
   * Generate cache key with namespace
   */
  _getCacheKey(key) {
    if (typeof key === 'object') {
      key = JSON.stringify(key);
    }
    
    const namespace = this.options.namespace || 'hdr';
    return `${namespace}:${key}`;
  }
  
  /**
   * Serialize value for storage
   */
  _serialize(value) {
    const json = JSON.stringify(value);
    
    // Compress if enabled and exceeds threshold
    if (this.options.compressionEnabled && json.length > this.options.compressionThreshold) {
      // In production, use zlib compression
      return `compressed:${json}`; // Placeholder
    }
    
    return json;
  }
  
  /**
   * Deserialize value from storage
   */
  _deserialize(value) {
    if (typeof value === 'string' && value.startsWith('compressed:')) {
      // In production, decompress with zlib
      value = value.substring(11); // Remove prefix
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  
  /**
   * Convert wildcard pattern to regex
   */
  _patternToRegex(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regex}$`);
  }
  
  /**
   * Cleanup resources
   */
  async destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.l2Cache) {
      await this.l2Cache.quit();
    }
    
    this.l1Cache.clear();
    this.removeAllListeners();
  }
}

export default CacheManager;
