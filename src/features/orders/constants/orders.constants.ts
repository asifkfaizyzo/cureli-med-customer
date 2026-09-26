// src/features/orders/constants/orders.constants.ts (do not remove this comment)
// src/features/orders/constants/orders.constants.ts
// Changes:
//   - READY_FOR_PICKUP label: 'Out for Delivery' (correct for delivery model)
//   - READY_FOR_PICKUP icon: 'bicycle-outline' (kept — appropriate for delivery)
//   - Added REJECTION_REASON_LABELS map and getRejectionLabel helper
//   - Added getStatusColors: centralizes the colorKey → { fg, bg, border }
//     theme-token mapping so screens don't duplicate this ternary chain.

import type { MarketplaceOrderStatus } from '../../../types/order';
import type { ColorPalette } from '../../../theme/colors';

// ── Status display label ──────────────────────────────────────────────────────
// These are customer-facing labels. Internal DB enum stays READY_FOR_PICKUP.
// All orders are delivery — "Out for Delivery" is correct customer language.

const STATUS_LABELS: Record<MarketplaceOrderStatus, string> = {
  PLACED:           'Order Placed',
  ACCEPTED:         'Pharmacy Received',
  READY_FOR_PICKUP: 'Out for Delivery',
  COMPLETED:        'Delivered',
  CANCELLED:        'Cancelled',
  REJECTED:         'Rejected',
};

export function getStatusLabel(status: MarketplaceOrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// ── Status semantic colour key ────────────────────────────────────────────────

export type StatusColorKey = 'success' | 'warning' | 'error' | 'info';

const STATUS_COLOR: Record<MarketplaceOrderStatus, StatusColorKey> = {
  PLACED:           'info',
  ACCEPTED:         'warning',
  READY_FOR_PICKUP: 'warning',
  COMPLETED:        'success',
  CANCELLED:        'error',
  REJECTED:         'error',
};

export function getStatusColorKey(status: MarketplaceOrderStatus): StatusColorKey {
  return STATUS_COLOR[status] ?? 'info';
}

// ── Status icon name (Ionicons) ───────────────────────────────────────────────

const STATUS_ICON: Record<MarketplaceOrderStatus, string> = {
  PLACED:           'time-outline',
  ACCEPTED:         'storefront-outline',
  READY_FOR_PICKUP: 'bicycle-outline',
  COMPLETED:        'checkmark-circle',
  CANCELLED:        'close-circle',
  REJECTED:         'close-circle',
};

export function getStatusIcon(status: MarketplaceOrderStatus): string {
  return STATUS_ICON[status] ?? 'help-circle-outline';
}

// ── Resolved status colors (fg / bg / border) for badges & timelines ──────────
// Centralizes the semantic-color → theme-token mapping so screens don't
// duplicate this ternary chain in multiple places. 'info' intentionally
// resolves to the brand color (not colors.status.info) since PLACED is
// treated as the "default/brand" state rather than a generic informational
// blue — this matches the original OrderDetailScreen design intent.

export interface ResolvedStatusColors {
  fg: string;
  bg: string;
  border: string;
}

export function getStatusColors(
  colorKey: StatusColorKey,
  colors: ColorPalette,
): ResolvedStatusColors {
  switch (colorKey) {
    case 'success':
      return {
        fg: colors.status.success,
        bg: colors.status.successBg,
        border: colors.status.successBorder,
      };
    case 'error':
      return {
        fg: colors.status.error,
        bg: colors.status.errorBg,
        border: colors.status.errorBorder,
      };
    case 'warning':
      return {
        fg: colors.status.warning,
        bg: colors.status.warningBg,
        border: colors.status.warningBorder,
      };
    case 'info':
    default:
      return {
        fg: colors.brand.primary,
        bg: colors.background.tint,
        border: colors.border.brand,
      };
  }
}

// ── Rejection reason labels ───────────────────────────────────────────────────
// Maps backend enum values to human-readable customer-facing strings.
// Used in OrderHistoryCard and OrderDetailScreen.

const REJECTION_REASON_LABELS: Record<string, string> = {
  OUT_OF_STOCK:         'Out of Stock',
  PRESCRIPTION_INVALID: 'Prescription Invalid',
  STORE_CLOSED:         'Store Closed',
  OTHER:                'Other',
};

export function getRejectionLabel(reason: string | null | undefined): string {
  if (!reason) return '';
  return REJECTION_REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
}

// ── Date formatting utilities ─────────────────────────────────────────────────

export function formatDeliveryDate(isoString: string): string {
  const date = new Date(isoString);
  return (
    date.toLocaleDateString('en-IN', {
      day:   'numeric',
      month: 'short',
      year:  'numeric',
    }) +
    ', ' +
    date.toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}