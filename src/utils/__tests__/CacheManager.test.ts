import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock idb-keyval before importing CacheManager
const idbStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => ({
    get: vi.fn(async (key: string) => idbStore[key]),
    set: vi.fn(async (key: string, value: unknown) => { idbStore[key] = value; }),
}));

// Also mock logger to avoid import.meta.env issues in tests
vi.mock('../logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { CacheManager } from '../CacheManager';

describe('CacheManager', () => {
    beforeEach(() => {
        // Clear store between tests
        Object.keys(idbStore).forEach(k => delete idbStore[k]);
        vi.clearAllMocks();
    });

    it('returns null for a missing key', async () => {
        const result = await CacheManager.get('nonexistent-key');
        expect(result).toBeNull();
    });

    it('returns data within TTL', async () => {
        const data = { test: 'value', count: 42 };
        await CacheManager.set('my-key', data, 60_000); // 1 minute TTL

        const result = await CacheManager.get('my-key');
        expect(result).toEqual(data);
    });

    it('returns null for expired entries', async () => {
        const data = { stale: true };
        // Set with 1ms TTL — already expired by the time we get it
        await CacheManager.set('expired-key', data, 1);

        // Manually backdate the timestamp so it appears expired
        const entry = idbStore['expired-key'] as { data: unknown; timestamp: number; ttl: number };
        entry.timestamp = Date.now() - 60_000; // 1 minute ago

        const result = await CacheManager.get('expired-key');
        expect(result).toBeNull();
    });

    it('overwrites existing cache entry on set', async () => {
        await CacheManager.set('overwrite-key', { v: 1 }, 60_000);
        await CacheManager.set('overwrite-key', { v: 2 }, 60_000);

        const result = await CacheManager.get<{ v: number }>('overwrite-key');
        expect(result?.v).toBe(2);
    });

    it('handles idb errors gracefully — returns null on get error', async () => {
        const { get } = await import('idb-keyval');
        vi.mocked(get).mockRejectedValueOnce(new Error('IDB unavailable'));

        const result = await CacheManager.get('error-key');
        expect(result).toBeNull();
    });

    it('handles idb errors gracefully — does not throw on set error', async () => {
        const { set } = await import('idb-keyval');
        vi.mocked(set).mockRejectedValueOnce(new Error('IDB write failed'));

        await expect(CacheManager.set('error-key', { data: 1 }, 60_000)).resolves.not.toThrow();
    });
});
