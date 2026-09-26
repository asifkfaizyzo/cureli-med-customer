// src/features/orders/screens/ActiveTrackingScreen.tsx
//
// Root coordinator for the live tracking experience.
// Layers: Interactive Map (full screen) + Bottom Sheet (overlay).
// Cleans up live tracking store on unmount.

import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme/ThemeContext';
import { useLiveTrackingStore } from '../../../store/liveTrackingStore';
import type { MobileOrderDetail } from '../../../types/order';

import { TrackingMapView } from '../components/tracking/TrackingMapView';
import { TrackingBottomSheet } from '../components/tracking/TrackingBottomSheet';

interface ActiveTrackingScreenProps {
  order: MobileOrderDetail;
  onBack: () => void;
}

export function ActiveTrackingScreen({ order, onBack }: ActiveTrackingScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const clearTracking = useLiveTrackingStore((s) => s.clearTracking);

  useEffect(() => {
    return () => {
      clearTracking(order.order_id);
    };
  }, [order.order_id, clearTracking]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Full-screen interactive map */}
      <TrackingMapView order={order} />

      {/* Overlay bottom sheet with all tracking info */}
      <TrackingBottomSheet order={order} onBack={onBack} topInset={insets.top} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});