// src/features/orders/components/tracking/hooks/useLiveETA.ts
//
// Client-side live ETA engine.
// Uses Haversine distance from rider's live GPS to customer drop point.
// Only active during PICKED_UP / EN_ROUTE delivery statuses.
//
// Adds generous breathing room: +3 min padding, 5 min floor.
// Freezes when rider GPS is stale (>45s).
// Returns "arriving now" when < 200m.

import { useMemo } from 'react';
import { useLiveTrackingStore } from '../../../../../store/liveTrackingStore';
import type { MobileOrderDetail } from '../../../../../types/order';

export interface LiveETAResult {
  /** Estimated minutes remaining. Null when not in transit. */
  etaMinutes: number | null;
  /** True when rider GPS hasn't updated in >45s. */
  isStale: boolean;
  /** True when rider is within 200m of customer. */
  isArriving: boolean;
}

const STALE_THRESHOLD_MS = 45_000;
const ARRIVING_THRESHOLD_KM = 0.2;
const AVG_SPEED_KMH = 22;
const MIN_ETA_MINS = 5;
const PADDING_MINS = 3;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useLiveETA(order: MobileOrderDetail): LiveETAResult {
  const riderLocation = useLiveTrackingStore(
    (s) => s.riderLocations[order.order_id],
  );

  return useMemo(() => {
    const ds = order.delivery?.status;

    // Only compute ETA during active transit
    if (ds !== 'PICKED_UP' && ds !== 'EN_ROUTE') {
      return { etaMinutes: null, isStale: false, isArriving: false };
    }

    // Resolve rider coordinates: live SSE > last known from API
    let riderLat: number | null = null;
    let riderLng: number | null = null;
    let isStale = false;

    if (riderLocation) {
      riderLat = riderLocation.lat;
      riderLng = riderLocation.lng;
      isStale = Date.now() - riderLocation.timestamp > STALE_THRESHOLD_MS;
    } else {
      const loc = order.delivery?.rider?.current_location;
      if (loc?.latitude != null && loc?.longitude != null) {
        riderLat = loc.latitude;
        riderLng = loc.longitude;
      }
    }

    // Resolve customer drop coordinates
    const drop = order.delivery?.drop_location;
    const addr = order.delivery_address;
    const dropLat = drop?.latitude ?? addr?.latitude ?? null;
    const dropLng = drop?.longitude ?? addr?.longitude ?? null;

    if (riderLat == null || riderLng == null || dropLat == null || dropLng == null) {
      return { etaMinutes: null, isStale, isArriving: false };
    }

    const distKm = haversineKm(riderLat, riderLng, dropLat, dropLng);

    if (distKm <= ARRIVING_THRESHOLD_KM) {
      return { etaMinutes: 0, isStale, isArriving: true };
    }

    const rawMins = (distKm / AVG_SPEED_KMH) * 60;
    const paddedMins = Math.max(MIN_ETA_MINS, Math.ceil(rawMins) + PADDING_MINS);

    return {
      etaMinutes: paddedMins,
      isStale,
      isArriving: false,
    };
  }, [order.delivery?.status, order.delivery?.drop_location, order.delivery?.rider?.current_location, order.delivery_address, riderLocation]);
}