
import { get, set } from 'idb-keyval';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  /**
   * Retrieve data from cache
   * @param key Storage key
   * @returns Data or null if missing/expired
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await get<CacheEntry<T>>(key);
      if (!entry) return null;

      // Check Expiry
      if (Date.now() - entry.timestamp > entry.ttl) {
        // We don't strictly need to delete it here, it will be overwritten on next fetch
        // or we could implement a cleanup strategy later.
        return null; 
      }

      return entry.data;
    } catch (e) {
      console.warn(`CacheManager Get Error [${key}]`, e);
      return null;
    }
  }

  /**
   * Save data to cache
   * @param key Storage key
   * @param data Data to store
   * @param ttl Time to live in ms (default 24h)
   */
  static async set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await set(key, entry);
    } catch (e) {
      console.warn(`CacheManager Set Error [${key}]`, e);
    }
  }
}
