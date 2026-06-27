import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const native = Platform.OS !== 'web';

/** Light tap — star ratings, chip selections, tab switches */
export function tapLight() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — confirming a selection (item chosen from search results) */
export function tapMedium() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy tap — destructive or major action (clear rating, drop status) */
export function tapHeavy() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success — log saved, trail completed, goal reached */
export function success() {
  if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning — save error, validation failure */
export function warn() {
  if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
