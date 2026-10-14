// src/features/cart/components/FulfillmentTypeSelector.tsx (do not remove this comment)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCheckoutStore } from '../../../store/checkoutStore';
import type { FulfillmentType } from '../../../types/order';

/* ── helpers ── */

function isSameDayLocked(): boolean {
  return new Date().getHours() >= 15;
}

interface OptionConfig {
  type: FulfillmentType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  subtitle: string;
  detail: string;
  locked: boolean;
  lockReason?: string;
}

function getOptions(colors: any): OptionConfig[] {
  const sameDayLocked = isSameDayLocked();
  return [
    {
      type: 'INSTANT_DELIVERY',
      icon: 'bicycle-outline',
      title: 'Instant Delivery',
      tag: 'Fastest',
      tagColor: colors.brand.primary,
      tagBg: `${colors.brand.primary}12`,
      subtitle: 'At your door in 45–60 minutes',
      detail: 'Delivery fee and distance surcharge apply',
      locked: false,
    },
    {
      type: 'PICKUP',
      icon: 'storefront-outline',
      title: 'In-Person Pickup',
      tag: 'No delivery fee',
      tagColor: '#16a34a',
      tagBg: '#16a34a14',
      subtitle: 'Collect your order from the pharmacy',
      detail: 'No delivery fee, no distance charge — lowest total',
      locked: false,
    },
    {
      type: 'SAME_DAY',
      icon: 'time-outline',
      title: 'Same Day Delivery',
      tag: sameDayLocked ? 'Closed' : 'Budget',
      tagColor: sameDayLocked ? colors.text.muted : '#0891b2',
      tagBg: sameDayLocked ? `${colors.text.muted}14` : '#0891b214',
      subtitle: sameDayLocked
        ? 'Orders close at 3 PM'
        : 'Delivered to you by end of day',
      detail: sameDayLocked
        ? 'Available tomorrow'
        : 'Reduced delivery charges · Batch delivery',
      locked: sameDayLocked,
      lockReason: sameDayLocked ? 'Available tomorrow' : undefined,
    },
  ];
}

/* ── component ── */

export function FulfillmentTypeSelector() {
  const { colors } = useTheme();
  const fulfillmentType = useCheckoutStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCheckoutStore((s) => s.setFulfillmentType);

  const options = getOptions(colors);

  const handleSelect = (option: OptionConfig) => {
    if (option.locked) return;
    if (option.type !== fulfillmentType) setFulfillmentType(option.type);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        How would you like to receive it?
      </Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isActive = fulfillmentType === option.type;
          const isLocked = option.locked;

          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => handleSelect(option)}
              activeOpacity={isLocked ? 1 : 0.7}
              disabled={isLocked}
              style={[
                styles.option,
                {
                  backgroundColor: isLocked
                    ? colors.background.tint
                    : isActive
                      ? `${colors.brand.primary}08`
                      : colors.background.tint,
                  borderColor: isActive && !isLocked
                    ? colors.brand.primary
                    : colors.border.subtle,
                  opacity: isLocked ? 0.55 : 1,
                },
              ]}
            >
              {/* Icon circle */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isLocked
                      ? colors.border.subtle
                      : isActive
                        ? colors.brand.primary
                        : `${colors.brand.primary}14`,
                  },
                ]}
              >
                <Ionicons
                  name={isLocked ? 'lock-closed-outline' : option.icon}
                  size={18}
                  color={
                    isLocked
                      ? colors.text.muted
                      : isActive
                        ? '#fff'
                        : colors.brand.primary
                  }
                />
              </View>

              {/* Text block */}
              <View style={styles.optionText}>
                {/* Title + tag row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: isLocked ? colors.text.muted : colors.text.primary },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: option.tagBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: option.tagColor },
                      ]}
                    >
                      {option.tag}
                    </Text>
                  </View>
                </View>

                {/* Subtitle */}
                <Text
                  style={[
                    styles.optionSub,
                    { color: isLocked ? colors.text.muted : colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {option.subtitle}
                </Text>

                {/* Detail / selling point */}
                <Text
                  style={[
                    styles.optionDetail,
                    {
                      color: isLocked
                        ? colors.text.muted
                        : option.type === 'PICKUP'
                          ? '#16a34a'
                          : colors.text.muted,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {isLocked && option.lockReason
                    ? option.lockReason
                    : option.detail}
                </Text>
              </View>

              {/* Radio indicator */}
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isActive && !isLocked
                      ? colors.brand.primary
                      : colors.border.subtle,
                  },
                ]}
              >
                {isActive && !isLocked && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.brand.primary },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ── styles ── */

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
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  optionText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  optionSub: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 15,
  },
  optionDetail: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    marginTop: 3,
    lineHeight: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});