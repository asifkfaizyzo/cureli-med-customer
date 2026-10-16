// src/features/cart/components/LoyaltyPointsSection.tsx (do not remove this comment)
// cureli-mobile/src/features/cart/components/LoyaltyPointsSection.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { loyaltyApi, LoyaltySummary } from "../../marketplace/api/loyalty.api";
import { useCheckoutStore } from "../../../store/checkoutStore";

export function LoyaltyPointsSection({ subtotal }: { subtotal: number }) {
  const { colors } = useTheme();
  const { loyaltyPointsToRedeem, setLoyaltyPointsToRedeem, breakdown } =
    useCheckoutStore();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await loyaltyApi.getSummary();
        setSummary(res.data.data);
      } catch (err) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <View style={styles.cardOuter}>
        <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              alignItems: "center",
              paddingVertical: 20,
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  // If program is disabled in CAdmin, hide the card completely
  if (!summary || !summary.config.isEnabled) {
    return null;
  }

  // ── 1. Calculate Estimated Points Earned ────────────────────
  const earnRate = summary.config.earnRateAmount || 100;
  const isTotalPayableBasis = (summary.config as any)?.earnBasis !== "SUBTOTAL";

  const couponDiscount = breakdown?.coupon_discount ?? 0;
  const effectiveSubtotal = Math.max(0, subtotal - couponDiscount);

  // If basis is TOTAL_PAYABLE, use grand_total (final payable amount).
  // If quote hasn't loaded yet, fallback to subtotal.
  const earningAmount = isTotalPayableBasis
    ? (breakdown ? breakdown.grand_total : subtotal)
    : effectiveSubtotal;

  const estimatedPointsEarned = Math.floor(earningAmount / earnRate);

  // ── 2. Redemption Eligibility ──────────────────────────────
  const minRedeemPoints = summary.config.minRedeemPoints;
  const minOrderAmount = summary.config.minOrderAmount;
  const hasEnoughPointsToRedeem = summary.balance >= minRedeemPoints;
  const isOrderValueEligible = subtotal >= minOrderAmount;

  const handleToggle = (value: boolean) => {
    if (value) {
      let pointsToRedeem = summary.balance;

      if (summary.config.maxRedeemPoints) {
        pointsToRedeem = Math.min(
          pointsToRedeem,
          summary.config.maxRedeemPoints,
        );
      }

      if (summary.config.maxRedeemPercent) {
        const maxPercentVal =
          (subtotal * summary.config.maxRedeemPercent) / 100;
        const maxPointsPercent = Math.floor(
          maxPercentVal / summary.config.redemptionValue,
        );
        pointsToRedeem = Math.min(pointsToRedeem, maxPointsPercent);
      }

      setLoyaltyPointsToRedeem(pointsToRedeem);
    } else {
      setLoyaltyPointsToRedeem(0);
    }
  };

  const isApplied = loyaltyPointsToRedeem > 0;

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>

        {/* ── Title + Switch ── */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
              <Ionicons name="star" size={14} color={colors.brand.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {hasEnoughPointsToRedeem ? "Use Loyalty Points" : "Cureli Rewards"}
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />
          </View>

          {hasEnoughPointsToRedeem && (
            <Switch
              value={isApplied}
              onValueChange={handleToggle}
              disabled={!isOrderValueEligible}
              trackColor={{
                false: colors.border.default,
                true: colors.brand.primary,
              }}
            />
          )}
        </View>

        {/* ── Redemption Info / Balances ── */}
        {hasEnoughPointsToRedeem ? (
          <>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={14} color={colors.text.muted} />
              <Text style={[styles.desc, { color: colors.text.secondary }]}>
                Available:{" "}
                <Text style={{ fontFamily: "Inter_700Bold", color: colors.text.primary }}>
                  {summary.balance} points
                </Text>{" "}
                (₹{(summary.balance * summary.config.redemptionValue).toFixed(2)} value)
              </Text>
            </View>

            {isApplied && breakdown && breakdown.loyalty_discount > 0 && (
              <View
                style={[
                  styles.accentNotice,
                  {
                    backgroundColor: colors.status.successBg,
                    borderLeftColor: colors.status.success,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.status.success} />
                <Text style={[styles.discountText, { color: colors.status.success }]}>
                  Saving ₹{breakdown.loyalty_discount.toFixed(2)} with{" "}
                  {breakdown.loyalty_points_redeemed} points
                </Text>
              </View>
            )}

            {!isOrderValueEligible && (
              <View
                style={[
                  styles.accentNotice,
                  {
                    backgroundColor: colors.status.errorBg,
                    borderLeftColor: colors.status.error,
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={14} color={colors.status.error} />
                <Text style={[styles.warningText, { color: colors.status.error }]}>
                  Min. item spend of ₹{minOrderAmount} required to redeem points.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.balanceRow}>
            <Ionicons name="wallet-outline" size={14} color={colors.text.muted} />
            <Text style={[styles.desc, { color: colors.text.secondary }]}>
              Current Balance:{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: colors.text.primary }}>
                {summary.balance} pts
              </Text>{" "}
              (Redemption unlocks at {minRedeemPoints} pts)
            </Text>
          </View>
        )}

        {/* ── Estimated Points Earned Badge ── */}
        {estimatedPointsEarned > 0 && (
          <View
            style={[
              styles.earnContainer,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <View style={styles.earnLeft}>
              <View
                style={[
                  styles.earnIconCircle,
                  { backgroundColor: colors.status.successBg },
                ]}
              >
                <Ionicons name="add" size={14} color={colors.status.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.earnTitle, { color: colors.text.primary }]}>
                  Earn{" "}
                  <Text style={{ color: colors.status.success, fontFamily: "Inter_700Bold" }}>
                    +{estimatedPointsEarned} Points
                  </Text>{" "}
                  with this order
                </Text>
                <Text style={[styles.earnSub, { color: colors.text.muted }]}>
                  Credited automatically upon delivery completion
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Card shell with left accent ──
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

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
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

  // ── Balance row ──
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 18,
  },

  // ── Left-accent notices (success / error) ──
  accentNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 10,
  },
  discountText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // ── Earn points container ──
  earnContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 12,
  },
  earnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  earnIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  earnTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  earnSub: {
    fontSize: 10.5,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});