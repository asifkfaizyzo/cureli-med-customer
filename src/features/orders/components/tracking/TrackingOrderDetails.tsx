// src/features/orders/components/tracking/TrackingOrderDetails.tsx (do not remove this comment)
//
// Expandable section revealed when the user pulls the sheet to 72%+.
// Shows: patient tag, prescription thumbnails, medicine items list,
// full price breakdown (coupon, loyalty, fees, tip), and support trigger.

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

interface TrackingOrderDetailsProps {
  order: MobileOrderDetail;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function TrackingOrderDetails({ order }: TrackingOrderDetailsProps) {
  const { colors } = useTheme();

  const hasCoupon =
    order.coupon_code && (order.coupon_discount_amount ?? 0) > 0;
  const hasLoyalty =
    (order.loyalty_points_redeemed ?? 0) > 0 &&
    (order.loyalty_discount_amount ?? 0) > 0;
  
  const hasServiceCharge = (order.service_charge ?? 0) > 0;
  // ── Merge delivery_fee + km_surcharge for consistent display ──
  const combinedDelivery = parseFloat(
    ((order.delivery_fee ?? 0) + (order.km_surcharge ?? 0)).toFixed(2),
  );
  const hasDeliveryFee = combinedDelivery > 0;
  const hasTip = (order.tip ?? 0) > 0;

  // ── Slash Display Anchors ────────────────────────────────────
  const serviceAnchor = order.service_charge_anchor ?? null;
  const deliveryAnchor = order.delivery_charge_anchor ?? null;
  const platformSavings = order.platform_savings ?? 0;
  const isServiceFree = (order.service_charge ?? 0) === 0 && serviceAnchor != null;
  const isDeliveryFree = combinedDelivery === 0 && deliveryAnchor != null;
  
  const isForSomeone =
    order.patient_is_self === false && order.patient_name_snapshot;

  const handleSupport = useCallback(() => {
    router.push({
      pathname: '/support/raise' as any,
      params: { orderId: order.order_id, orderNumber: order.order_number },
    });
  }, [order.order_id, order.order_number]);

  return (
    <View style={styles.container}>
      {/* Patient Tag */}
      {isForSomeone && (
        <View
          style={[
            styles.patientTag,
            {
              backgroundColor: colors.background.accent,
              borderColor: colors.border.brand,
            },
          ]}
        >
          <Ionicons name="person-outline" size={13} color={colors.text.brand} />
          <Text style={[styles.patientText, { color: colors.text.brand }]}>
            Ordering for {order.patient_name_snapshot}
          </Text>
        </View>
      )}

      {/* Prescriptions */}
      {order.prescriptions.length > 0 && (
        <Section title="Prescriptions" colors={colors}>
          <View style={styles.prescriptionRow}>
            {order.prescriptions.map((rx) => (
              <View
                key={rx.prescription_id}
                style={[
                  styles.prescriptionChip,
                  {
                    backgroundColor: colors.background.tint,
                    borderColor: colors.border.default,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={colors.text.muted}
                />
                <Text
                  style={[styles.prescriptionName, { color: colors.text.secondary }]}
                  numberOfLines={1}
                >
                  {rx.original_name}
                </Text>
                {rx.is_expired && (
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.status.warning}
                  />
                )}
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Items */}
      <Section title={`Items (${order.items.length})`} colors={colors}>
        {order.items.map((item) => (
          <View key={item.item_id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {item.medicine_name}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.text.muted }]}>
                {[item.brand, item.pack_size].filter(Boolean).join(' · ')}
              </Text>
              {item.requires_prescription && (
                <View
                  style={[
                    styles.rxTag,
                    { backgroundColor: colors.status.errorBg },
                  ]}
                >
                  <Text style={[styles.rxText, { color: colors.status.error }]}>
                    Rx
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.itemRight}>
              <Text style={[styles.itemQty, { color: colors.text.muted }]}>
                ×{item.quantity}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.text.primary }]}>
                {formatCurrency(item.line_total)}
              </Text>
            </View>
          </View>
        ))}
      </Section>

      {/* Price Breakdown */}
      <Section title="Bill Details" colors={colors}>
        <PriceRow label="Item Total" value={formatCurrency(order.subtotal)} colors={colors} />
        {hasCoupon && (
          <PriceRow
            label={`Coupon (${order.coupon_code})`}
            value={`-${formatCurrency(order.coupon_discount_amount!)}`}
            colors={colors}
            highlight={colors.status.success}
          />
        )}
        {hasLoyalty && (
          <PriceRow
            label={`Loyalty (${order.loyalty_points_redeemed} pts)`}
            value={`-${formatCurrency(order.loyalty_discount_amount!)}`}
            colors={colors}
            highlight={colors.status.success}
          />
        )}
        {(hasServiceCharge || isServiceFree) && (
          <PriceRow
            label="Service Charge"
            value={isServiceFree ? "FREE" : formatCurrency(order.service_charge!)}
            anchorValue={serviceAnchor ? formatCurrency(serviceAnchor) : null}
            colors={colors}
            highlight={isServiceFree ? colors.status.success : undefined}
          />
        )}
        {(hasDeliveryFee || isDeliveryFree) && (
          <PriceRow
            label="Delivery Fee"
            value={isDeliveryFree ? "FREE" : formatCurrency(combinedDelivery)}
            anchorValue={deliveryAnchor ? formatCurrency(deliveryAnchor) : null}
            colors={colors}
            highlight={isDeliveryFree ? colors.status.success : undefined}
          />
        )}
        {platformSavings > 0 && (
          <PriceRow
            label="Platform Promo Savings"
            value={`-${formatCurrency(platformSavings)}`}
            colors={colors}
            highlight={colors.status.success}
          />
        )}
        {hasTip && (
          <PriceRow
            label="Tip"
            value={formatCurrency(order.tip!)}
            colors={colors}
          />
        )}
        <View
          style={[styles.divider, { backgroundColor: colors.border.default }]}
        />
        <PriceRow
          label="Total"
          value={formatCurrency(order.grand_total ?? order.total_amount)}
          colors={colors}
          bold
        />
        {isDeliveryFree && (
          <View style={styles.promoNotice}>
            <Text style={[styles.promoText, { color: colors.status.success }]}>
              🎉 You earned free delivery on this order!
            </Text>
          </View>
        )}
        {isServiceFree && (
          <View style={styles.promoNotice}>
            <Text style={[styles.promoText, { color: colors.status.success }]}>
              🎉 Platform fee was waived for this order!
            </Text>
          </View>
        )}
        {order.loyalty_points_earned != null && order.loyalty_points_earned > 0 && (
          <View style={styles.earnedRow}>
            <Ionicons name="gift-outline" size={13} color={colors.status.success} />
            <Text style={[styles.earnedText, { color: colors.status.success }]}>
              You earned {order.loyalty_points_earned} loyalty points!
            </Text>
          </View>
        )}
      </Section>

      {/* Payment Method */}
      <View style={styles.paymentRow}>
        <Ionicons
          name={order.payment_method === 'COD' ? 'cash-outline' : 'card-outline'}
          size={14}
          color={colors.text.muted}
        />
        <Text style={[styles.paymentText, { color: colors.text.muted }]}>
          {order.payment_method === 'COD'
            ? 'Cash on Delivery'
            : order.payment_method}
          {order.payment_status && ` · ${order.payment_status}`}
        </Text>
      </View>

      {/* Support Button */}
      <TouchableOpacity
        style={[
          styles.supportBtn,
          {
            backgroundColor: colors.background.tint,
            borderColor: colors.border.default,
          },
        ]}
        onPress={handleSupport}
        activeOpacity={0.7}
      >
        <Ionicons name="help-circle-outline" size={16} color={colors.brand.primary} />
        <Text style={[styles.supportText, { color: colors.brand.primary }]}>
          Need help with this order?
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.faint }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function PriceRow({
  label,
  value,
  anchorValue,
  colors,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  anchorValue?: string | null;
  colors: any;
  bold?: boolean;
  highlight?: string;
}) {
  return (
    <View style={styles.priceRow}>
      <Text
        style={[
          styles.priceLabel,
          {
            color: bold ? colors.text.primary : colors.text.secondary,
            fontFamily: bold ? 'Inter_700Bold' : 'Inter_400Regular',
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.priceValueContainer}>
        {anchorValue && (
          <Text style={[styles.priceAnchor, { color: colors.text.faint }]}>
            {anchorValue}
          </Text>
        )}
        <Text
          style={[
            styles.priceValue,
            {
              color: highlight || (bold ? colors.text.primary : colors.text.secondary),
              fontFamily: bold ? 'Inter_700Bold' : 'Inter_500Medium',
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
  },
  patientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  patientText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  // Prescriptions
  prescriptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prescriptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '48%',
  },
  prescriptionName: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 17,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  rxTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  rxText: {
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemQty: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceAnchor: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  priceValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  earnedText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  // Payment
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  // Support
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  supportText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  promoNotice: {
    marginTop: 4,
  },
  promoText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});