// src/features/cart/components/BillDetailsCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCheckoutStore } from '../../../store/checkoutStore';

const TIP_PRESETS = [0, 10, 20, 50];

function BillRow({
  label,
  value,
  anchorValue = null,
  isTotal = false,
  isFree = false,
  dim = false,
  isDiscount = false,
}: {
  label:    string;
  value:    string;
  anchorValue?: string | null;
  isTotal?: boolean;
  isFree?:  boolean;
  dim?:     boolean;
  isDiscount?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[
        isTotal ? styles.totalLabel : styles.label,
        { color: isDiscount ? colors.status.success : dim ? colors.text.faint : isTotal ? colors.text.primary : colors.text.secondary },
      ]}>
        {label}
      </Text>
      
      <View style={styles.valueContainer}>
        {anchorValue && (
          <Text style={[styles.anchorValue, { color: colors.text.faint }]}>
            {anchorValue}
          </Text>
        )}
        <Text style={[
          isTotal ? styles.totalValue : styles.value,
          { color: isDiscount || isFree ? colors.status.success : colors.text.primary },
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function BillDetailsCard() {
  const { colors } = useTheme();
  const { breakdown, isQuoteLoading, tip, setTip } = useCheckoutStore();

  if (!breakdown && isQuoteLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Bill details</Text>
        <Text style={[styles.loading, { color: colors.text.muted }]}>Calculating…</Text>
      </View>
    );
  }

  if (!breakdown) return null;

  // ── Combine delivery charges for legacy compatibility & visual merge ──
  const combinedDelivery = breakdown.delivery_fee + (breakdown.km_surcharge || 0);

  // Check if either platform fee is free (actual is 0 but we have a slash)
  const isDeliveryFree = combinedDelivery === 0 && !!breakdown.delivery_charge_anchor;
  const isServiceFree = breakdown.service_charge === 0 && !!breakdown.service_charge_anchor;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Bill details</Text>

      <BillRow label="Items total" value={`₹${breakdown.subtotal.toFixed(2)}`} />
      
      {/* ── Coupons ── */}
      {breakdown.coupon_discount > 0 && (
        <BillRow label={`Coupon Promo Code (${breakdown.coupon_code})`} value={`-₹${breakdown.coupon_discount.toFixed(2)}`} isDiscount />
      )}

      {/* ── Loyalty Points ── */}
      {breakdown.loyalty_discount > 0 && (
        <BillRow label={`Loyalty Points (-${breakdown.loyalty_points_redeemed} pts)`} value={`-₹${breakdown.loyalty_discount.toFixed(2)}`} isDiscount />
      )}

      {/* ── Service Charge Row ── */}
      <BillRow 
        label="Service charge" 
        value={isServiceFree ? "FREE" : `₹${breakdown.service_charge.toFixed(2)}`} 
        anchorValue={breakdown.service_charge_anchor ? `₹${breakdown.service_charge_anchor.toFixed(2)}` : null}
        isFree={isServiceFree}
      />

      {/* ── Merged Delivery Row ── */}
      <BillRow 
        label="Delivery fee" 
        value={isDeliveryFree ? "FREE" : `₹${combinedDelivery.toFixed(2)}`} 
        anchorValue={breakdown.delivery_charge_anchor ? `₹${breakdown.delivery_charge_anchor.toFixed(2)}` : null}
        isFree={isDeliveryFree}
      />

      {/* ── Platform Savings Row ── */}
      {breakdown.platform_savings !== undefined && breakdown.platform_savings > 0 && (
        <BillRow 
          label="Platform Promo Savings" 
          value={`-₹${breakdown.platform_savings.toFixed(2)}`} 
          isDiscount 
        />
      )}

      {/* ── Tip selector ── */}
      <View style={styles.tipRow}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Tip for rider</Text>
        <View style={styles.tipOptions}>
          {TIP_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => setTip(preset)}
              style={[
                styles.tipBtn,
                {
                  backgroundColor: tip === preset ? colors.brand.primary : colors.background.tint,
                  borderColor:     tip === preset ? colors.brand.primary : colors.border.default,
                },
              ]}
            >
              <Text style={[
                styles.tipBtnText,
                { color: tip === preset ? '#fff' : colors.text.secondary },
              ]}>
                {preset === 0 ? 'None' : `₹${preset}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tip > 0 && (
        <BillRow label="Tip" value={`₹${tip.toFixed(2)}`} />
      )}

      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      <BillRow
        label="Grand Total"
        value={`₹${breakdown.grand_total.toFixed(2)}`}
        isTotal
      />

      {/* ── Promotional Earning Badges ── */}
      {isDeliveryFree && (
        <View style={[styles.promoNotice, { backgroundColor: colors.status.successBg }]}>
          <Text style={[styles.promoNoticeText, { color: colors.status.success }]}>
            🎉 You earned free delivery on this order!
          </Text>
        </View>
      )}

      {isServiceFree && (
        <View style={[styles.promoNotice, { backgroundColor: colors.status.successBg, marginTop: 6 }]}>
          <Text style={[styles.promoNoticeText, { color: colors.status.success }]}>
            🎉 Platform fee waived for this order!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.md,
  },
  loading: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anchorValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  tipRow: {
    marginBottom: Spacing.sm,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tipBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  promoNotice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: Spacing.xs,
  },
  promoNoticeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});