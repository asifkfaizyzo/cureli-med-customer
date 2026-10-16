// src/features/cart/components/StickyCheckoutBar.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

  // Local idempotency click-shielding state
  const [localPlacing, setLocalPlacing] = useState(false);

  const items = useCartStore((s) => s.items);
  const tempFiles = usePrescriptionStore((s) => s.tempFiles);
  const breakdown = useCheckoutStore((s) => s.breakdown);
  const isQuoteLoading = useCheckoutStore((s) => s.isQuoteLoading);

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

  // Determine active loading/placing state (combination of local shielding + parent controller)
  const isPlacing = isPlacingProp || localPlacing;

  // Disable button if missing metadata, quote is loading, or order submission is already active
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

  // Idempotent click-shield handler
  const handlePlaceOrderPress = async () => {
    if (isBlocked) return;

    console.log(
      "[Cart Checkout] Place Order pressed. Activating click-shield locks.",
    );
    setLocalPlacing(true);

    try {
      // Execute the order placement (supporting both synchronous and asynchronous actions)
      await onPlaceOrder();
    } catch (error) {
      console.warn("[Cart Checkout] Place Order failed.", error);
    } finally {
      // Always unlock the button so cancellations, alerts, or failures restore interactivity
      setLocalPlacing(false);
    }
  };

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
      {prescriptionBlocked && (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.status.warningBg,
              borderLeftColor: colors.status.warning,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={colors.status.warning}
          />
          <Text
            style={[styles.noticeText, { color: colors.status.warning }]}
          >
            Upload prescription above before placing order
          </Text>
        </View>
      )}

      {deliveryUnavailable && breakdown?.unavailable_reason && (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.status.errorBg,
              borderLeftColor: colors.status.error,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={colors.status.error}
          />
          <Text
            style={[styles.noticeText, { color: colors.status.error }]}
          >
            {breakdown.unavailable_reason}
          </Text>
        </View>
      )}

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
                <View style={styles.subLabelRow}>
                  <Ionicons
                    name="trending-down-outline"
                    size={10}
                    color={colors.status.success}
                  />
                  <Text
                    style={[
                      styles.savingsLabel,
                      { color: colors.status.success },
                    ]}
                  >
                    You Saved ₹{totalSavings.toFixed(2)} !!
                  </Text>
                </View>
              ) : (
                <View style={styles.subLabelRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={10}
                    color={colors.text.faint}
                  />
                  <Text
                    style={[styles.totalLabel, { color: colors.text.faint }]}
                  >
                    incl. all charges
                  </Text>
                </View>
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
            <>
              <Text
                style={[
                  styles.proceedBtnText,
                  { color: colors.brand.primaryText },
                ]}
              >
                Place Order
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.brand.primaryText}
              />
            </>
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
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  noticeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
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
  subLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
    gap: 8,
    paddingHorizontal: 22,
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