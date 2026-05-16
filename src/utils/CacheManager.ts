
import { get, set } from 'idb-keyval';
import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  // --- Asynchronous Persistent Cache (IDB) ---
  
  static async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await get<CacheEntry<T>>(key);
      if (!entry) return null;

      if (Date.now() - entry.timestamp > entry.ttl) {
        return null; 
      }

      return entry.data;
    } catch (e) {
      logger.warn('CacheManager', `Get error [${key}]`, e);
      return null;
    }
  }

  static async set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await set(key, entry);
    } catch (e) {
      logger.warn('CacheManager', `Set error [${key}]`, e);
    }
  }

  // --- Synchronous In-Memory Cache (Render Optimization) ---
  
  private static memoryCache = new Map<string, CacheEntry<any>>();

  static getMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  static setMemory<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Keep map size reasonable (simple LRU-ish by just clearing if too big)
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, { data, timestamp: Date.now(), ttl });
  }

  static clearMemory(): void {
    this.memoryCache.clear();
  }
}
