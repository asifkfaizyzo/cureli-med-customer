// src/features/prescription-request/components/PharmacySelectCard.tsx (do not remove this comment)
// src/features/prescription-request/components/PharmacySelectCard.tsx

import React, { memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }  from '../../../theme/ThemeContext';
import { Spacing }   from '../../../theme/spacing';
import { Radius }    from '../../../theme/radius';
import type { ShopSearchResult, ShopTag } from '../../../types/shop';

// ── Tag helpers (mirrors ShopCard.tsx) ────────────────────────

const MAX_VISIBLE_TAGS = 5;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
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
        style={[styles.tagPillText, { color: tag.colorHex }]}
        numberOfLines={1}
      >
        {tag.label}
      </Text>
    </View>
  );
});

// ── Card ──────────────────────────────────────────────────────

interface Props {
  shop: ShopSearchResult;
  isSelected: boolean;
  onToggle: (branchId: string) => void;
}

export function PharmacySelectCard({ shop, isSelected, onToggle }: Props) {
  const { colors } = useTheme();
  const branch = shop.nearestBranch;

  const visibleTags = (shop.tags || []).slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = (shop.tags || []).length - MAX_VISIBLE_TAGS;

  if (!branch) return null;

  return (
    <TouchableOpacity
      onPress={() => onToggle(branch.branchId)}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? colors.brand.primary + '15'
            : colors.background.card,
          borderColor: isSelected
            ? colors.brand.primary
            : colors.border.default,
          borderWidth: isSelected ? 1.5 : 1,
        },
      ]}
    >
      {/* Left: info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.shopName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {shop.name}
          </Text>
          {branch.isOpen ? (
            <View
              style={[
                styles.openBadge,
                { backgroundColor: colors.status.successBg },
              ]}
            >
              <Text style={[styles.openText, { color: colors.status.success }]}>
                Open
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.openBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Text style={[styles.openText, { color: colors.text.faint }]}>
                Closed
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          {branch.distanceKm != null && (
            <Text style={[styles.meta, { color: colors.text.muted }]}>
              {branch.distanceKm} km
            </Text>
          )}
          {branch.deliveryEnabled && (
            <Text style={[styles.meta, { color: colors.text.muted }]}>
              · Delivery
            </Text>
          )}
          {shop.listedMedicineCount > 0 && (
            <Text style={[styles.meta, { color: colors.text.faint }]}>
              · {shop.listedMedicineCount} medicines
            </Text>
          )}
        </View>

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
                  style={[styles.tagPillText, { color: colors.text.muted }]}
                >
                  +{overflowCount}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Right: checkbox */}
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isSelected
              ? colors.brand.primary
              : 'transparent',
            borderColor: isSelected
              ? colors.brand.primary
              : colors.border.default,
          },
        ]}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shopName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  openBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  openText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});