// src/features/cart/components/PickupLocationCard.tsx (do not remove this comment)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCartStore } from '../../../store/cartStore';

interface PickupLocationCardProps {
  distanceText?: string | null;
}

export function PickupLocationCard({ distanceText }: PickupLocationCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;
  const cartPharmacy = useCartStore((s) => s.cartPharmacy);
  const pharmacy = cartPharmacy();

  const p = (pharmacy || {}) as any;

  // ── Resolve Pharmacy & Branch Name (supports camelCase & snake_case) ──
  const shopName =
    p.shopName ||
    p.shop_name ||
    p.shop?.business_name ||
    null;

  const branchName =
    p.branchName ||
    p.branch_name ||
    p.branch?.branch_name ||
    null;

  const displayName = branchName
    ? shopName && shopName !== branchName
      ? `${shopName} (${branchName})`
      : branchName
    : shopName || 'Partner Pharmacy';

  // ── Resolve Address (supports all API & cart variations) ──
  const rawAddress =
    p.branchAddress ||
    p.branch_address ||
    p.formatted_address ||
    p.formattedAddress ||
    p.address ||
    p.branch?.address_line_1 ||
    [p.address_line_1, p.city].filter(Boolean).join(', ');

  const pharmacyAddress = rawAddress || null;

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>

        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
            <Ionicons name="location-outline" size={14} color={brandColor} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>Pickup Location</Text>
          <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />
        </View>

        {/* ── Pharmacy details ── */}
        <View style={styles.row}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons name="storefront-outline" size={18} color={brandColor} />
          </View>
          <View style={styles.text}>
           
            <Text
              style={[styles.name, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {pharmacyAddress ? (
              <Text
                style={[styles.detail, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                {pharmacyAddress}
              </Text>
            ) : (
              <Text
                style={[styles.detail, { color: colors.text.muted }]}
                numberOfLines={1}
              >
                Collect in person from the pharmacy counter
              </Text>
            )}
            {distanceText ? (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate-outline" size={11} color={colors.text.faint} />
                <Text style={[styles.distance, { color: colors.text.faint }]}>
                  {distanceText} from your location
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Info notice (left-accent style) ── */}
        <View
          style={[
            styles.infoNotice,
            {
              backgroundColor: colors.status.infoBg,
              borderLeftColor: colors.status.info,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={15}
            color={colors.status.info}
          />
          <Text
            style={[
              styles.infoText,
              { color: colors.status.info },
            ]}
          >
            Show your pickup code at the counter when you arrive.
          </Text>
        </View>
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

  // ── Pharmacy row ──
  row: {
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
  text: {
    flex: 1,
    gap: 1,
  },
  microLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  detail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distance: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },

  // ── Info notice (left-accent) ──
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
  },
});