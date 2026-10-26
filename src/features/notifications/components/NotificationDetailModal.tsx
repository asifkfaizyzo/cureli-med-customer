// src/features/notifications/components/NotificationDetailModal.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/ThemeContext";
import type { InboxNotification } from "../api/notifications.api";

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: "brand" | "success" | "warning" | "error" | "info";
    label: string;
  }
> = {
  order_updates: {
    icon: "receipt-outline",
    colorKey: "info",
    label: "Order Update",
  },
  promotions: {
    icon: "pricetag-outline",
    colorKey: "success",
    label: "Promotion",
  },
  prescription_updates: {
    icon: "medical-outline",
    colorKey: "brand",
    label: "Prescription",
  },
  system_messages: {
    icon: "information-circle-outline",
    colorKey: "info",
    label: "System",
  },
  cart_abandonment: {
    icon: "cart-outline",
    colorKey: "warning",
    label: "Cart Reminder",
  },
};

const FALLBACK = {
  icon: "notifications-outline" as const,
  colorKey: "info" as const,
  label: "Notification",
};

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  notification: InboxNotification | null;
  visible: boolean;
  onClose: () => void;
  onAction?: (notification: InboxNotification) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotificationDetailModal({
  notification,
  visible,
  onClose,
  onAction,
}: Props) {
  const { colors } = useTheme();

  const config = useMemo(
    () =>
      notification
        ? (CATEGORY_CONFIG[notification.category] ?? FALLBACK)
        : FALLBACK,
    [notification],
  );

  const iconColor = useMemo(() => {
    switch (config.colorKey) {
      case "brand":
        return colors.brand.primary;
      case "success":
        return colors.status?.success ?? "#34C759";
      case "warning":
        return colors.status?.warning ?? "#FF9500";
      case "error":
        return colors.status?.error ?? "#FF3B30";
      default:
        return colors.text.brand;
    }
  }, [config.colorKey, colors]);

  const hasAction = useMemo(() => {
    if (!notification?.data) return false;
    const d = notification.data as any;
    return !!(d.deeplink || d.url || d.screen || d.action);
  }, [notification]);

  const actionLabel = useMemo(() => {
    if (!notification) return "Open";
    switch (notification.category) {
      case "order_updates":
        return "View Order";
      case "promotions":
        return "View Offer";
      case "prescription_updates":
        return "View Prescription";
      case "cart_abandonment":
        return "View Cart";
      default:
        return "Open";
    }
  }, [notification]);

  const handleAction = useCallback(() => {
    if (notification && onAction) onAction(notification);
    onClose();
  }, [notification, onAction, onClose]);

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.card,
              borderBottomColor: colors.border.subtle,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                },
                android: { elevation: 2 },
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.6}
            hitSlop={8}
          >
            <Ionicons
              name="close"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View
              style={[styles.iconWrap, { backgroundColor: iconColor + "15" }]}
            >
              <Ionicons name={config.icon} size={18} color={iconColor} />
            </View>
            <Text style={[styles.headerLabel, { color: iconColor }]}>
              {config.label}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          scrollIndicatorInsets={{ right: 1 }}
          bounces
        >
          <Text style={[styles.date, { color: colors.text.muted }]}>
            {formatFullDate(notification.created_at)}
          </Text>

          <Text
            style={[styles.title, { color: colors.text.primary }]}
            selectable
          >
            {notification.title}
          </Text>

          <View
            style={[styles.divider, { backgroundColor: colors.border.subtle }]}
          />

          <Text
            style={[styles.body, { color: colors.text.secondary }]}
            selectable
          >
            {notification.body}
          </Text>

          {notification.read_at && (
            <View style={styles.metaRow}>
              <Ionicons
                name="checkmark-done"
                size={13}
                color={colors.text.muted}
              />
              <Text style={[styles.metaText, { color: colors.text.muted }]}>
                Read {formatFullDate(notification.read_at)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Footer ── */}
        {hasAction && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background.card,
                borderTopColor: colors.border.subtle,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleAction}
              style={[styles.actionBtn, { backgroundColor: iconColor }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  headerSpacer: {
    width: 36,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  date: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  actionBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});