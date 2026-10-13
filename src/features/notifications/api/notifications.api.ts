// src/features/notifications/api/notifications.api.ts

import { api } from '../../../services/api';
import type { NotificationTapData } from '../../../constants/pushCategories';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  data: NotificationTapData | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface InboxPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface InboxResponse {
  notifications: InboxNotification[];
  unread_count: number;
  pagination: InboxPagination;
}

export interface FetchInboxParams {
  page?: number;
  limit?: number;
  category?: string;
  unread_only?: boolean;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchInbox(
  params: FetchInboxParams = {},
): Promise<InboxResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category) query.set('category', params.category);
  if (params.unread_only) query.set('unreadOnly', 'true');

  const qs = query.toString();
  const url = `/mobile/push/inbox${qs ? `?${qs}` : ''}`;

  const { data } = await api.get<{
    success: boolean;
    data: InboxResponse;
  }>(url);

  return data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{
    success: boolean;
    data: { count: number };
  }>('/mobile/push/inbox/unread-count');

  return data.data.count;
}

export async function markAsRead(
  notificationIds: string[],
): Promise<{ unread_count: number }> {
  const { data } = await api.post<{
    success: boolean;
    data: { unread_count: number };
  }>('/mobile/push/inbox/read', {
    notification_ids: notificationIds,
  });

  return data.data;
}

export async function markAllAsRead(): Promise<{ unread_count: number }> {
  const { data } = await api.post<{
    success: boolean;
    data: { unread_count: number };
  }>('/mobile/push/inbox/read', {
    mark_all: true,
  });

  return data.data;
}