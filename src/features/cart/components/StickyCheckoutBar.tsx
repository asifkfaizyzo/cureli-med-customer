// src/features/cart/components/StickyCheckoutBar.tsx (do not remove this comment)

import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCartStore } from "../../../store/cartStore";
import { useCheckoutStore } from "../../../store/checkoutStore";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";
import { usePrescriptionStore } from "../../../store/prescriptionStore";
import { Spacing } from "../../../theme/spacing";
import { useTheme } from "../../../theme/ThemeContext";
import { useAddresses } from "../../profile/hooks/useAddresses";

interface StickyCheckoutBarProps {
  onPlaceOrder: () => void | Promise<void>;
  isPlacing?: boolean;
}

export function StickyCheckoutBar({
  onPlaceOrder,
  isPlacing: isPlacingProp,
}: StickyCheckoutBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const [localPlacing, setLocalPlacing] = useState(false);

  const items = useCartStore((s) => s.items);
  const tempFiles = usePrescriptionStore((s) => s.tempFiles);
  const breakdown = useCheckoutStore((s) => s.breakdown);
  const isQuoteLoading = useCheckoutStore((s) => s.isQuoteLoading);
  const fulfillmentType = useCheckoutStore((s) => s.fulfillmentType);
  const isPickup = fulfillmentType === "PICKUP";

  const { addresses } = useAddresses();
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );
  const resolvedAddress = pickedAddressId
    ? (addresses.find((a) => a.id === pickedAddressId) ?? null)
    : (addresses.find((a) => a.is_default) ?? addresses[0] ?? null);

  const requiresPrescription = items.some((i) => i.requiresPrescription);
  const prescriptionBlocked = requiresPrescription && tempFiles.length === 0;
  const noAddress = !resolvedAddress;
  const deliveryUnavailable = breakdown ? !breakdown.delivery_available : false;

  const isPlacing = isPlacingProp || localPlacing;

  const isBlocked =
    prescriptionBlocked ||
    noAddress ||
    deliveryUnavailable ||
    isQuoteLoading ||
    isPlacing;

  const grandTotal = breakdown?.grand_total ?? 0;

  const totalSavings =
    (breakdown?.platform_savings ?? 0) +
    (breakdown?.coupon_discount ?? 0) +
    (breakdown?.loyalty_discount ?? 0);
  const hasSavings = totalSavings > 0;

  const handlePlaceOrderPress = async () => {
    if (isBlocked) return;

    console.log(
      "[Cart Checkout] Place Order pressed. Activating click-shield locks.",
    );
    setLocalPlacing(true);

    try {
      await onPlaceOrder();
    } catch (error) {
      console.warn("[Cart Checkout] Place Order failed.", error);
    } finally {
      setLocalPlacing(false);
    }
  };

  // ── Resolve active nudge ───────────────────────────────────
  const serviceNudge = breakdown?.nudges?.free_service_charge;
  const deliveryNudge = !isPickup ? breakdown?.nudges?.free_delivery : null;
  const nudge =
    serviceNudge && serviceNudge.gap < 200
      ? { gap: serviceNudge.gap, type: "service" as const }
      : deliveryNudge && deliveryNudge.gap < 200
        ? { gap: deliveryNudge.gap, type: "delivery" as const }
        : null;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.card,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* ── Full-width nudge ribbon on top ─────────────────── */}
      {nudge && (
        <View
          style={[
            styles.nudge,
            { backgroundColor: colors.background.accent },
          ]}
        >
          <Text style={[styles.nudgeText, { color: colors.text.brand }]}>
            Add{" "}
            <Text style={[styles.nudgeBold, { color: colors.text.brand }]}>
              ₹{nudge.gap}
            </Text>
            {" "}more{" "}
            {nudge.type === "delivery" ? "for " : "to "}
            <Text style={[styles.nudgeBold, { color: colors.text.brand }]}>
              {nudge.type === "delivery" ? "free delivery" : "waive platform fee"}
            </Text>
          </Text>
        </View>
      )}

      {/* ── Prescription warning ───────────────────────────── */}
      {prescriptionBlocked && (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.status.warningBg,
              borderColor: colors.status.warningBorder,
            },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[styles.noticeText, { color: colors.status.warning }]}>
            Upload prescription above before placing order
          </Text>
        </View>
      )}

      {/* ── Delivery unavailable ───────────────────────────── */}
      {deliveryUnavailable && breakdown?.unavailable_reason && (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.status.errorBg,
              borderColor: colors.status.errorBorder,
            },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[styles.noticeText, { color: colors.status.error }]}>
            {breakdown.unavailable_reason}
          </Text>
        </View>
      )}

      {/* ── Action row ─────────────────────────────────────── */}
      <View style={styles.actionRow}>
        <View style={styles.totalBlock}>
          {isQuoteLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={brandColor} />
              <Text
                style={[styles.loadingText, { color: colors.text.muted }]}
              >
                Calculating total...
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[styles.itemCount, { color: colors.text.faint }]}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Text>
              <Text
                style={[styles.totalAmount, { color: colors.text.primary }]}
              >
                {grandTotal > 0 ? `₹${grandTotal.toFixed(2)}` : "—"}
              </Text>
              {hasSavings ? (
                <Text
                  style={[styles.savingsLabel, { color: colors.status.success }]}
                >
                  You saved ₹{totalSavings.toFixed(2)}!
                </Text>
              ) : (
                <Text
                  style={[styles.totalLabel, { color: colors.text.faint }]}
                >
                  incl. all charges
                </Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={isBlocked ? undefined : handlePlaceOrderPress}
          activeOpacity={isBlocked ? 1 : 0.85}
          accessibilityRole="button"
          accessibilityLabel="Place order"
          accessibilityState={{ disabled: isBlocked }}
          style={[
            styles.proceedBtn,
            {
              backgroundColor: isBlocked
                ? colors.border.default
                : brandColor,
            },
            !isBlocked && {
              shadowColor: brandColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            },
            isBlocked && styles.proceedBtnDisabled,
          ]}
        >
          {isQuoteLoading || isPlacing ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.primaryText}
            />
          ) : (
            <Text
              style={[
                styles.proceedBtnText,
                { color: colors.brand.primaryText },
              ]}
            >
              Place Order
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  /* ── Full-bleed nudge ribbon ──────────────────────────── */
  nudge: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
  },
  nudgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  nudgeBold: {
    fontFamily: "Inter_700Bold",
  },

  /* ── Warning / error notices ──────────────────────────── */
  notice: {
    alignItems: "center",
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },

  /* ── Action row ───────────────────────────────────────── */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  totalBlock: {
    gap: 2,
    minWidth: 100,
  },
  itemCount: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  savingsLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 140,
  },
  proceedBtnDisabled: {
    opacity: 0.7,
  },
  proceedBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});