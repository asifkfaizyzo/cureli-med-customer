// src/features/cart/components/FulfillmentTypeSelector.tsx (do not remove this comment)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCheckoutStore } from '../../../store/checkoutStore';
import type { FulfillmentType } from '../../../types/order';

/* ── helpers ── */

/**
 * Returns the current hour in IST (0-23).
 * Mirrors the backend's getCurrentISTHour() for client-side lock display.
 */
function getCurrentISTHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10,
  );
}

interface OptionConfig {
  type: FulfillmentType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  subtitle: string;
  locked: boolean;
  lockReason?: string;
}

function getOptions(
  colors: any,
  sameDayAvailable: boolean,
  cutoffHour: number,
): OptionConfig[] {
  const cutoffDisplay =
    cutoffHour > 12
      ? `${cutoffHour - 12}:00 PM`
      : `${cutoffHour}:00 AM`;

  return [
    {
      type: 'INSTANT_DELIVERY',
      icon: 'bicycle-outline',
      title: 'Instant Delivery',
      tag: 'Fastest',
      tagColor: colors.brand.primary,
      tagBg: `${colors.brand.primary}12`,
      subtitle: 'At your door in 45–60 minutes',
      locked: false,
    },
    {
      type: 'PICKUP',
      icon: 'storefront-outline',
      title: 'Takeaway',
      tag: 'No delivery fee',
      tagColor: '#16a34a',
      tagBg: '#16a34a14',
      subtitle: 'Collect your order from the pharmacy',
      locked: false,
    },
    {
      type: 'SAME_DAY',
      icon: 'time-outline',
      title: 'Same Day Delivery',
      tag: sameDayAvailable ? 'Budget' : 'Closed',
      tagColor: sameDayAvailable ? '#0891b2' : colors.text.muted,
      tagBg: sameDayAvailable ? '#0891b214' : `${colors.text.muted}14`,
      subtitle: sameDayAvailable
        ? 'Delivered to you by end of day'
        : `Orders close at ${cutoffDisplay}`,
      locked: !sameDayAvailable,
      lockReason: !sameDayAvailable ? 'Available tomorrow' : undefined,
    },
  ];
}

/* ── component ── */

export function FulfillmentTypeSelector() {
  const { colors } = useTheme();
  const fulfillmentType = useCheckoutStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCheckoutStore((s) => s.setFulfillmentType);
  const breakdown = useCheckoutStore((s) => s.breakdown);

  // Use server-provided cutoff when available; fall back to IST check
  const cutoffHour = breakdown?.same_day_cutoff_hour ?? 15;
  const sameDayAvailable =
    breakdown?.same_day_available ?? getCurrentISTHour() < cutoffHour;

  const options = getOptions(colors, sameDayAvailable, cutoffHour);

  const handleSelect = (option: OptionConfig) => {
    if (option.locked) return;
    if (option.type !== fulfillmentType) setFulfillmentType(option.type);
  };

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>

        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
            <Ionicons name="cube-outline" size={14} color={colors.brand.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            How would you like to receive it?
          </Text>
        </View>
        <View style={[styles.titleUnderline, { backgroundColor: colors.brand.primary }]} />

        

        {/* ── Options ── */}
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
                        : colors.background.card,
                    borderColor: isActive && !isLocked
                      ? colors.brand.primary
                      : colors.border.default,
                    opacity: isLocked ? 0.5 : 1,
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
                          : colors.background.tint,
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
                  <View style={styles.optionTitleRow}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isLocked ? colors.text.muted : colors.text.primary },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <View style={[styles.tag, { backgroundColor: option.tagBg }]}>
                      <Text style={[styles.tagText, { color: option.tagColor }]}>
                        {option.tag}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.optionSub,
                      { color: isLocked ? colors.text.muted : colors.text.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {isLocked && option.lockReason
                      ? option.lockReason
                      : option.subtitle}
                  </Text>
                </View>

                {/* Radio indicator */}
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isActive && !isLocked
                        ? colors.brand.primary
                        : colors.border.default,
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
    </View>
  );
}

/* ── styles ── */

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
    flex: 1,
  },
  titleUnderline: {
    height: 2,
    borderRadius: 1,
    opacity: 0.00,
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Micro-label ──
  microLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 2,
  },

  // ── Options ──
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
  },
  optionTitleRow: {
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
    borderRadius: 5,
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
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});