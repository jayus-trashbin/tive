
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { CacheManager } from './CacheManager';
import { logger } from './logger';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;

// Configure axios robust retry logic (D-04)
axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as any;
    if (!config) return Promise.reject(error);

    // Initialize retry counter
    config._retryCount = config._retryCount || 0;

    // Check if we should retry: network error, 5xx server errors, or 429 Rate Limit
    const shouldRetry =
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600) ||
        error.response.status === 429;

    if (shouldRetry && config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        
        // Exponential backoff: 1s, 2s, 4s (plus jitter)
        let delayMs = Math.pow(2, config._retryCount - 1) * 1000;
        
        // If it's a 429, respect Retry-After header if present
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            if (retryAfter) {
                delayMs = parseInt(retryAfter, 10) * 1000 || delayMs;
            }
            logger.warn('Network', `Rate limited (429). Retrying in ${delayMs}ms... (Attempt ${config._retryCount}/${MAX_RETRIES})`);
        } else {
            // Add jitter for non-rate-limit retries
            delayMs += Math.random() * 500;
            logger.warn('Network', `Request failed. Retrying in ${Math.round(delayMs)}ms... (Attempt ${config._retryCount}/${MAX_RETRIES})`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
        return axios(config);
    }

    return Promise.reject(error);
});

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
    
    // 1. Try Cache First (D-02: Stale-While-Revalidate)
    if (cacheKey) {
      const cached = await CacheManager.get<T>(cacheKey);
      if (cached) {
        // Trigger background revalidation (fire and forget)
        this.fetchAndCache<T>(url, config, cacheKey, ttl).catch(err => {
            logger.warn('Network', `SWR background fetch failed for ${cacheKey}`, err.message);
        });
        
        // Return cached instantly
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
