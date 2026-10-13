// src/utils/notificationTap.ts
//
// Shared deep-link navigation for notification taps.
// Used by both PushManager (system push taps) and NotificationsScreen
// (history list taps). Extracted from PushManager to avoid duplication.

import { router } from 'expo-router';
import type { NotificationTapData } from '../constants/pushCategories';

export function extractTapData(
  raw: Record<string, unknown> | undefined | null,
): NotificationTapData | undefined {
  if (!raw) return undefined;
  return raw as unknown as NotificationTapData;
}

export function handleNotificationTap(data?: NotificationTapData | null) {
  if (!data?.screen) {
    router.push('/(tabs)' as any);
    return;
  }

  switch (data.screen) {
    case 'order_detail':
      if (data.orderId) {
        router.push(`/orders/${data.orderId}` as any);
      } else {
        router.push('/orders' as any);
      }
      break;

    case 'cart':
      router.push('/cart' as any);
      break;

    case 'product':
      if (data.productId) {
        router.push(`/product/${data.productId}` as any);
      } else {
        router.push('/(tabs)' as any);
      }
      break;

    case 'category':
      if (data.categoryName) {
        router.push({
          pathname: '/marketplace/category' as any,
          params: { name: data.categoryName },
        });
      } else {
        router.push('/marketplace/categories' as any);
      }
      break;

    case 'prescription_upload':
      router.push('/prescription/upload' as any);
      break;

    case 'prescription_request_detail':
      if (data.requestId) {
        router.push(`/prescription-request/${data.requestId}` as any);
      } else {
        router.push('/prescription-request' as any);
      }
      break;

    case 'home':
    default:
      router.push('/(tabs)' as any);
      break;
  }
}