// src/features/orders/components/PriceRow.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface PriceRowProps {
  label: string;
  value: string;
  anchorValue?: string | null;
  isTotal?: boolean;
  isDiscount?: boolean;
  isFree?: boolean;
}

export function PriceRow({ label, value, anchorValue, isTotal, isDiscount, isFree }: PriceRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, isTotal && styles.totalRow]}>
      <Text
        style={[
          styles.label,
          {
            color: isTotal ? colors.text.primary : colors.text.secondary,
            fontFamily: isTotal ? 'Inter_600SemiBold' : 'Inter_400Regular',
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.valueContainer}>
        {anchorValue && (
          <Text style={[styles.anchorValue, { color: colors.text.faint }]}>
            {anchorValue}
          </Text>
        )}
        <Text
          style={[
            styles.value,
            {
              color: isDiscount || isFree
                ? colors.status.success
                : isTotal
                  ? colors.text.primary
                  : colors.text.secondary,
              fontFamily: isTotal ? 'Inter_700Bold' : 'Inter_500Medium',
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anchorValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
});