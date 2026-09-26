// src/features/orders/components/tracking/TrackingMapView.tsx
//
// Interactive map layer for live order tracking.
// All gestures enabled (pinch, pan, rotate, pitch).
// Auto-centers on relevant markers when coordinates change.
// Floating recenter button appears when user pans away.

import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { darkMapStyle, lightMapStyle } from "../../../../constants/mapStyle";
import { useLiveTrackingStore } from "../../../../store/liveTrackingStore";
import { useTheme } from "../../../../theme/ThemeContext";
import type { MobileOrderDetail } from "../../../../types/order";
import { ordersApi } from "../../../marketplace/api/orders.api";

interface TrackingMapViewProps {
  order: MobileOrderDetail;
}

interface LatLngPoint {
  latitude: number;
  longitude: number;
}

const KOCHI_FALLBACK: LatLngPoint = { latitude: 9.9312, longitude: 76.2673 };
const DEFAULT_DELTA = 0.05;
const MIN_LAT_DELTA = 0.007;
const MIN_LNG_DELTA = 0.007;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function decodePolyline(encoded: string): LatLngPoint[] {
  const points: LatLngPoint[] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b: number,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function getActiveLeg(
  deliveryStatus: string | undefined,
  hasRider: boolean,
): "leg0" | "leg1" | "leg2" | null {
  if (!deliveryStatus || !hasRider) return "leg0";
  if (deliveryStatus === "PENDING_ASSIGNMENT") return "leg0";
  if (
    [
      "RIDER_NOTIFIED",
      "ACCEPTED",
      "ARRIVED_AT_PHARMACY",
      "PHARMACY_CONFIRMED",
    ].includes(deliveryStatus)
  )
    return "leg1";
  if (["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER"].includes(deliveryStatus))
    return "leg2";
  return null;
}

export function TrackingMapView({ order }: TrackingMapViewProps) {
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const riderLocation = useLiveTrackingStore(
    (s) => s.riderLocations[order.order_id],
  );

  const [routeCoords, setRouteCoords] = useState<LatLngPoint[]>([]);
  const [showRecenter, setShowRecenter] = useState(false);
  const cachedLegRef = useRef<string | null>(null);

  const delivery = order.delivery;
  const rider = delivery?.rider;
  const deliveryStatus = delivery?.status;
  const activeLeg = getActiveLeg(deliveryStatus, !!rider);

  // ── Coordinate resolution ────────────────────────────────────
  const pharmacyCoords = useMemo<LatLngPoint | null>(() => {
    const pickup = delivery?.pickup_location;
    if (pickup?.latitude != null && pickup?.longitude != null) {
      return { latitude: pickup.latitude, longitude: pickup.longitude };
    }
    if (order.branch_latitude != null && order.branch_longitude != null) {
      return {
        latitude: order.branch_latitude,
        longitude: order.branch_longitude,
      };
    }
    return null;
  }, [delivery, order.branch_latitude, order.branch_longitude]);

  const customerCoords = useMemo<LatLngPoint | null>(() => {
    const drop = delivery?.drop_location;
    if (drop?.latitude != null && drop?.longitude != null) {
      return { latitude: drop.latitude, longitude: drop.longitude };
    }
    const addr = order.delivery_address;
    if (addr?.latitude != null && addr?.longitude != null) {
      return { latitude: addr.latitude, longitude: addr.longitude };
    }
    return null;
  }, [delivery, order.delivery_address]);

  const riderCoords = useMemo<LatLngPoint | null>(() => {
    if (riderLocation)
      return { latitude: riderLocation.lat, longitude: riderLocation.lng };
    const loc = rider?.current_location;
    if (loc?.latitude != null && loc?.longitude != null) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    return null;
  }, [riderLocation, rider]);

  const initialRegion = useMemo<Region>(() => {
    const point = pharmacyCoords || customerCoords || KOCHI_FALLBACK;
    return {
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch route polyline ─────────────────────────────────────
  useEffect(() => {
    if (!activeLeg || activeLeg === cachedLegRef.current) return;
    cachedLegRef.current = activeLeg;

    let origin: LatLngPoint | null = null;
    let dest: LatLngPoint | null = null;

    if (activeLeg === "leg0" && pharmacyCoords && customerCoords) {
      origin = pharmacyCoords;
      dest = customerCoords;
    } else if (activeLeg === "leg1" && riderCoords && pharmacyCoords) {
      origin = riderCoords;
      dest = pharmacyCoords;
    } else if (activeLeg === "leg2" && pharmacyCoords && customerCoords) {
      origin = pharmacyCoords;
      dest = customerCoords;
    }

    if (!origin || !dest) return;

    ordersApi
      .getDirections({
        origin_lat: origin.latitude,
        origin_lng: origin.longitude,
        dest_lat: dest.latitude,
        dest_lng: dest.longitude,
      })
      .then((res) => {
        const encoded = res.data?.data?.polyline;
        if (encoded) setRouteCoords(decodePolyline(encoded));
      })
      .catch(() => {
        setRouteCoords([origin!, dest!]);
      });
  }, [activeLeg, riderCoords, pharmacyCoords, customerCoords]);

  // ── Auto-center when markers change ──────────────────────────
  useEffect(() => {
    const points: LatLngPoint[] = [];
    if (pharmacyCoords) points.push(pharmacyCoords);
    if (customerCoords) points.push(customerCoords);
    if (riderCoords) points.push(riderCoords);

    if (points.length === 0) {
      mapRef.current?.animateToRegion(
        {
          ...KOCHI_FALLBACK,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        },
        600,
      );
      return;
    }

    if (points.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...points[0],
          latitudeDelta: MIN_LAT_DELTA,
          longitudeDelta: MIN_LNG_DELTA,
        },
        600,
      );
      return;
    }

    let minLat = points[0].latitude,
      maxLat = points[0].latitude;
    let minLng = points[0].longitude,
      maxLng = points[0].longitude;
    points.forEach((p) => {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    });

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;

    if (latSpan < MIN_LAT_DELTA && lngSpan < MIN_LNG_DELTA) {
      mapRef.current?.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: MIN_LAT_DELTA,
          longitudeDelta: MIN_LNG_DELTA,
        },
        600,
      );
    } else {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 100, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  }, [pharmacyCoords, customerCoords, riderCoords]);

  // ── Recenter handler ─────────────────────────────────────────
  const handleRecenter = useCallback(() => {
    setShowRecenter(false);
    const points: LatLngPoint[] = [];
    if (pharmacyCoords) points.push(pharmacyCoords);
    if (customerCoords) points.push(customerCoords);
    if (riderCoords) points.push(riderCoords);

    if (points.length >= 2) {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 100, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    } else if (points.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...points[0],
          latitudeDelta: MIN_LAT_DELTA,
          longitudeDelta: MIN_LNG_DELTA,
        },
        400,
      );
    }
  }, [pharmacyCoords, customerCoords, riderCoords]);

  const handleRegionChangeComplete = useCallback(() => {
    // Show recenter button after user manually pans
    setShowRecenter(true);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        // All gestures enabled
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        moveOnMarkerPress={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Pharmacy Marker */}
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

        {/* Customer Destination Marker */}
        {customerCoords && (
          <Marker coordinate={customerCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.pinContainer}>
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.status.success,
                  },
                ]}
              >
                <View
                  style={[
                    styles.markerCore,
                    { backgroundColor: colors.status.success },
                  ]}
                >
                  <Ionicons name="home" size={16} color="#fff" />
                </View>
              </View>
              <View
                style={[
                  styles.pinStem,
                  { backgroundColor: colors.status.success },
                ]}
              />
            </View>
          </Marker>
        )}

        {/* Rider Marker (live) */}
        {riderCoords && (
          <Marker coordinate={riderCoords} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View
              style={[
                styles.riderOuter,
                { backgroundColor: hexToRgba(colors.status.info, 0.15) },
              ]}
            >
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
                  <Ionicons name="bicycle" size={16} color="#fff" />
                </View>
              </View>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={isDark ? colors.brand.primary : colors.brand.light}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Recenter FAB */}
      {showRecenter && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <TouchableOpacity
            style={[
              styles.recenterBtn,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
            onPress={handleRecenter}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={18} color={colors.brand.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  markerCore: {
    width: "100%",
    height: "100%",
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  pinContainer: {
    alignItems: "center",
  },
  pinStem: {
    width: 2,
    height: 6,
    marginTop: -1,
  },
  riderOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  recenterBtn: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
});
