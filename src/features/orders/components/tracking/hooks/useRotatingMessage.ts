// src/features/orders/components/tracking/hooks/useRotatingMessage.ts
//
// Dual-status phrase engine for the live tracking hero.
// Returns two static status lines (order track + delivery track)
// and a rotating ambient subtitle that crossfades every 4 seconds.
//
// Delay warnings are NOT handled here — see TrackingDelayBanner.

import { useState, useEffect, useMemo } from 'react';
import type { MobileOrderDetail } from '../../../../../types/order';

export interface RotatingMessageResult {
  /** Primary status line (order lifecycle). Null when delivery takes over. */
  line1: string | null;
  /** Secondary status line (delivery lifecycle). Null when no delivery yet. */
  line2: string | null;
  /** Rotating ambient subtitle that crossfades every 4s. */
  subtitle: string;
}

export function useRotatingMessage(order: MobileOrderDetail): RotatingMessageResult {
  const [index, setIndex] = useState(0);

  const status = order.status;
  const ds = order.delivery?.status;
  const riderName = order.delivery?.rider?.name || 'Your delivery partner';

  const config = useMemo(() => {
    let line1: string | null = null;
    let line2: string | null = null;
    let subtitles: string[] = ['Updating order status...'];

    // ── Terminal states ──────────────────────────────────────────
    if (status === 'CANCELLED') {
      line1 = 'Order Cancelled';
      subtitles = [order.rejection_reason || 'This order has been cancelled'];
      return { line1, line2, subtitles };
    }
    if (status === 'REJECTED') {
      line1 = 'Order Rejected';
      subtitles = [order.rejection_reason || 'The pharmacy could not fulfil this order'];
      return { line1, line2, subtitles };
    }
    if (ds === 'DELIVERED') {
      line2 = 'Order delivered successfully';
      subtitles = ['Thank you for choosing Cureli', 'Rate your delivery experience'];
      return { line1, line2, subtitles };
    }
    if (ds === 'FAILED') {
      line2 = 'Delivery could not be completed';
      subtitles = ['Please contact support for assistance'];
      return { line1, line2, subtitles };
    }

    // ── Active states: dual-track mapping ────────────────────────

    // 1. PLACED — waiting for pharmacy
    if (status === 'PLACED') {
      line1 = 'Waiting for pharmacy to confirm';
      subtitles = [
        'Sending your order to the pharmacy',
        'This usually takes just a moment',
        'The pharmacist will review shortly',
      ];
    }

    // 2. ACCEPTED — pharmacy preparing
    else if (status === 'ACCEPTED') {
      line1 = 'Pharmacy is preparing your order';

      if (ds === 'RIDER_NOTIFIED') {
        line2 = 'Rider is heading to the pharmacy';
        subtitles = ['Both pharmacy and rider are on it', 'Your order will be ready soon'];
      } else if (ds === 'ACCEPTED') {
        line2 = 'Rider has accepted the delivery';
        subtitles = ['Rider is on the way to the pharmacy', 'Your delivery partner is en route'];
      } else {
        subtitles = [
          'The pharmacist is picking your medicines',
          'Your order is being packed with care',
        ];
      }
    }

    // 3. READY_FOR_PICKUP — packed, rider lifecycle
    else if (status === 'READY_FOR_PICKUP') {
      line1 = 'Your order is packed and ready';

      if (!ds || ds === 'PENDING_ASSIGNMENT') {
        line2 = 'Finding a delivery partner';
        subtitles = ['Searching for nearby riders', 'A rider will be assigned shortly'];
      } else if (ds === 'RIDER_NOTIFIED') {
        line2 = 'Rider is on the way to pick up';
        subtitles = ['Rider is heading to the pharmacy', 'Pickup is just minutes away'];
      } else if (ds === 'ACCEPTED') {
        line2 = 'Rider has accepted the delivery';
        subtitles = ['Rider is en route to the pharmacy', 'Your delivery partner is on the way'];
      } else if (ds === 'ARRIVED_AT_PHARMACY') {
        line2 = 'Rider is at the pharmacy';
        subtitles = ['Collecting your order now', 'Handoff in progress'];
      } else if (ds === 'PHARMACY_CONFIRMED') {
        line2 = 'Rider is collecting your package';
        subtitles = ['Almost ready to head your way', 'Final checks at the pharmacy'];
      }
    }

    // 4. COMPLETED (order done) — delivery in transit
    else if (status === 'COMPLETED') {
      if (ds === 'PICKED_UP') {
        line2 = `${riderName} has your order, on the way!`;
        subtitles = ['Heading to your location', 'Your medicines are on the way'];
      } else if (ds === 'EN_ROUTE') {
        line2 = `${riderName} is heading to your location`;
        subtitles = ['On the way to your address', 'Sit tight, arriving soon'];
      } else if (ds === 'ARRIVED_AT_CUSTOMER') {
        line2 = 'Rider is at your door!';
        subtitles = ['Share your delivery PIN to receive your order'];
      } else {
        line2 = 'Delivery in progress';
        subtitles = ['Updating delivery status...'];
      }
    }

    return { line1, line2, subtitles };
  }, [status, ds, riderName, order.rejection_reason]);

  // Auto-rotate subtitle every 4 seconds
  useEffect(() => {
    setIndex(0);
    if (config.subtitles.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % config.subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [config.subtitles]);

  const subtitle = config.subtitles[index] || config.subtitles[0] || '';

  return {
    line1: config.line1,
    line2: config.line2,
    subtitle,
  };
}