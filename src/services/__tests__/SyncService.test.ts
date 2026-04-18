import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (available before vi.mock factory runs) ───────────────────

const { mockGetState, mockCreateClient } = vi.hoisted(() => ({
    mockGetState: vi.fn(),
    mockCreateClient: vi.fn(),
}));

vi.mock('../../store/useWorkoutStore', () => ({
    useWorkoutStore: { getState: mockGetState },
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: mockCreateClient,
}));

vi.mock('../../utils/logger', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { syncService } from '../SyncService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeState = (url = 'https://test.supabase.co', key = 'test-key') => ({
    userStats: { supabaseUrl: url, supabaseKey: key },
    history: [],
    routines: [],
    exercises: [],
    markSessionsSynced: vi.fn(),
    markRoutinesSynced: vi.fn(),
    mergeRemoteData: vi.fn(),
    updateUserStats: vi.fn(),
});

const makeMockClient = () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SyncService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (syncService as any).isSyncing = false;
        (syncService as any).client = null;
        (syncService as any).currentUrl = '';

        mockGetState.mockReturnValue(makeState());
        mockCreateClient.mockReturnValue(makeMockClient());
    });

    it('does not sync when offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        await syncService.sync();
        expect(mockCreateClient).not.toHaveBeenCalled();
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    it('does not sync when already syncing', async () => {
        (syncService as any).isSyncing = true;
        await syncService.sync();
        expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('reuses the same client instance when URL is unchanged', () => {
        mockGetState.mockReturnValue(makeState('https://same.supabase.co'));

        const client1 = (syncService as any).getClient();
        const client2 = (syncService as any).getClient();

        expect(client1).toBe(client2);
        expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('creates a new client when URL changes', () => {
        mockGetState.mockReturnValue(makeState('https://first.supabase.co'));
        (syncService as any).getClient();

        mockGetState.mockReturnValue(makeState('https://second.supabase.co'));
        (syncService as any).getClient();

        expect(mockCreateClient).toHaveBeenCalledTimes(2);
    });

    it('reset() clears client and currentUrl', () => {
        (syncService as any).client = {};
        (syncService as any).currentUrl = 'https://test.supabase.co';

        syncService.reset();

        expect((syncService as any).client).toBeNull();
        expect((syncService as any).currentUrl).toBe('');
    });

    it('returns null when no credentials are configured', () => {
        mockGetState.mockReturnValue(makeState('', ''));
        const client = (syncService as any).getClient();
        expect(client).toBeNull();
        expect(mockCreateClient).not.toHaveBeenCalled();
    });
});
