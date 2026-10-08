// cureli-med-customer/src/features/marketplace/components/ShopCard.tsx (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\cureli-mobile\src\features\marketplace\components\ShopCard.tsx

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { RemoteImage } from "../../../components/RemoteImage";
import type { ShopSearchResult, ShopTag } from "../../../types/shop";

interface ShopCardProps {
  shop: ShopSearchResult;
  onPress: (shop: ShopSearchResult) => void;
}

// ── Tag Pill Component ───────────────────────────────────────

const MAX_VISIBLE_TAGS = 3;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TagPill = memo(function TagPill({ tag }: { tag: ShopTag }) {
  return (
    <View
      style={[
        styles.tagPill,
        {
          backgroundColor: hexToRgba(tag.colorHex, 0.05),
          borderColor: hexToRgba(tag.colorHex, 0.15),
        },
      ]}
    >
      <Text
        style={[
          styles.tagPillText,
          { color: tag.colorHex },
        ]}
        numberOfLines={1}
      >
        {tag.label}
      </Text>
    </View>
  );
});

function ShopCardComponent({ shop, onPress }: ShopCardProps) {
  const { colors } = useTheme();
  const branch = shop.nearestBranch;
  const isClosed = branch ? !branch.isOpen : false;

  const visibleTags = (shop.tags || []).slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = (shop.tags || []).length - MAX_VISIBLE_TAGS;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(shop)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
          opacity: isClosed ? 0.65 : 1,
        },
      ]}
    >
      {/* ── Top row: logo + name + status ── */}
      <View style={styles.topRow}>
        <RemoteImage
          uri={shop.logoUrl ?? null}
          style={styles.logoCard}
          resizeMode="contain"
          mode="shop"
          fallbackIcon="storefront-outline"
          fallbackIconSize={22}
          fallbackIconColor={colors.text.brand}
          fallbackBg={colors.background.tint}
        />

        <View style={styles.nameBlock}>
          <Text
            style={[styles.name, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {shop.name}
          </Text>
          <Text
            style={[styles.medicineCount, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {/* {shop.listedMedicineCount > 0
              ? `${shop.listedMedicineCount} medicines listed`
              : "No medicines listed yet"} */}
          </Text>
        </View>

        {branch ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: branch.isOpen
                  ? hexToRgba(colors.status.success, 0.05)
                  : hexToRgba(colors.text.muted, 0.05),
                borderColor: branch.isOpen
                  ? hexToRgba(colors.status.success, 0.15)
                  : hexToRgba(colors.text.muted, 0.15),
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: branch.isOpen ? colors.status.success : colors.text.muted },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                {
                  color: branch.isOpen ? colors.text.brand : colors.text.muted,
                },
              ]}
              numberOfLines={1}
            >
              {branch.statusMessage}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Description ── */}
      {shop.description ? (
        <Text
          style={[styles.description, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {shop.description}
        </Text>
      ) : null}

      {/* ── Shop Tags ── */}
      {visibleTags.length > 0 ? (
        <View style={styles.tagRow}>
          {visibleTags.map((tag) => (
            <TagPill key={tag.slug} tag={tag} />
          ))}
          {overflowCount > 0 ? (
            <View
              style={[
                styles.tagPill,
                {
                  backgroundColor: hexToRgba(colors.text.muted, 0.05),
                  borderColor: hexToRgba(colors.text.muted, 0.15),
                },
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { color: colors.text.muted },
                ]}
              >
                +{overflowCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Bottom row ── */}
      <View style={styles.bottomRow}>
        {branch?.address ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.text.muted} />
            <Text
              style={[styles.metaText, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {branch.address}
            </Text>
          </View>
        ) : null}

        {branch?.distanceKm != null ? (
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={13} color={colors.text.muted} />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {branch.distanceKm} km
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => onPress(shop)}
          activeOpacity={0.8}
          style={[
            styles.cta,
            {
              backgroundColor: isClosed
                ? colors.text.disabled
                : colors.brand.primary,
            },
          ]}
        >
          <Text style={styles.ctaText}>View Shop</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const ShopCard = memo(ShopCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoCard: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 0,
    overflow: "hidden",
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
    letterSpacing: -0.1,
  },
  medicineCount: {
    ...Typography.small,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: "45%",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  description: {
    ...Typography.small,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
    minWidth: 0,
  },
  metaText: {
    ...Typography.small,
    flexShrink: 1,
  },
  cta: {
    marginLeft: "auto",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});