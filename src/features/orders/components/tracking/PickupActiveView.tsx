// src/features/orders/components/tracking/PickupActiveView.tsx (do not remove this comment)
//
// Pickup equivalent of the instant delivery active tracking screen.
// Layers: Interactive Map (full screen) + Bottom Sheet (overlay).
// Composition: PickupStatusHero + TrackingDelayBanner + TrackingShopCard(nav) + TrackingOrderDetails.

import React, { useCallback, useMemo, useRef } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { darkMapStyle, lightMapStyle } from '../../../../constants/mapStyle';
import { useDeliveryLocationStore } from '../../../../store/deliveryLocationStore';
import { useTheme } from '../../../../theme/ThemeContext';
import type { MobileOrderDetail } from '../../../../types/order';

import { PickupStatusHero } from './PickupStatusHero';
import { TrackingDelayBanner } from './TrackingDelayBanner';
import { TrackingShopCard } from './TrackingShopCard';
import { TrackingOrderDetails } from './TrackingOrderDetails';

interface PickupActiveViewProps {
  order: MobileOrderDetail;
  onBack: () => void;
  onOrderUpdate?: () => void;
}

const KOCHI_FALLBACK = { latitude: 9.9312, longitude: 76.2673 };

function toNum(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function PickupActiveView({
  order,
  onBack,
  onOrderUpdate,
}: PickupActiveViewProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const location = useDeliveryLocationStore((s) => s.location);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['36%', '72%', '94%'], []);

  // ── Coordinates ────────────────────────────────────────────────
  const pharmacyCoords = useMemo(() => {
    const lat = toNum(order.branch_latitude);
    const lng = toNum(order.branch_longitude);
    if (lat != null && lng != null) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, [order.branch_latitude, order.branch_longitude]);

  const customerCoords = useMemo(() => {
    if (!location) return null;
    const lat = toNum(location.latitude);
    const lng = toNum(location.longitude);
    if (lat != null && lng != null) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, [location]);

  const initialRegion = useMemo<Region>(() => {
    const point = pharmacyCoords || customerCoords || KOCHI_FALLBACK;
    return {
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStateChange = useCallback((index: number) => {
    if (index >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSupport = useCallback(() => {
    router.push({
      pathname: '/support/raise' as any,
      params: {
        orderId: order.order_id,
        orderNumber: order.order_number,
      },
    });
  }, [order.order_id, order.order_number]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Map ─────────────────────────────────────────────────── */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        scrollEnabled
        zoomEnabled
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
      >
        {pharmacyCoords && (
          <Marker coordinate={pharmacyCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={[
                styles.marker,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.brand.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.markerCore,
                  { backgroundColor: colors.brand.primary },
                ]}
              >
                <Ionicons name="medical" size={16} color="#fff" />
              </View>
            </View>
          </Marker>
        )}

        {customerCoords && (
          <Marker coordinate={customerCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.pinContainer}>
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.status.info,
                  },
                ]}
              >
                <View
                  style={[
                    styles.markerCore,
                    { backgroundColor: colors.status.info },
                  ]}
                >
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
              </View>
              <View
                style={[styles.pinStem, { backgroundColor: colors.status.info }]}
              />
            </View>
          </Marker>
        )}

        {pharmacyCoords && customerCoords && (
          <Polyline
            coordinates={[customerCoords, pharmacyCoords]}
            strokeColor={isDark ? colors.brand.primary : colors.brand.light}
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        )}
      </MapView>

      {/* ── Floating top bar ────────────────────────────────────── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
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
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ────────────────────────────────────────── */}
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
            {/* Status Hero (OTP, status lines, self-confirm, terminal state) */}
            <PickupStatusHero order={order} onOrderUpdate={onOrderUpdate} />

            {/* Delay Banner (preparation delay for pickup) */}
            <TrackingDelayBanner order={order} />

            {/* Shop card with Call + Navigate buttons */}
            <TrackingShopCard order={order} showNavigate />

            {/* Expandable order details */}
            <View style={styles.expandedSection}>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border.subtle },
                ]}
              />
              <TrackingOrderDetails order={order} />
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  markerCore: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContainer: { alignItems: 'center' },
  pinStem: { width: 2, height: 6, marginTop: -1 },
});