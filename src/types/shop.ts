// cureli-med-customer/src/types/shop.ts (do not remove this comment)
// src/types/shop.ts
//
// Canonical types for Cureli mobile shop discovery.
//
// Three layers:
//   1. REAL  — shapes returned by GET /mobile/shops/* (real DB data)
//   2. ENRICHED — shop branch with computed display fields
//   3. CART  — pharmacy context stored in cart items

// ── Shop Tag ─────────────────────────────────────────────────

export interface ShopTag {
  slug: string;
  label: string;
  colorHex: string;
  description: string | null;
}

// ── Branch (inside search result and shop profile) ────────────

export interface ShopBranch {
  branchId: string;
  branchName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  isOpen: boolean;
  statusMessage: string;
  is24Hours: boolean;
  openingTime: string | null;
  closingTime: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  contact: string | null;
  marketplaceEnabled: boolean;
  listedMedicineCount: number;
  deliveryTimeEstimate: string | null;
}

// ── Shop profile branch (extends ShopBranch with profile-only fields) ──

export interface ShopProfileBranch extends ShopBranch {
  shopImageUrl: string | null;
  isActive: boolean;
}

// ── Search result (one per shop) ──────────────────────────────

export interface ShopSearchResult {
  shopId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  /** Pharmacy classification tags in priority order. */
  tags: ShopTag[];
  /** The nearest branch to the user, or first alphabetically if no location. */
  nearestBranch: ShopBranch | null;
  /** Count of marketplace_enabled branches. */
  totalBranches: number;
  /** Count of visible in-stock listings across all branches. */
  listedMedicineCount: number;
  /**
   * Always null currently — no rating data in schema.
   * Field is present so UI can render "No rating yet" without
   * a schema change when ratings are added.
   */
  rating: number | null;
}

export interface ShopSearchResponse {
  shops: ShopSearchResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Full shop profile (GET /mobile/shops/:shopId) ─────────────

export interface ShopProfile {
  shopId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  supportPhone: string | null;
  /** Pharmacy classification tags in priority order. */
  tags: ShopTag[];
  marketplaceStatus: string;
  isLive: boolean;
  /** All marketplace-onboarded branches (enabled + disabled). */
  branches: ShopProfileBranch[];
  rating: number | null;
}

export interface ShopProfileResponse {
  shopId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  supportPhone: string | null;
  tags: ShopTag[];
  marketplaceStatus: string;
  isLive: boolean;
  branches: ShopProfileBranch[];
  rating: number | null;
}

// ── Branch medicines (GET /mobile/shops/:shopId/branches/:branchId/medicines) ──

export interface BranchMedicineItem {
  variantId: string;
  skuId: string;
  name: string;
  brand: string | null;
  composition: import("./medicine").CompositionItem[];
  strength: string | null;
  manufacturer: string | null;
  packSize: string | null;
  image: string | null;
  prescriptionRequired: boolean;
  form: string | null;
  category: string | null;
  genericName: string | null;
  type: import("./medicine").MedicineType | null;
  listingPrice: number | null;
  requiresPrescription: boolean;
  stockStatus: string;
}

export interface BranchMedicinesResponse {
  medicines: BranchMedicineItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Cart pharmacy context ─────────────────────────────────────

export interface CartPharmacy {
  shopId: string;
  shopName: string;
  branchId: string;
  branchName: string;
}
