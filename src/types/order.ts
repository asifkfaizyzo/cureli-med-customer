// src/types/order.ts (do not remove this comment)


export type MarketplaceOrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface MobileOrderItem {
  item_id: string;
  medicine_name: string;
  brand: string | null;
  pack_size: string | null;
  quantity: number;
  unit_price: number;
  mrp: number;
  line_total: number;
  requires_prescription: boolean;
  image_url: string | null;
}

export interface MobileOrderPrescription {
  prescription_id: string;
  original_name: string;
  mime_type: string;
  sequence: number;
  is_expired: boolean;
}

export interface MobileOrderStatusHistory {
  from_status: MarketplaceOrderStatus | null;
  to_status: MarketplaceOrderStatus;
  changed_by_type: string;
  reason: string | null;
  created_at: string;
}

export interface MobileOrderSummary {
  order_id: string;
  order_number: string;
  status: MarketplaceOrderStatus;
  delivery_status?: DeliveryStatus | null;
  shop_name: string | null;
  total_amount: number;
  requires_prescription: boolean;
  item_count: number;
  items: MobileOrderItem[];
  notes: string | null;
  rejection_reason: string | null;
  placed_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  payment_status?: string | null;
}

export interface MobileOrderDeliveryAddress {
  label: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  recipient_name: string | null;
  recipient_phone: string | null;
}

export interface MobileOrderDetail {
  order_id: string;
  order_number: string;
  status: MarketplaceOrderStatus;
  shop_name: string | null;
  shop_phone: string | null;
  branch_name: string | null;
  branch_address: string | null;
  branch_latitude: number | null;
  branch_longitude: number | null;
  delivery_address: MobileOrderDeliveryAddress;

  total_amount: number;
  subtotal: number;
  service_charge?: number | null;
  delivery_fee?: number | null;
  km_surcharge?: number | null;
  tip?: number | null;
  grand_total?: number | null;

  // ── Coupon & Loyalty ──────────────────────────────────────────
  coupon_code?: string | null;
  coupon_discount_amount?: number | null;
  loyalty_points_redeemed?: number | null;
  loyalty_discount_amount?: number | null;
  loyalty_points_earned?: number | null;

  // ── Patient ───────────────────────────────────────────────────
  patient_is_self?: boolean;
  patient_name_snapshot?: string | null;

  // ── Distance ──────────────────────────────────────────────────
  distance_km?: number | null;

  requires_prescription: boolean;
  payment_method: string;
  payment_status?: string | null;

  notes: string | null;
  rejection_reason: string | null;
  rejection_reason_other: string | null;
  delivery_otp?: string | null;
  delivery: DeliveryTrackingInfo | null;

  placed_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  items: MobileOrderItem[];
  prescriptions: MobileOrderPrescription[];
  status_history: MobileOrderStatusHistory[];
  invoice_generated_at?: string | null;
}

export interface ReorderAvailableItem {
  variantId: string;
  skuId: string;
  name: string;
  manufacturer: string | null;
  image: string | null;
  pricePerUnit: number;
  requiresPrescription: boolean;
  category: string | null;
  quantity: number;
  shopId: string;
  shopName: string;
  branchId: string;
  branchName: string;
  branchLatitude: number | null;
  branchLongitude: number | null;
}

export interface ReorderUnavailableItem {
  medicine_name: string;
  reason: "not_listed" | "out_of_stock" | "no_price";
}

export interface ReorderItemsResponse {
  branch_id: string;
  branch_name: string | null;
  shop_id: string;
  shop_name: string | null;
  available: ReorderAvailableItem[];
  unavailable: ReorderUnavailableItem[];
}

export interface OrdersListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Live Delivery Tracking Types ────────────────────────────────────────────

export interface DeliveryLocation {
  latitude: number | null;
  longitude: number | null;
}

export interface DeliveryDistances {
  pickup_km: number | null;
  drop_km: number | null;
  total_km: number | null;
}

export interface DeliveryTimestamps {
  assigned_at: string | null;
  accepted_at: string | null;
  arrived_at_pharmacy_at: string | null;
  picked_up_at: string | null;
  arrived_at_customer_at: string | null;
  delivered_at: string | null;
}

export type DeliveryStatus =
  | "PENDING_ASSIGNMENT"
  | "RIDER_NOTIFIED"
  | "ACCEPTED"
  | "ARRIVED_AT_PHARMACY"
  | "PHARMACY_CONFIRMED"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "ARRIVED_AT_CUSTOMER"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export interface RiderInfo {
  rider_id: string;
  name: string | null;
  phone: string;
  photo_url: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  vehicle_make_model: string | null;
  rating: number;
  total_ratings: number;
  current_location: {
    latitude: number | null;
    longitude: number | null;
    last_updated_at: string | null;
  };
}

export interface DeliveryTrackingInfo {
  delivery_id: string;
  status: DeliveryStatus;
  pickup_location: DeliveryLocation;
  drop_location: DeliveryLocation;
  distances: DeliveryDistances;
  timestamps: DeliveryTimestamps;
  rider: RiderInfo | null;
}