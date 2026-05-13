/**
 * Date comparison utilities.
 * All timestamps in the store are Unix ms (number) — helpers live here
 * to avoid ad-hoc comparisons scattered across components.
 */

/** Returns negative, 0, or positive — suitable for Array.sort() */
export const compareDates = (a: number, b: number): number => a - b;

/** True if timestamp falls within today (local time) */
export const isToday = (timestamp: number): boolean => {
    const d = new Date(timestamp);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
};

/** True if timestamp falls within the same calendar day as the reference date */
export const isSameDay = (timestamp: number, reference: Date): boolean => {
    const d = new Date(timestamp);
    return (
        d.getFullYear() === reference.getFullYear() &&
        d.getMonth() === reference.getMonth() &&
        d.getDate() === reference.getDate()
    );
};

/** Start of day (00:00:00.000) for the given timestamp */
export const startOfDay = (timestamp: number): number =>
    new Date(new Date(timestamp).setHours(0, 0, 0, 0)).getTime();

/** End of day (23:59:59.999) for the given timestamp */
export const endOfDay = (timestamp: number): number =>
    new Date(new Date(timestamp).setHours(23, 59, 59, 999)).getTime();
