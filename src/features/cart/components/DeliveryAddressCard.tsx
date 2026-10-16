// src/features/cart/components/DeliveryAddressCard.tsx (do not remove this comment)
// src/features/cart/components/DeliveryAddressCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import type { Address } from '../../profile/types/profile.types';

interface DeliveryAddressCardProps {
  onChangePress: () => void;
}

export function DeliveryAddressCard({ onChangePress }: DeliveryAddressCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const { addresses, isLoading } = useAddresses();
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );
  console.log('[DAC]', {
    pickedAddressId,
    addressIds: addresses.map(a => a.id),
    found: addresses.find(a => a.id === pickedAddressId)?.id ?? 'NOT FOUND',
    isLoading,
  });

  const resolvedAddress: Address | null = (() => {
    if (pickedAddressId) {
      return addresses.find((a) => a.id === pickedAddressId) ?? null;
    }
    return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  })();

  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={styles.cardOuter}>
        <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
              <Ionicons name="location-outline" size={14} color={brandColor} />
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]}>Delivery Address</Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />
          </View>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={brandColor} />
            <Text style={[styles.loadingText, { color: colors.text.muted }]}>
              Loading address…
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const hasAddress = resolvedAddress !== null;

  const typeLabel = hasAddress
    ? (resolvedAddress.custom_label ?? resolvedAddress.label)
    : null;

  const labelIconName =
    resolvedAddress?.label === 'Home'
      ? 'home-outline'
      : resolvedAddress?.label === 'Work'
        ? 'briefcase-outline'
        : 'location-outline';

  const detailLine = hasAddress
    ? [
        resolvedAddress.address_line_1,
        resolvedAddress.address_line_2,
        resolvedAddress.city,
        resolvedAddress.state,
        resolvedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  const accentColor = hasAddress ? colors.brand.primary : colors.status.warning;

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: hasAddress ? 'transparent' : colors.status.warningBorder,
          },
        ]}
      >
        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
            <Ionicons name="location-outline" size={14} color={brandColor} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>Delivery Address</Text>
          <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />
        </View>

        {/* ── Address body ── */}
        {hasAddress ? (
          <View style={styles.addressRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons
                name={labelIconName as any}
                size={18}
                color={brandColor}
              />
            </View>

            <View style={styles.addressText}>
              
              <Text
                style={[styles.typeLabel, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {typeLabel}
              </Text>
              <Text
                style={[styles.detailLine, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                {detailLine}
              </Text>
              {resolvedAddress.recipient_name ? (
                <View style={styles.recipientRow}>
                  <Ionicons name="person-outline" size={11} color={colors.text.faint} />
                  <Text
                    style={[styles.recipient, { color: colors.text.faint }]}
                    numberOfLines={1}
                  >
                    {resolvedAddress.recipient_name}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={onChangePress}
              activeOpacity={0.7}
              style={[styles.changeBtn, { backgroundColor: colors.background.tint }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
            >
             
              <Text style={[styles.actionText, { color: brandColor }]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onChangePress}
            activeOpacity={0.75}
            style={[
              styles.emptyState,
              {
                borderColor: colors.status.warningBorder,
                backgroundColor: colors.status.warningBg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add delivery address"
          >
            <View style={[styles.emptyIconBadge, { backgroundColor: colors.status.warning }]}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
            <View style={styles.emptyText}>
              <Text style={[styles.emptyTitle, { color: colors.status.warning }]}>
                No delivery address set
              </Text>
              <Text style={[styles.emptySub, { color: colors.status.warning }]}>
                Tap to add an address before ordering
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.status.warning}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Card shell with left accent ──
  cardOuter: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  leftAccent: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  card: {
    flex: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 16,
    paddingLeft: 14,
    borderWidth: 1,
  },

  // ── Title ──
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  titleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  titleUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.08,
    marginLeft: 4,
  },

  // ── Loading ──
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },

  // ── Has address ──
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    gap: 1,
  },
  microLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  detailLine: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 2,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  recipient: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── No address ──
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  emptyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyText: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});