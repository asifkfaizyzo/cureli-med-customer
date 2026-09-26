// src/features/orders/components/tracking/TrackingDelayBanner.tsx
//
// Dynamic, context-aware delay banner pinned at the top of the bottom sheet.
// Detects which stage is delayed and shows the appropriate action:
//   - Pharmacy delay → Call Pharmacy
//   - Rider assignment delay → Contact Support
//   - Rider transit delay → Call Rider
// Dismissible for the current session.

import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

interface TrackingDelayBannerProps {
  order: MobileOrderDetail;
}

interface DelayConfig {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

// Thresholds in milliseconds
const PHARMACY_ACCEPT_TIMEOUT = 180_000;      // 3 min
const PREPARATION_TIMEOUT = 600_000;          // 10 min
const RIDER_ASSIGN_TIMEOUT = 300_000;         // 5 min
const RIDER_PICKUP_TIMEOUT = 480_000;         // 8 min since assigned

export function TrackingDelayBanner({ order }: TrackingDelayBannerProps) {
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  const delayConfig = useMemo<DelayConfig | null>(() => {
    const now = Date.now();
    const status = order.status;
    const ds = order.delivery?.status;

    // 1. Pharmacy hasn't accepted yet
    if (status === 'PLACED') {
      const elapsed = now - new Date(order.placed_at).getTime();
      if (elapsed > PHARMACY_ACCEPT_TIMEOUT && order.shop_phone) {
        return {
          message: 'Pharmacy is taking longer than usual to confirm',
          actionLabel: 'Call Pharmacy',
          onAction: () => Linking.openURL(`tel:${order.shop_phone}`),
        };
      }
    }

    // 2. Preparation taking too long
    if (status === 'ACCEPTED' && (!ds || ds === 'PENDING_ASSIGNMENT')) {
      if (order.accepted_at) {
        const elapsed = now - new Date(order.accepted_at).getTime();
        if (elapsed > PREPARATION_TIMEOUT && order.shop_phone) {
          return {
            message: 'Preparation is taking a bit longer than expected',
            actionLabel: 'Call Pharmacy',
            onAction: () => Linking.openURL(`tel:${order.shop_phone}`),
          };
        }
      }
    }

    // 3. Rider assignment delayed
    if (status === 'READY_FOR_PICKUP' && (!ds || ds === 'PENDING_ASSIGNMENT')) {
      if (order.ready_at) {
        const elapsed = now - new Date(order.ready_at).getTime();
        if (elapsed > RIDER_ASSIGN_TIMEOUT) {
          return {
            message: 'Finding a delivery partner is taking longer',
            actionLabel: 'Contact Support',
            onAction: () =>
              router.push({
                pathname: '/support/raise' as any,
                params: {
                  orderId: order.order_id,
                  orderNumber: order.order_number,
                },
              }),
          };
        }
      }
    }

    // 4. Rider notified but hasn't picked up in too long
    if (
      ds === 'RIDER_NOTIFIED' ||
      ds === 'ACCEPTED' ||
      ds === 'ARRIVED_AT_PHARMACY'
    ) {
      const assignedAt = order.delivery?.timestamps?.assigned_at;
      if (assignedAt) {
        const elapsed = now - new Date(assignedAt).getTime();
        if (elapsed > RIDER_PICKUP_TIMEOUT && order.delivery?.rider?.phone) {
          return {
            message: 'Rider seems to be delayed at the pharmacy',
            actionLabel: 'Call Rider',
            onAction: () =>
              Linking.openURL(`tel:${order.delivery!.rider!.phone}`),
          };
        }
      }
    }

    return null;
  }, [
    order.status,
    order.delivery?.status,
    order.placed_at,
    order.accepted_at,
    order.ready_at,
    order.delivery?.timestamps?.assigned_at,
    order.shop_phone,
    order.delivery?.rider?.phone,
    order.order_id,
    order.order_number,
  ]);

  const handleDismiss = useCallback(() => setDismissed(true), []);

  if (!delayConfig || dismissed) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.banner,
        {
          backgroundColor: colors.status.warningBg,
          borderColor: colors.status.warningBorder,
        },
      ]}
    >
      <View style={styles.left}>
        <Ionicons name="alert-circle" size={15} color={colors.status.warning} />
        <Text
          style={[styles.message, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {delayConfig.message}
        </Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.status.warning }]}
          onPress={delayConfig.onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{delayConfig.actionLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.5}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#16044d',
  },
});