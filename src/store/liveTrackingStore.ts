// src/store/liveTrackingStore.ts 
import { create } from 'zustand';

export interface RiderLiveLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

interface LiveTrackingState {
  /**
   * Map of orderId → latest rider GPS coordinates.
   * Updated every ~5 seconds via SSE rider_location_update events.
   */
  riderLocations: Record<string, RiderLiveLocation>;

  /**
   * Set or update the rider's live location for a specific order.
   * Called by the SSE listener in useMobileSSE.
   */
  setRiderLocation: (orderId: string, lat: number, lng: number, timestamp: number) => void;

  /**
   * Clear tracking data for a specific order.
   * Called when the order reaches a terminal state or the tracking screen unmounts.
   */
  clearTracking: (orderId: string) => void;

  /**
   * Clear all tracking data.
   * Called on logout.
   */
  clearAll: () => void;
}

export const useLiveTrackingStore = create<LiveTrackingState>((set) => ({
  riderLocations: {},

  setRiderLocation: (orderId, lat, lng, timestamp) =>
    set((state) => ({
      riderLocations: {
        ...state.riderLocations,
        [orderId]: { lat, lng, timestamp },
      },
    })),

  clearTracking: (orderId) =>
    set((state) => {
      const { [orderId]: _, ...rest } = state.riderLocations;
      return { riderLocations: rest };
    }),

  clearAll: () => set({ riderLocations: {} }),
}));