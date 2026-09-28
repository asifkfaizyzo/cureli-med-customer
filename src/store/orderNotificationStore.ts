// src/store/orderNotificationStore.ts (do not remove this comment)
// src/store/orderNotificationStore.ts
//
// Single-purpose store for mobile SSE order status updates.
// Kept separate from authStore and prescriptionStore to avoid coupling.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkvStorage';

interface OrderStatusUpdate {
  order_id:     string;
  order_number: string;
  new_status:   string;
}

interface OrderNotificationStore {
  lastStatusUpdate: OrderStatusUpdate | null;
  setLastStatusUpdate: (update: OrderStatusUpdate) => void;
  clearLastStatusUpdate: () => void;
  
  // Persisted state for dismissed orders
  dismissedOrderIds: Record<string, boolean>;
  dismissOrder: (orderId: string) => void;
  clearDismissedOrders: () => void;
}

export const useOrderNotificationStore = create<OrderNotificationStore>()(
  persist(
    (set) => ({
      lastStatusUpdate: null,

      setLastStatusUpdate: (update) => set({ lastStatusUpdate: update }),

      clearLastStatusUpdate: () => set({ lastStatusUpdate: null }),

      dismissedOrderIds: {},

      dismissOrder: (orderId) =>
        set((state) => ({
          dismissedOrderIds: {
            ...state.dismissedOrderIds,
            [orderId]: true,
          },
        })),

      clearDismissedOrders: () => set({ dismissedOrderIds: {} }),
    }),
    {
      name: 'order-notification-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // We only persist dismissedOrderIds. lastStatusUpdate is kept transient.
      partialize: (state) => ({
        dismissedOrderIds: state.dismissedOrderIds,
      }),
    }
  )
);