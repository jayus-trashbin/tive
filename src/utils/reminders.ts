import { useWorkoutStore } from '../store/useWorkoutStore';
import { logger } from './logger';

const REMINDER_STORAGE_KEY = 'tive_last_reminder_date';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    logger.warn('Reminders', 'Notifications API not supported in this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    logger.error('Reminders', 'Error requesting notification permission', err);
    return false;
  }
}

/**
 * Checks the current time against the user's reminder settings.
 * If the current day and time match, and a notification hasn't been sent today,
 * triggers a local notification.
 */
export function checkAndTriggerReminders() {
  const { userStats } = useWorkoutStore.getState();
  const settings = userStats?.reminderSettings;

  if (!settings || !settings.enabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sun-Sat)
  
  if (!settings.days.includes(currentDay)) return;

  // Format current time as HH:mm to compare with settings.time
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  // We allow a small window (e.g. within the same minute)
  if (currentTimeStr !== settings.time) return;

  // Check if we already notified today
  const todayStr = now.toISOString().split('T')[0];
  const lastReminderStr = localStorage.getItem(REMINDER_STORAGE_KEY);

  if (lastReminderStr === todayStr) return; // Already notified today

  // Trigger notification
  try {
    // Attempt to use service worker registration if available for better mobile support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Treino Hoje! 💪', {
          body: 'Está na hora do seu treino. Vamos manter o ritmo!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'workout-reminder'
        });
      }).catch(err => {
        // Fallback to basic Notification if SW fails
        new Notification('Treino Hoje! 💪', {
          body: 'Está na hora do seu treino. Vamos manter o ritmo!',
          icon: '/icon-192.png'
        });
      });
    } else {
      new Notification('Treino Hoje! 💪', {
        body: 'Está na hora do seu treino. Vamos manter o ritmo!',
        icon: '/icon-192.png'
      });
    }

    localStorage.setItem(REMINDER_STORAGE_KEY, todayStr);
    logger.info('Reminders', 'Workout reminder notification triggered successfully.');
  } catch (err) {
    logger.error('Reminders', 'Failed to trigger notification', err);
  }
}
