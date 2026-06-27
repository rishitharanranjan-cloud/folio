/**
 * Weekly habit nudge — "What did you finish this week?"
 * Uses expo-notifications for push (native) and in-app state for web.
 * Scheduled for Sunday evening. Non-aggressive: one nudge per week max.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const WEEKLY_NUDGE_ID = 'folio-weekly-nudge';

const NUDGE_MESSAGES = [
  "What did you finish this week?",
  "Anything worth logging this week?",
  "Your shelf is waiting. What did you read, watch or listen to?",
  "End of the week. Anything to add to Folio?",
  "What stayed with you this week?",
];

function randomNudge(): string {
  return NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWeeklyNudge(): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel only the weekly nudge before rescheduling
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_NUDGE_ID);

  // Schedule for Sunday at 19:00 local time, repeating weekly
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_NUDGE_ID,
    content: {
      title: 'FOLIO',
      body: randomNudge(),
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday (1 = Sunday in expo-notifications)
      hour: 19,
      minute: 0,
    },
  });
}

export async function cancelWeeklyNudge(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_NUDGE_ID);
}

/** Check if it's been 7+ days since last log — used for in-app nudge on web */
export function shouldShowInAppNudge(lastLoggedAt: string | null): boolean {
  if (!lastLoggedAt) return false;
  const daysSince = (Date.now() - new Date(lastLoggedAt).getTime()) / 86400000;
  return daysSince >= 7;
}
