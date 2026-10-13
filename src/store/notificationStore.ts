// src/store/notificationStore.ts
//
// Lightweight store for the notification bell badge count.
// Not persisted — fetched from the server on app open / screen focus.
// SSE can increment it in real-time for promotion broadcasts.

import { create } from 'zustand';
import { api } from '../services/api';

interface NotificationStore {
  unreadCount: number;
  isLoaded: boolean;

  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (by?: number) => void;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  unreadCount: 0,
  isLoaded: false,

  setUnreadCount: (count) => set({ unreadCount: count, isLoaded: true }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: (by = 1) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - by),
    })),

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get<{
        success: boolean;
        data: { count: number };
      }>('/mobile/push/inbox/unread-count');

      if (data.success) {
        set({ unreadCount: data.data.count, isLoaded: true });
      }
    } catch (err) {
      console.warn('[NotificationStore] Failed to fetch unread count:', err);
    }
  },
}));