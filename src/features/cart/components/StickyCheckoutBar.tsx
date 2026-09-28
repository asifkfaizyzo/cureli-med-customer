// src/features/cart/components/StickyCheckoutBar.tsx (do not remove this comment)

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
import { useTheme } from "../../../theme/ThemeContext";
import { useAddresses } from "../../profile/hooks/useAddresses";

interface StickyCheckoutBarProps {
  onPlaceOrder: () => void | Promise<void>;
  isPlacing?: boolean; // Allows the parent component/store to explicitly control loading state
}

export function StickyCheckoutBar({
  onPlaceOrder,
  isPlacing: isPlacingProp,
}: StickyCheckoutBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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

  // Idempotent click-shield handler
  const handlePlaceOrderPress = async () => {
    if (isBlocked) return;

    console.log(
      "🔒 [Cart Checkout] Place Order pressed. Activating click-shield locks.",
    );
    setLocalPlacing(true);

    try {
      // Execute the order placement (supporting both synchronous and asynchronous actions)
      await onPlaceOrder();
    } catch (error) {
      console.warn(
        "⚠️ [Cart Checkout] Place Order failed. Releasing click-shield locks.",
        error,
      );
      // Unlock if error occurs so the customer can correct the payment/address and retry
      setLocalPlacing(false);
    }
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border.default,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {prescriptionBlocked && (
        <View
          style={[styles.notice, { backgroundColor: colors.status.warningBg }]}
        >
          <MaterialIcons
            name="assignment"
            size={13}
            color={colors.status.warning}
          />
          <Text
            style={[
              styles.noticeText,
              { color: colors.status.warning, fontFamily: "Inter_500Medium" },
            ]}
          >
            Upload prescription above before placing order
          </Text>
        </View>
      )}

      {deliveryUnavailable && breakdown?.unavailable_reason && (
        <View
          style={[styles.notice, { backgroundColor: colors.status.errorBg }]}
        >
          <MaterialIcons
            name="location-off"
            size={13}
            color={colors.status.error}
          />
          <Text
            style={[
              styles.noticeText,
              { color: colors.status.error, fontFamily: "Inter_500Medium" },
            ]}
          >
            {breakdown.unavailable_reason}
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <View style={styles.totalBlock}>
          {isQuoteLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={[styles.loadingText, { color: colors.text.muted }]}>
                Calculating...
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[styles.totalAmount, { color: colors.text.primary }]}
              >
                {grandTotal > 0 ? `₹${grandTotal.toFixed(2)}` : "—"}
              </Text>
              <Text style={[styles.totalLabel, { color: colors.text.muted }]}>
                incl. all charges
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={isBlocked ? undefined : handlePlaceOrderPress}
          activeOpacity={isBlocked ? 1 : 0.85}
          accessibilityRole="button"
          style={[
            styles.proceedBtn,
            { backgroundColor: colors.brand.primary },
            isBlocked && styles.proceedBtnDisabled,
          ]}
        >
          {isQuoteLoading || isPlacing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.proceedBtnText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
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
    borderTopWidth: 1,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  totalBlock: {
    gap: 2,
    minWidth: 100,
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
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
  },
  proceedBtnDisabled: { opacity: 0.4 },
  proceedBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});
