// src/features/cart/components/PickupLocationCard.tsx (do not remove this comment)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="storefront-outline" size={18} color={brandColor} />
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          Pickup Location
        </Text>
      </View>

      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <MaterialIcons name="store" size={18} color={brandColor} />
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
            <Text style={[styles.distance, { color: colors.text.faint }]}>
              {distanceText} from your location
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: colors.status.infoBg ?? colors.background.tint,
            borderColor: colors.status.info ?? colors.border.subtle,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.status.info ?? brandColor}
        />
        <Text
          style={[
            styles.infoText,
            { color: colors.status.info ?? colors.text.secondary },
          ]}
        >
          Show your pickup code at the counter when you arrive.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  detail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  distance: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
  },
});