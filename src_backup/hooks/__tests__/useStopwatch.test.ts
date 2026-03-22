import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStopwatch } from '../useStopwatch';

describe('useStopwatch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with 0', () => {
        const { result } = renderHook(() => useStopwatch());
        expect(result.current.time).toBe(0);
        expect(result.current.isRunning).toBe(false);
    });

    it('should start counting', async () => {
        const { result } = renderHook(() => useStopwatch());

        act(() => {
            result.current.start();
        });

        expect(result.current.isRunning).toBe(true);

        // Advance 1s
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.time).toBe(1);
    });

    it('should pause counting', async () => {
        const { result } = renderHook(() => useStopwatch());

        act(() => {
            result.current.start();
        });

        // Advance 2s
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        expect(result.current.time).toBe(2);

        act(() => {
            result.current.pause();
        });

        expect(result.current.isRunning).toBe(false);

        // Advance 1s (should not increase)
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.time).toBe(2);
    });

    it('should reset timer', async () => {
        const { result } = renderHook(() => useStopwatch());

        act(() => {
            result.current.start();
        });

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.time).toBe(0);
        expect(result.current.isRunning).toBe(false);
    });
});
