// src/features/orders/screens/ActiveTrackingScreen.tsx
//
// Root coordinator for the live tracking experience.
// Layers: Interactive Map (full screen) + Bottom Sheet (overlay).
// Cleans up live tracking store on unmount.

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme/ThemeContext';
import { useLiveTrackingStore } from '../../../store/liveTrackingStore';
import type { MobileOrderDetail } from '../../../types/order';

import { TrackingMapView } from '../components/tracking/TrackingMapView';
import { TrackingBottomSheet } from '../components/tracking/TrackingBottomSheet';
import { PickupActiveView } from '../components/tracking/PickupActiveView';

interface ActiveTrackingScreenProps {
  order: MobileOrderDetail;
  onBack: () => void;
  onOrderUpdate?: () => void;
}

export function ActiveTrackingScreen({ order, onBack, onOrderUpdate }: ActiveTrackingScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const clearTracking = useLiveTrackingStore((s) => s.clearTracking);

  const isPickup = order.fulfillment_type === 'PICKUP';
  const isSameDay = order.fulfillment_type === 'SAME_DAY';

  useEffect(() => {
    return () => {
      if (!isPickup) clearTracking(order.order_id);
    };
  }, [order.order_id, clearTracking, isPickup]);

  // Pickup orders get a dedicated view (no rider tracking)
  if (isPickup) {
    return (
      <PickupActiveView
        order={order}
        onBack={onBack}
        onOrderUpdate={onOrderUpdate}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Full-screen map — static for Same Day (no rider marker) */}
      <TrackingMapView order={order} isSameDay={isSameDay} />

      {/* Overlay bottom sheet — hides rider card & ETA for Same Day */}
      <TrackingBottomSheet
        order={order}
        onBack={onBack}
        topInset={insets.top}
        isSameDay={isSameDay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});