// src/features/marketplace/api/orders.api.ts (do not remove this comment)
// Updated: Added getInvoiceUrl for mobile invoice download and getDirections for live tracking

import { api } from "../../../services/api";

import type { FulfillmentType } from "../../../types/order";

export const ordersApi = {
  placeOrder: (data: {
    branch_id: string;
    delivery_address_id?: string | null;
    items: { variantId: string; quantity: number }[];
    notes?: string;
    fulfillment_type?: FulfillmentType;
    prescription_files?: {
      prescription_key: string;
      original_name: string;
      mime_type: string;
      file_size: number;
    }[];
  }) => api.post("/mobile/orders", data),

  getOrders: (params?: {
    page?: number;
    limit?: number;
    fulfillment_type?: FulfillmentType;
  }) => api.get("/mobile/orders", { params }),

  getOrderDetail: (orderId: string) => api.get(`/mobile/orders/${orderId}`),

  cancelOrder: (orderId: string) =>
    api.post(`/mobile/orders/${orderId}/cancel`),

  /**
   * POST /mobile/orders/:orderId/confirm-pickup
   * Customer-initiated pickup confirmation (self-service).
   * Idempotent — safe to retry. Backend transitions order to COMPLETED.
   */
  confirmPickup: (orderId: string) =>
    api.post(`/mobile/orders/${orderId}/confirm-pickup`),

  uploadPrescriptions: (formData: FormData) =>
    api.post("/mobile/prescriptions/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getPrescriptionUrl: (orderId: string, prescriptionId: string) =>
    api.get(`/mobile/orders/${orderId}/prescriptions/${prescriptionId}/url`),

  getReorderItems: (orderId: string) =>
    api.get(`/mobile/orders/${orderId}/reorder-items`),

  /**
   * GET /mobile/orders/:orderId/invoice
   * Returns a 15-minute signed S3 URL for the 2-page PDF invoice.
   * Available once status is READY_FOR_PICKUP or COMPLETED.
   */
  getInvoiceUrl: (orderId: string) =>
    api.get(`/mobile/orders/${orderId}/invoice`),

  /**
   * GET /mobile/places/directions
   * Returns encoded polyline + duration for a driving route.
   * Called once per delivery leg — NOT on every GPS tick.
   */
  getDirections: (params: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
  }) => api.get("/mobile/places/directions", { params }),
};
