// src/features/notifications/components/NotificationCard.tsx

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { Radius } from '../../../theme/radius';
import type { InboxNotification } from '../api/notifications.api';

// ── Category → Icon + Color mapping ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; colorKey: 'brand' | 'success' | 'warning' | 'error' | 'info' }
> = {
  order_updates:        { icon: 'receipt-outline',          colorKey: 'info' },
  promotions:           { icon: 'pricetag-outline',         colorKey: 'success' },
  prescription_updates: { icon: 'medical-outline',          colorKey: 'brand' },
  system_messages:      { icon: 'information-circle-outline', colorKey: 'info' },
  cart_abandonment:     { icon: 'cart-outline',             colorKey: 'warning' },
};

const FALLBACK_CONFIG = { icon: 'notifications-outline' as const, colorKey: 'info' as const };

// ── Relative time formatter ──────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

// ── Props ────────────────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: InboxNotification;
  onPress: (notification: InboxNotification) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

function NotificationCardBase({ notification, onPress }: NotificationCardProps) {
  const { colors } = useTheme();

  const config = CATEGORY_CONFIG[notification.category] ?? FALLBACK_CONFIG;

  // Resolve icon color from theme
  const iconColor = useMemo(() => {
    switch (config.colorKey) {
      case 'brand':   return colors.brand.primary;
      case 'success': return colors.status?.success ?? '#34C759';
      case 'warning': return colors.status?.warning ?? '#FF9500';
      case 'error':   return colors.status?.error ?? '#FF3B30';
      case 'info':
      default:        return colors.text.brand;
    }
  }, [config.colorKey, colors]);

  const handlePress = useCallback(() => {
    onPress(notification);
  }, [notification, onPress]);

  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isUnread
            ? colors.background.tint
            : colors.background.card,
          borderColor: isUnread
            ? colors.border.brand
            : colors.border.default,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${isUnread ? 'Unread.' : ''}`}
    >
      {/* Left: category icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconColor + '15' },
        ]}
      >
        <Ionicons name={config.icon} size={20} color={iconColor} />
      </View>

      {/* Center: text content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text.primary,
                fontFamily: isUnread ? 'Inter_700Bold' : 'Inter_500Medium',
              },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          {isUnread && (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.brand.primary }]}
            />
          )}
        </View>

        <Text
          style={[styles.body, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {notification.body}
        </Text>

        <Text style={[styles.time, { color: colors.text.muted }]}>
          {timeAgo(notification.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});

export const NotificationCard = React.memo(NotificationCardBase);