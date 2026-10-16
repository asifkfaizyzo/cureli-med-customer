// src/features/cart/components/BillDetailsCard.tsx (do not remove this comment)
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCheckoutStore } from '../../../store/checkoutStore';

const TIP_PRESETS = [0, 10, 20, 50];

// ── Dashed divider rendered as a row of small dashes ──────────
function DashedDivider({ color }: { color: string }) {
  return (
    <View style={styles.dashedWrap}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View
          key={i}
          style={[styles.dash, { backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

// ── Small inline icon for row labels ──────────────────────────
function RowIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <Ionicons
      name={name}
      size={13}
      color={color}
      style={{ marginRight: 6 }}
    />
  );
}

// ── Section micro-label ───────────────────────────────────────
function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
  );
}

function BillRow({
  label,
  value,
  anchorValue = null,
  isTotal = false,
  isFree = false,
  dim = false,
  isDiscount = false,
  iconName,
  iconColor,
  zebra = false,
}: {
  label: string;
  value: string;
  anchorValue?: string | null;
  isTotal?: boolean;
  isFree?: boolean;
  dim?: boolean;
  isDiscount?: boolean;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  zebra?: boolean;
}) {
  const { colors } = useTheme();

  const rowStyle = [
    styles.row,
    zebra && {
      backgroundColor: colors.background.tint,
      paddingHorizontal: 8,
      marginHorizontal: -8,
      borderRadius: 6,
    },
  ];

  return (
    <View style={rowStyle}>
      <View style={styles.labelWrap}>
        {iconName && (
          <RowIcon
            name={iconName}
            color={iconColor ?? (isDiscount ? colors.status.success : colors.text.muted)}
          />
        )}
        <Text
          style={[
            isTotal ? styles.totalLabel : styles.label,
            {
              color: isDiscount
                ? colors.status.success
                : dim
                  ? colors.text.faint
                  : isTotal
                    ? colors.text.primary
                    : colors.text.secondary,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.valueContainer}>
        {anchorValue && (
          <Text style={[styles.anchorValue, { color: colors.text.faint }]}>
            {anchorValue}
          </Text>
        )}
        <Text
          style={[
            isTotal ? styles.totalValue : styles.value,
            {
              color: isDiscount || isFree ? colors.status.success : colors.text.primary,
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── Loading skeleton row ──────────────────────────────────────
function SkeletonRow({ widthPct, color }: { widthPct: number; color: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.skeletonRow}>
      <Animated.View
        style={[
          styles.skeletonBar,
          { width: `${widthPct}%`, backgroundColor: color },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonBar,
          { width: 48, backgroundColor: color },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function BillDetailsCard() {
  const { colors } = useTheme();
  const { breakdown, isQuoteLoading, tip, setTip, fulfillmentType } = useCheckoutStore();

  // ── Card shell with left accent bar ──
  const CardShell = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.cardOuter}>
      <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        {children}
      </View>
    </View>
  );

  // ── Title block with icon ──
  const TitleBlock = () => (
    <View style={styles.titleRow}>
      <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
        <Ionicons name="receipt-outline" size={14} color={colors.brand.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>Bill Details</Text>
      <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />
    </View>
  );

  if (!breakdown && isQuoteLoading) {
    return (
      <CardShell>
        <TitleBlock />
        <View style={{ marginTop: 4 }}>
          <SkeletonRow widthPct={55} color={colors.background.tint} />
          <SkeletonRow widthPct={40} color={colors.background.tint} />
          <SkeletonRow widthPct={48} color={colors.background.tint} />
          <SkeletonRow widthPct={35} color={colors.background.tint} />
        </View>
      </CardShell>
    );
  }

  if (!breakdown) return null;

  const isPickup = fulfillmentType === 'PICKUP';

  // ── Combine delivery charges for legacy compatibility & visual merge ──
  const combinedDelivery = breakdown.delivery_fee + (breakdown.km_surcharge || 0);

  // Pickup orders always show delivery as FREE
  const isDeliveryFree =
    isPickup ||
    (combinedDelivery === 0 && !!breakdown.delivery_charge_anchor);
  const isServiceFree = breakdown.service_charge === 0 && !!breakdown.service_charge_anchor;

  const packingCharge = breakdown.packing_charge || 0;

  // ── Determine if savings group exists ──
  const hasSavings =
    breakdown.coupon_discount > 0 ||
    breakdown.loyalty_discount > 0 ||
    (breakdown.platform_savings !== undefined && breakdown.platform_savings > 0);

  return (
    <CardShell>
      <TitleBlock />

      {/* ── CHARGES SECTION ── */}
      <SectionLabel label="CHARGES" color={colors.text.faint} />

      <BillRow
        label="Items total"
        value={`₹${breakdown.subtotal.toFixed(2)}`}
        iconName="cube-outline"
      />

      {/* ── Service Charge Row ── */}
      <BillRow
        label="Service charge"
        value={isServiceFree ? 'FREE' : `₹${breakdown.service_charge.toFixed(2)}`}
        anchorValue={breakdown.service_charge_anchor ? `₹${breakdown.service_charge_anchor.toFixed(2)}` : null}
        isFree={isServiceFree}
        iconName="briefcase-outline"
        zebra
      />

      {/* ── Merged Delivery Row (always shown — FREE for pickup) ── */}
      <BillRow
        label={isPickup ? 'Delivery fee (Pickup)' : 'Delivery fee'}
        value={isDeliveryFree ? 'FREE' : `₹${combinedDelivery.toFixed(2)}`}
        anchorValue={!isPickup && breakdown.delivery_charge_anchor ? `₹${breakdown.delivery_charge_anchor.toFixed(2)}` : null}
        isFree={isDeliveryFree}
        iconName={isPickup ? 'storefront-outline' : 'bicycle-outline'}
      />

      {/* ── Packing Charge (only when > 0) ── */}
      {packingCharge > 0 && (
        <BillRow
          label="Packing charge"
          value={`₹${packingCharge.toFixed(2)}`}
          iconName="cube-outline"
          zebra
        />
      )}

      {/* ── SAVINGS SECTION ── */}
      {hasSavings && (
        <>
          <View style={{ height: 8 }} />
          <SectionLabel label="SAVINGS" color={colors.status.success} />
        </>
      )}

      {/* ── Coupons ── */}
      {breakdown.coupon_discount > 0 && (
        <BillRow
          label={`Coupon (${breakdown.coupon_code})`}
          value={`-₹${breakdown.coupon_discount.toFixed(2)}`}
          isDiscount
          iconName="pricetag-outline"
        />
      )}

      {/* ── Loyalty Points ── */}
      {breakdown.loyalty_discount > 0 && (
        <BillRow
          label={`Loyalty Points (-${breakdown.loyalty_points_redeemed} pts)`}
          value={`-₹${breakdown.loyalty_discount.toFixed(2)}`}
          isDiscount
          iconName="star-outline"
          zebra
        />
      )}

      {/* ── Platform Savings Row ── */}
      {breakdown.platform_savings !== undefined && breakdown.platform_savings > 0 && (
        <BillRow
          label="Total Savings"
          value={`-₹${breakdown.platform_savings.toFixed(2)}`}
          isDiscount
          iconName="trending-down-outline"
        />
      )}

      {/* ── Tip selector (hidden for pickup — no rider) ── */}
      {!isPickup && (
        <View
          style={[
            styles.tipContainer,
            {
              borderColor: colors.border.subtle,
              backgroundColor: colors.background.tint,
            },
          ]}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="heart-outline" size={14} color={colors.brand.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: colors.text.primary }]}>
                Tip your rider
              </Text>
              <Text style={[styles.tipSub, { color: colors.text.muted }]}>
                100% goes to the delivery partner
              </Text>
            </View>
          </View>
          <View style={styles.tipOptions}>
            {TIP_PRESETS.map((preset) => {
              const selected = tip === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setTip(preset)}
                  activeOpacity={0.8}
                  style={[
                    styles.tipBtn,
                    {
                      backgroundColor: selected ? colors.brand.primary : colors.background.card,
                      borderColor: selected ? colors.brand.primary : colors.border.default,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tipBtnText,
                      { color: selected ? '#fff' : colors.text.secondary },
                    ]}
                  >
                    {preset === 0 ? 'None' : `₹${preset}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {!isPickup && tip > 0 && (
        <BillRow
          label="Tip"
          value={`₹${tip.toFixed(2)}`}
          iconName="heart"
          iconColor={colors.brand.primary}
        />
      )}

      <DashedDivider color={colors.border.default} />

      {/* ── Grand Total — highlighted band ── */}
      <View
        style={[
          styles.totalBand,
          {
            backgroundColor: colors.background.tint,
            borderColor: colors.brand.primary + '22',
          },
        ]}
      >
        <View style={styles.labelWrap}>
          <Ionicons
            name="wallet-outline"
            size={16}
            color={colors.brand.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.grandTotalLabel, { color: colors.text.primary }]}>
            Grand Total
          </Text>
        </View>
        <Text style={[styles.grandTotalValue, { color: colors.brand.primary }]}>
          ₹{breakdown.grand_total.toFixed(2)}
        </Text>
      </View>

      {/* ── Promotional Earning Badges — left accent bar style ── */}
      {isDeliveryFree && (
        <View
          style={[
            styles.promoNotice,
            {
              backgroundColor: colors.status.successBg,
              borderLeftColor: colors.status.success,
            },
          ]}
        >
          <Ionicons name="gift-outline" size={14} color={colors.status.success} />
          <Text style={[styles.promoNoticeText, { color: colors.status.success }]}>
            You earned free delivery on this order!
          </Text>
        </View>
      )}

      {isServiceFree && (
        <View
          style={[
            styles.promoNotice,
            {
              backgroundColor: colors.status.successBg,
              borderLeftColor: colors.status.success,
              marginTop: 6,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={14} color={colors.status.success} />
          <Text style={[styles.promoNoticeText, { color: colors.status.success }]}>
            Platform fee waived for this order!
          </Text>
        </View>
      )}
    </CardShell>
  );
}

const styles = StyleSheet.create({
  // ── Card shell with left accent ──
  cardOuter: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#090025',
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

  // ── Title ──
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  titleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  titleUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.08,
    marginLeft: 4,
  },

  // ── Section micro-label ──
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 2,
  },

  // ── Rows ──
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    marginBottom: 1,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anchorValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },

  // ── Dashed divider ──
  dashedWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    overflow: 'hidden',
  },
  dash: {
    width: 4,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.5,
  },

  // ── Tip section (contained) ──
  tipContainer: {
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  tipSub: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tipBtn: {
    flex: 1,
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tipBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Grand total band ──
  totalBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },

  // ── Promo notices (left accent style) ──
  promoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 10,
  },
  promoNoticeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },

  // ── Skeleton loading ──
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  skeletonBar: {
    height: 11,
    borderRadius: 6,
  },
});