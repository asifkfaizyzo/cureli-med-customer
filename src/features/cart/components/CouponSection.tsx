// src/features/cart/components/CouponSection.tsx (do not remove this comment)
// src/features/cart/components/CouponSection.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCheckoutStore } from "../../../store/checkoutStore";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { couponsApi } from "../../marketplace/api/coupons.api";

export function CouponSection({ subtotal }: { subtotal: number }) {
  const { colors } = useTheme();
  const { couponCode, setCouponCode } = useCheckoutStore();

  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await couponsApi.validateCoupon({
        code: inputCode.trim(),
        subtotal,
      });

      if (res.data?.data?.valid) {
        setCouponCode(res.data.data.coupon.code);
        setError(null);
      } else {
        setError(res.data?.data?.reason || "Invalid coupon code");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid coupon code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCouponCode(null);
    setInputCode("");
    setError(null);
  };

  return (
    <View style={styles.cardOuter}>
      <View
        style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]}
      />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View
            style={[
              styles.titleIconWrap,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={colors.brand.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Promo Codes
          </Text>
          <View
            style={[
              styles.titleUnderline,
              { backgroundColor: colors.brand.primary },
            ]}
          />
        </View>

        {couponCode ? (
          /* ── Applied state ── */
          <View
            style={[
              styles.appliedRow,
              {
                backgroundColor: colors.status.successBg,
                borderLeftColor: colors.status.success,
              },
            ]}
          >
            <View style={styles.appliedLeft}>
              <View
                style={[
                  styles.appliedBadge,
                  { backgroundColor: colors.status.success },
                ]}
              >
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.appliedCode, { color: colors.status.success }]}
                >
                  {couponCode}
                </Text>
                <Text
                  style={[
                    styles.appliedLabel,
                    { color: colors.status.success },
                  ]}
                >
                  Applied successfully
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleRemove}
              activeOpacity={0.7}
              style={styles.removeBtn}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Input state ── */
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: error
                  ? colors.status.errorBorder
                  : colors.border.subtle,
                backgroundColor: colors.background.tint,
              },
            ]}
          >
            <View style={styles.inputRow}>
              <View
                style={[
                  styles.inputIconWrap,
                  { backgroundColor: colors.background.card },
                ]}
              >
                <Ionicons
                  name="ticket-outline"
                  size={16}
                  color={colors.text.muted}
                />
              </View>
              <TextInput
                placeholder="Enter coupon code"
                placeholderTextColor={colors.text.faint}
                value={inputCode}
                onChangeText={(txt) => setInputCode(txt.toUpperCase())}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                    backgroundColor: colors.background.card,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={handleApply}
                disabled={loading || !inputCode.trim()}
                style={[
                  styles.applyBtn,
                  {
                    backgroundColor:
                      loading || !inputCode.trim()
                        ? colors.text.disabled
                        : colors.brand.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View
                style={[
                  styles.errorRow,
                  {
                    backgroundColor: colors.status.errorBg,
                    borderLeftColor: colors.status.error,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={13}
                  color={colors.status.error}
                />
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {error}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  leftAccent: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  card: {
    flex: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 16,
    paddingLeft: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 8,
  },
  titleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  titleUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.08,
    marginLeft: 4,
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  appliedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  appliedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedCode: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  appliedLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
    opacity: 0.8,
  },
  removeBtn: {
    padding: 4,
  },
  inputContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputIconWrap: {
    width: 36,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
});
