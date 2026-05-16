
import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';
import { logger } from './logger';

// Custom Storage Adapter for Zustand Persist Middleware
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (e) {
      logger.warn('IDB', 'Get error', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e) {
      logger.warn('IDB', 'Set error', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (e) {
      logger.warn('IDB', 'Delete error', e);
    }
  },
};
