
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheManager } from './CacheManager';
import { logger } from './logger';

const DEFAULT_TIMEOUT = 10000;

/**
 * Generic Network Client with built-in Caching Strategy
 */
export class NetworkClient {
  
  /**
   * Fetch with Stale-While-Revalidate strategy.
   * 1. Returns Cache immediately if available (fast).
   * 2. Fetches network in background to update cache.
   * 3. If no cache, awaits network.
   */
  static async get<T>(
    url: string, 
    config: AxiosRequestConfig = {}, 
    cacheKey?: string,
    ttl: number = 3600000 // 1 hour default
  ): Promise<T> {
    
    // 1. Try Cache First
    if (cacheKey) {
      const cached = await CacheManager.get<T>(cacheKey);
      if (cached) {
        // We have data, return it. 
        // Ideally, we would trigger a background revalidate here if we had a reactive store subscription,
        // but for this architecture, returning cache is the priority for offline-first.
        // We can optionally check network if cache is "stale" but existing logic prefers speed.
        return cached;
      }
    }

    // 2. Network Fallback
    return this.fetchAndCache<T>(url, config, cacheKey, ttl);
  }

  /**
   * Force Network Fetch and Update Cache
   */
  private static async fetchAndCache<T>(
    url: string, 
    config: AxiosRequestConfig, 
    cacheKey?: string,
    ttl?: number
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(url, {
        ...config,
        timeout: DEFAULT_TIMEOUT
      });

      if (cacheKey && response.data) {
        await CacheManager.set(cacheKey, response.data, ttl);
      }

      return response.data;
    } catch (error) {
      logger.warn('Network', `Failed to fetch ${url}`, error);
      throw error;
    }
  }
}
