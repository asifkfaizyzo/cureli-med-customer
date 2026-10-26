// src/store/checkoutStore.ts (do not remove this comment)
// src/store/checkoutStore.ts

import { create } from 'zustand';
import type { CheckoutPatient } from '../types/auth';
import type { FulfillmentType } from '../types/order';

// REPLACE
// ── Per-order delivery fee breakdown (new tiered engine, Phase 2/4) ──
export interface DeliveryBreakdown {
  flat_charge:         number;
  free_radius_km:      number;
  per_km_rate:         number;
  charged_distance_km: number;
  distance_charge:     number;
  matched_tier_min:    number;
}

export interface PriceBreakdown {
  subtotal:                 number;
  service_charge:           number;
  service_charge_anchor?:   number | null; // Cosmetic anchor for service charge
  delivery_fee:             number;        // Replaces base delivery fee
  delivery_charge_anchor?:  number | null; // Cosmetic anchor for delivery charge
  delivery_breakdown?:      DeliveryBreakdown | null; // Transparency: how delivery_fee was computed
  km_surcharge:             number;        // Kept 0 for new orders, legacy compatibility
  packing_charge:           number;        // New: packing fee for pickup orders
  platform_savings?:        number;        // Total platform-side savings
  tip:                      number;
  coupon_code:              string | null;
  coupon_discount:          number;
  coupon_reason:            string | null;
  loyalty_points_redeemed:  number;
  loyalty_discount:         number;
  loyalty_reason:           string | null;
  grand_total:              number;
  delivery_available:       boolean;
  unavailable_reason:       string | null;
  same_day_available?:      boolean;
  same_day_cutoff_hour?:    number;
  // ── Distance (for "slashed km" display) ──
  distance_km?:              number | null;
  nudges?: {
    free_delivery: { gap: number; threshold: number; targetDelivery?: number; isFreeDelivery?: boolean } | null;
    free_service_charge: { gap: number; threshold: number } | null;
  } | null;
  // ── GST ──
  gst_rate?: number | null;
  gst_type?: string | null;
  gst_amount?: number | null;
  gst_breakdown?: { component: string; base: number; gst: number }[] | null;
}

export interface PrescriptionRequestContext {
  prescription_request_id:   string;
  prescription_recipient_id: string;
}

interface CheckoutStore {
  breakdown:                    PriceBreakdown | null;
  isQuoteLoading:               boolean;
  tip:                          number;
  fulfillmentType:              FulfillmentType;
  activeFulfillmentTypes:       FulfillmentType[];
  selectedPatient:              CheckoutPatient | null;
  prescriptionRequestContext:   PrescriptionRequestContext | null;

  // Promotions & Loyalty Selections
  couponCode:                   string | null;
  loyaltyPointsToRedeem:        number;

  setBreakdown:                    (b: PriceBreakdown | null) => void;
  setQuoteLoading:                 (v: boolean) => void;
  setTip:                          (amount: number) => void;
  setFulfillmentType:              (type: FulfillmentType) => void;
  setActiveFulfillmentTypes:       (types: FulfillmentType[]) => void;
  setSelectedPatient:              (patient: CheckoutPatient | null) => void;
  setPrescriptionRequestContext:   (ctx: PrescriptionRequestContext | null) => void;
  setCouponCode:                   (code: string | null) => void;
  setLoyaltyPointsToRedeem:        (points: number) => void;
  reset:                           () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  breakdown:                  null,
  isQuoteLoading:             false,
  tip:                        0,
  fulfillmentType:            'INSTANT_DELIVERY',
  activeFulfillmentTypes:     ['INSTANT_DELIVERY', 'PICKUP', 'SAME_DAY'],
  selectedPatient:            null,
  prescriptionRequestContext: null,
  couponCode:                 null,
  loyaltyPointsToRedeem:      0,

  setBreakdown:                  (breakdown)                  => set({ breakdown }),
  setQuoteLoading:               (isQuoteLoading)             => set({ isQuoteLoading }),
  setTip:                        (tip)                        => set({ tip }),
  setFulfillmentType:            (fulfillmentType)            => set({ fulfillmentType }),
  setActiveFulfillmentTypes:     (activeFulfillmentTypes)     => set({ activeFulfillmentTypes }),
  setSelectedPatient:            (selectedPatient)            => set({ selectedPatient }),
  setPrescriptionRequestContext: (prescriptionRequestContext) => set({ prescriptionRequestContext }),
  setCouponCode:                 (couponCode)                 => set({ couponCode }),
  setLoyaltyPointsToRedeem:      (loyaltyPointsToRedeem)      => set({ loyaltyPointsToRedeem }),

  reset: () =>
    set({
      breakdown:                  null,
      isQuoteLoading:             false,
      tip:                        0,
      fulfillmentType:            'INSTANT_DELIVERY',
      activeFulfillmentTypes:     ['INSTANT_DELIVERY', 'PICKUP', 'SAME_DAY'],
      selectedPatient:            null,
      prescriptionRequestContext: null,
      couponCode:                 null,
      loyaltyPointsToRedeem:      0,
    }),
}));