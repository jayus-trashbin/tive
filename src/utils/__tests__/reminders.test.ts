import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndTriggerReminders, requestNotificationPermission } from '../reminders';
import { useWorkoutStore } from '../../store/useWorkoutStore';

const REMINDER_STORAGE_KEY = 'tive_last_reminder_date';

// Mock Notification API
const mockRequestPermission = vi.fn();
const mockNotificationConstructor = vi.fn();

global.Notification = class {
  constructor(title: string, options: any) {
    mockNotificationConstructor(title, options);
  }
  static requestPermission = mockRequestPermission;
  static permission = 'default';
} as any;

describe('Reminders Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockRequestPermission.mockClear();
    mockNotificationConstructor.mockClear();
    
    // Reset store
    useWorkoutStore.setState({
      userStats: {
        bodyweight: 80,
        gender: 'male',
        wilksScore: 0,
        unitSystem: 'metric',
        theme: 'dark',
        reminderSettings: {
          enabled: true,
          time: '18:00',
          days: [1, 3, 5] // Mon, Wed, Fri
        }
      } as any
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger notification when conditions are met', () => {
    // Set permission to granted
    (global.Notification as any).permission = 'granted';

    // Mock date to a Monday (e.g. 2026-06-22 is a Monday) at 18:00
    const mockDate = new Date('2026-06-22T18:00:00Z');
    // Adjust for timezone so getHours() returns 18 and getMinutes() returns 0
    vi.setSystemTime(new Date(mockDate.getTime() + mockDate.getTimezoneOffset() * 60000));
    
    checkAndTriggerReminders();

    expect(mockNotificationConstructor).toHaveBeenCalled();
    expect(localStorage.getItem(REMINDER_STORAGE_KEY)).toBeDefined();
  });

  it('should NOT trigger if reminders are disabled', () => {
    (global.Notification as any).permission = 'granted';
    useWorkoutStore.setState((state) => ({
      userStats: {
        ...state.userStats,
        reminderSettings: { ...state.userStats!.reminderSettings!, enabled: false }
      }
    }));

    const mockDate = new Date('2026-06-22T18:00:00Z');
    vi.setSystemTime(new Date(mockDate.getTime() + mockDate.getTimezoneOffset() * 60000));
    
    checkAndTriggerReminders();

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('should NOT trigger if it is not a selected day', () => {
    (global.Notification as any).permission = 'granted';

    // 2026-06-23 is a Tuesday, not in [1, 3, 5]
    const mockDate = new Date('2026-06-23T18:00:00Z');
    vi.setSystemTime(new Date(mockDate.getTime() + mockDate.getTimezoneOffset() * 60000));
    
    checkAndTriggerReminders();

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('should NOT trigger if time does not match', () => {
    (global.Notification as any).permission = 'granted';

    // Monday, but 18:01
    const mockDate = new Date('2026-06-22T18:01:00Z');
    vi.setSystemTime(new Date(mockDate.getTime() + mockDate.getTimezoneOffset() * 60000));
    
    checkAndTriggerReminders();

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('should NOT trigger if already notified today', () => {
    (global.Notification as any).permission = 'granted';

    const mockDate = new Date('2026-06-22T18:00:00Z');
    const localTime = new Date(mockDate.getTime() + mockDate.getTimezoneOffset() * 60000);
    vi.setSystemTime(localTime);
    
    // Set localStorage as if we already notified
    localStorage.setItem(REMINDER_STORAGE_KEY, localTime.toISOString().split('T')[0]);
    
    checkAndTriggerReminders();

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });
});
