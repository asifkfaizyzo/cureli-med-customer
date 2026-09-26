// src/features/orders/components/tracking/TrackingShopCard.tsx
//
// Slot D — Compact single-row pharmacy footer.
// Shows pharmacy name, address (truncated gracefully), and call button.

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

interface TrackingShopCardProps {
  order: MobileOrderDetail;
}

export function TrackingShopCard({ order }: TrackingShopCardProps) {
  const { colors } = useTheme();

  const handleCall = useCallback(() => {
    if (order.shop_phone) Linking.openURL(`tel:${order.shop_phone}`);
  }, [order.shop_phone]);

  const shopName = order.shop_name ?? order.branch_name ?? 'Pharmacy Partner';
  const address = order.branch_address;

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

      {order.shop_phone && (
        <TouchableOpacity
          style={[
            styles.callBtn,
            {
              borderColor: colors.border.default,
              backgroundColor: colors.background.card,
            },
          ]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={12} color={colors.brand.primary} />
          <Text style={[styles.callText, { color: colors.brand.primary }]}>
            Call
          </Text>
        </TouchableOpacity>
      )}
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
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  callText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
});