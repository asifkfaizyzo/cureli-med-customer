// app/notifications.tsx
//
// Expo Router entry point for the notification history screen.
// Accessed via router.push('/notifications') from the home screen bell icon.

import { NotificationsScreen } from '../src/features/notifications/screens/NotificationsScreen';

export default function NotificationsPage() {
  return <NotificationsScreen />;
}