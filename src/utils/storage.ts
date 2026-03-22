
import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

// Custom Storage Adapter for Zustand Persist Middleware
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (e) {
      console.warn('IDB Get Error', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e) {
      console.warn('IDB Set Error', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (e) {
      console.warn('IDB Delete Error', e);
    }
  },
};
