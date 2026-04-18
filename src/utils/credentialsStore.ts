/**
 * credentialsStore — Separate storage for sensitive API credentials.
 *
 * Credentials are kept in localStorage (separate from the main IDB store)
 * so they can be managed, cleared, and audited independently from app data.
 *
 * Note: localStorage is not encrypted. The threat model addressed here is:
 * - Separation of concerns (credentials vs. workout data)
 * - Easier future migration to a more secure store (SubtleCrypto, etc.)
 * - Prevention of credentials appearing in IDB backup exports
 */

const KEYS = {
    supabaseUrl: 'tive_cred_supabase_url',
    supabaseKey: 'tive_cred_supabase_key',
    geminiKey:   'tive_cred_gemini_key',
} as const;

export const credentialsStore = {
    getSupabaseUrl: (): string => localStorage.getItem(KEYS.supabaseUrl) ?? '',
    getSupabaseKey: (): string => localStorage.getItem(KEYS.supabaseKey) ?? '',
    getGeminiKey:   (): string => localStorage.getItem(KEYS.geminiKey) ?? '',

    setSupabase: (url: string, key: string): void => {
        localStorage.setItem(KEYS.supabaseUrl, url);
        localStorage.setItem(KEYS.supabaseKey, key);
    },

    setGeminiKey: (key: string): void => {
        localStorage.setItem(KEYS.geminiKey, key);
    },

    clear: (): void => {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    },
};
