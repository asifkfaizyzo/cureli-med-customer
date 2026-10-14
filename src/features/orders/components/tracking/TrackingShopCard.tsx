// src/features/orders/components/tracking/TrackingShopCard.tsx (do not remove this comment)
//
// Slot D — Compact single-row pharmacy footer.
// Shows pharmacy name, address (truncated gracefully), and action buttons.
// For instant delivery: Call button only.
// For pickup: Call + Navigate buttons.

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

interface TrackingShopCardProps {
  order: MobileOrderDetail;
  showNavigate?: boolean;
}

function toNum(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function TrackingShopCard({ order, showNavigate = false }: TrackingShopCardProps) {
  const { colors } = useTheme();

  const handleCall = useCallback(() => {
    if (order.shop_phone) Linking.openURL(`tel:${order.shop_phone}`);
  }, [order.shop_phone]);

  const handleNavigate = useCallback(() => {
    const lat = toNum(order.branch_latitude);
    const lng = toNum(order.branch_longitude);
    if (lat == null || lng == null) return;

    const scheme = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    if (!scheme) {
      Linking.openURL(fallback);
      return;
    }

    Linking.canOpenURL(scheme)
      .then((supported) => {
        if (supported) return Linking.openURL(scheme);
        return Linking.openURL(fallback);
      })
      .catch(() => Linking.openURL(fallback));
  }, [order.branch_latitude, order.branch_longitude]);

  const shopName = order.shop_name ?? order.branch_name ?? 'Pharmacy Partner';
  const address = order.branch_address;
  const hasCoords =
    toNum(order.branch_latitude) != null && toNum(order.branch_longitude) != null;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.background.tint,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      <Ionicons name="storefront-outline" size={14} color={colors.text.muted} />

      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {shopName}
        </Text>
        {address ? (
          <Text
            style={[styles.address, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {address}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {showNavigate && hasCoords && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                borderColor: colors.border.default,
                backgroundColor: colors.background.card,
              },
            ]}
            onPress={handleNavigate}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={12} color={colors.brand.primary} />
            <Text style={[styles.actionText, { color: colors.brand.primary }]}>
              Go
            </Text>
          </TouchableOpacity>
        )}

        {order.shop_phone && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                borderColor: colors.border.default,
                backgroundColor: colors.background.card,
              },
            ]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={12} color={colors.brand.primary} />
            <Text style={[styles.actionText, { color: colors.brand.primary }]}>
              Call
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  address: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
});