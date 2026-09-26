// src/features/orders/components/tracking/TrackingRiderCard.tsx (do not remove this comment)
//
// Slot B — Promoted rider card, always visible above the fold.
// Shows theme-conscious initials avatar, name, vehicle, rating, and a Call button.
// When no rider is assigned, shows a pulsing skeleton placeholder.

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';

import { useTheme } from '../../../../theme/ThemeContext';
import type { RiderInfo } from '../../../../types/order';

interface TrackingRiderCardProps {
  rider: RiderInfo | null | undefined;
  deliveryStatus?: string | null;
}

export function TrackingRiderCard({ rider, deliveryStatus }: TrackingRiderCardProps) {
  const { colors } = useTheme();

  // ── Skeleton state: no rider assigned yet ────────────────────
  if (!rider) {
    const isSearching =
      deliveryStatus === 'PENDING_ASSIGNMENT' ||
      deliveryStatus === 'RIDER_NOTIFIED' ||
      !deliveryStatus;

    if (!isSearching) return null;

    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
          <SkeletonPulse colors={colors}>
            <View
              style={[
                styles.skeletonAvatar,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={colors.text.faint} />
            </View>
          </SkeletonPulse>
          <View style={styles.skeletonInfo}>
            <View
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.background.tint, width: 140 },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.background.tint, width: 100, height: 10 },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.skeletonText, { color: colors.text.muted }]}>
          Assigning a nearby delivery partner...
        </Text>
      </Animated.View>
    );
  }

  // ── Active rider card ────────────────────────────────────────
  const vehicleLabel = [rider.vehicle_make_model, rider.vehicle_number]
    .filter(Boolean)
    .join(' · ');

  // Compute theme-conscious initials or fallback icon
  const riderInitial = rider.name ? rider.name.trim().charAt(0).toUpperCase() : null;

  const handleCall = useCallback(() => {
    if (rider.phone) Linking.openURL(`tel:${rider.phone}`);
  }, [rider.phone]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* Theme-conscious vector or initials avatar */}
      <View style={styles.avatarAssembly}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.brand,
            },
          ]}
        >
          {riderInitial ? (
            <Text style={[styles.avatarInitial, { color: colors.brand.primary }]}>
              {riderInitial}
            </Text>
          ) : (
            <Ionicons name="bicycle" size={20} color={colors.brand.primary} />
          )}
        </View>
        <View
          style={[styles.activeDot, { backgroundColor: colors.status.success }]}
        />
      </View>

      {/* Info block */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {rider.name || 'Your delivery partner'}
        </Text>
        {vehicleLabel ? (
          <Text
            style={[styles.vehicle, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {vehicleLabel}
          </Text>
        ) : null}
        {rider.rating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.text.muted }]}>
              {rider.rating.toFixed(1)} ({rider.total_ratings})
            </Text>
          </View>
        )}
      </View>

      {/* Call button */}
      <TouchableOpacity
        style={[
          styles.callBtn,
          {
            backgroundColor: colors.status.successBg,
            borderColor: colors.status.successBorder,
          },
        ]}
        onPress={handleCall}
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={16} color={colors.status.success} />
        <Text style={[styles.callText, { color: colors.status.success }]}>
          Call
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Skeleton Pulse Sub-component ───────────────────────────────
function SkeletonPulse({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: any;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarAssembly: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  vehicle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  callText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  // Skeleton
  skeletonCard: {
    padding: 12,
    gap: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonInfo: {
    gap: 6,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  skeletonText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingLeft: 54,
  },
});