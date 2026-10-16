// src/features/orders/components/tracking/TrackingBottomSheet.tsx
//
// Main bottom sheet composition for live tracking.
// Three snap points: collapsed (36%), half (72%), full (94%).
//
// Collapsed: DelayBanner → StatusHero → RiderCard → ShopRow
// Expanded:  + OrderDetails (items, prices, prescriptions, support)

import React, { useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

import { TrackingStatusHero } from './TrackingStatusHero';
import { TrackingDelayBanner } from './TrackingDelayBanner';
import { TrackingRiderCard } from './TrackingRiderCard';
import { TrackingShopCard } from './TrackingShopCard';
import { TrackingOrderDetails } from './TrackingOrderDetails';

interface TrackingBottomSheetProps {
  order: MobileOrderDetail;
  onBack: () => void;
  topInset: number;
  isSameDay?: boolean;
}

export function TrackingBottomSheet({ order, onBack, topInset, isSameDay = false }: TrackingBottomSheetProps) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['36%', '72%', '94%'], []);

  const handleStateChange = useCallback((index: number) => {
    if (index >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSupport = useCallback(() => {
    router.push({
      pathname: '/support/raise' as any,
      params: { orderId: order.order_id, orderNumber: order.order_number },
    });
  }, [order.order_id, order.order_number]);

  return (
    <>
      {/* Floating top bar: back + support */}
      <View style={[styles.topBar, { top: topInset + 8 }]}>
        <TouchableOpacity
          style={[styles.topBtn, { backgroundColor: colors.background.card }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topBtn, { backgroundColor: colors.background.card }]}
          onPress={handleSupport}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        onChange={handleStateChange}
        backgroundStyle={{ backgroundColor: colors.background.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border.default }}
      >
        <BottomSheetView style={styles.sheetRoot}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Slot A: Status Hero (ETA + dual status + OTP) */}
            <TrackingStatusHero order={order} />

            {/* Delay Banner (context-aware, dismissible) */}
            <TrackingDelayBanner order={order} />

            {/* Slot B: Rider Card (skip for Same Day — batch delivery, no rider info) */}
            {isSameDay ? (
              <View
                style={[
                  styles.sameDayBatchBanner,
                  { backgroundColor: '#0891b214', borderColor: '#0891b230' },
                ]}
              >
                <Ionicons name="cube-outline" size={18} color="#0891b2" />
                <Text
                  style={[
                    styles.sameDayBatchText,
                    { color: '#0891b2' },
                  ]}
                  numberOfLines={2}
                >
                  Batch delivery - your order is grouped with others for efficient Same Day delivery.
                </Text>
              </View>
            ) : (
              <TrackingRiderCard
                rider={order.delivery?.rider}
                deliveryStatus={order.delivery?.status}
              />
            )}

            {/* Slot D: Compact Shop Row */}
            <TrackingShopCard order={order} />

            {/* Expanded Section: Order Details */}
            <View style={styles.expandedSection}>
              <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />
              <TrackingOrderDetails order={order} />
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sheetRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  expandedSection: {
    gap: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  sameDayBatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sameDayBatchText: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 17,
  },
});