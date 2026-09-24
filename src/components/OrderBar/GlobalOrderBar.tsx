// src/components/OrderBar/GlobalOrderBar.tsx (do not remove this comment)
import React, { useCallback, useMemo, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";

import { useTheme } from "../../theme/ThemeContext";
import { Typography } from "../../theme/typography";
import { Spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import { useLayoutStore } from "../../store/layoutStore";
import { useCartBarVisibility } from "../../hooks/useCartBarVisibility";
import { useIsBottomTabRoute } from "../../hooks/useIsBottomTabRoute";
import { useOrderNotificationStore } from "../../store/orderNotificationStore";
import { ordersApi } from "../../features/marketplace/api/orders.api";
import type { MobileOrderSummary, MarketplaceOrderStatus } from "../../types/order";

const BAR_HEIGHT = 64;
const DEFAULT_BOTTOM_TAB_BAR_HEIGHT = 49;
const GLOBAL_BAR_BOTTOM_OFFSET = 12;

interface StatusStyle {
  text: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
  progress: number;
  statusBadge: string;
}

function shouldHideOrderBar(pathname: string): boolean {
  if (pathname === "/" || pathname === "/intro" || pathname === "/splash") return true;
  if (pathname.startsWith("/(auth)") || pathname === "/login" || pathname === "/otp") return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname.startsWith("/checkout")) return true;
  if (pathname.startsWith("/orders/")) return true;
  return false;
}

export function GlobalOrderBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isBottomTabRoute = useIsBottomTabRoute();

  const { isVisible: isCartBarVisible } = useCartBarVisibility();
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);
  const lastStatusUpdate = useOrderNotificationStore((s) => s.lastStatusUpdate);

  // 1. Reanimated values for the status ring pulse
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  // 2. Fetch active orders
  const { data, refetch } = useQuery({
    queryKey: ["active-orders"],
    queryFn: () => ordersApi.getOrders({ page: 1, limit: 10 }),
    refetchInterval: 15000,
  });

  // 3. Keep query updated on SSE events
  useEffect(() => {
    if (lastStatusUpdate) {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["active-orders"] });
    }
  }, [lastStatusUpdate, refetch, queryClient]);

  // 4. Find the single active tracking order
  const activeOrder = useMemo<MobileOrderSummary | null>(() => {
    const orders = data?.data?.data?.orders;
    if (!orders || !Array.isArray(orders)) return null;
    return (
      orders.find((order: MobileOrderSummary) =>
        ["PLACED", "ACCEPTED", "READY_FOR_PICKUP"].includes(order.status)
      ) || null
    );
  }, [data]);

  // 5. Calm radar pulse loop
  useEffect(() => {
    if (activeOrder) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1800 }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1800 }),
          withTiming(0.4, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [activeOrder, pulseScale, pulseOpacity]);

  // 6. Navigation handler with premium haptics
  const handlePress = useCallback(() => {
    if (activeOrder) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/orders/${activeOrder.order_id}` as any);
    }
  }, [activeOrder]);

  // 7. Animated style declarations (always before early returns)
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // ─── EARLY RETURNS ─────────────────────────────────────────────────────────
  if (shouldHideOrderBar(pathname)) return null;
  if (!activeOrder) return null;

  // ─── LAYOUT CALCULATIONS ───────────────────────────────────────────────────
  const effectiveTabHeight =
    bottomTabBarHeight > 0 ? bottomTabBarHeight : DEFAULT_BOTTOM_TAB_BAR_HEIGHT;

  const baseBottomOffset = isBottomTabRoute
    ? effectiveTabHeight + GLOBAL_BAR_BOTTOM_OFFSET
    : insets.bottom + GLOBAL_BAR_BOTTOM_OFFSET;

  const bottomOffset = isCartBarVisible
    ? baseBottomOffset + BAR_HEIGHT + Spacing.sm
    : baseBottomOffset;

  // ─── THEMED STATUS CONFIGURATION ───────────────────────────────────────────
  const statusConfigMap: Record<
    Extract<MarketplaceOrderStatus, "PLACED" | "ACCEPTED" | "READY_FOR_PICKUP">,
    StatusStyle
  > = {
    PLACED: {
      text: "Waiting for store confirmation",
      icon: "time-outline",
      gradient: [colors.status.warning, "#D97706"], // Dynamic sunset warning orange
      progress: 1,
      statusBadge: "Placed",
    },
    ACCEPTED: {
      text: "Store is preparing your prescription",
      icon: "sparkles",
      gradient: [colors.brand.primary, colors.brand.mid], // Sleek primary brand blend
      progress: 2,
      statusBadge: "Preparing",
    },
    READY_FOR_PICKUP: {
      text: "Your order is ready to collect!",
      icon: "checkmark-circle",
      gradient: [colors.status.success, "#15803d"], // Clean mint emerald green
      progress: 3,
      statusBadge: "Ready",
    },
  };

  const statusConfig: StatusStyle =
    statusConfigMap[activeOrder.status as keyof typeof statusConfigMap] ?? {
      text: "Updating order status...",
      icon: "swap-horizontal",
      gradient: [colors.text.muted, colors.text.faint],
      progress: 1,
      statusBadge: "Updating",
    };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)} // Soft slide + fade in, completely eliminates aggressive jumping
      exiting={FadeOut.duration(150)}
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          // Subtle drop shadow matching the gradient's base color
          shadowColor: statusConfig.gradient[1],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Order status update: ${statusConfig.text}`}
        style={styles.pressable}
      >
        <LinearGradient
          colors={statusConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Left Container: Radar Icon */}
          <View style={styles.leftContainer}>
            <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
            <View style={styles.iconCircle}>
              {activeOrder.status === "ACCEPTED" ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              ) : (
                <Ionicons name={statusConfig.icon} size={18} color="#FFFFFF" />
              )}
            </View>
          </View>

          {/* Middle Container: Info Texts */}
          <View style={styles.middleContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.orderNumberText}>
                Order #{activeOrder.order_number}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusConfig.statusBadge}</Text>
              </View>
            </View>
            <Text style={styles.statusDescription} numberOfLines={1}>
              {statusConfig.text}
            </Text>
          </View>

          {/* Right Container: Micro-tracker Dots & Chevron */}
          <View style={styles.rightContainer}>
            <View style={styles.progressTracker}>
              <View
                style={[
                  styles.progressDot,
                  statusConfig.progress >= 1 ? styles.dotActive : styles.dotInactive,
                ]}
              />
              <View
                style={[
                  styles.progressLine,
                  statusConfig.progress >= 2 ? styles.lineActive : styles.lineInactive,
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  statusConfig.progress >= 2 ? styles.dotActive : styles.dotInactive,
                ]}
              />
              <View
                style={[
                  styles.progressLine,
                  statusConfig.progress >= 3 ? styles.lineActive : styles.lineInactive,
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  statusConfig.progress >= 3 ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.7)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    height: BAR_HEIGHT,
    zIndex: 1000,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pressable: {
    flex: 1,
    overflow: "hidden",
    borderRadius: Radius.xl,
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  leftContainer: {
    position: "relative",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  pulseRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  middleContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  orderNumberText: {
    ...Typography.smallBold,
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusDescription: {
    ...Typography.small,
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressTracker: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  progressLine: {
    width: 8,
    height: 2,
  },
  lineActive: {
    backgroundColor: "#FFFFFF",
  },
  lineInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});