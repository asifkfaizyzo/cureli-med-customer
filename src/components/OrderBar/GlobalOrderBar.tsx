// src/components/OrderBar/GlobalOrderBar.tsx (do not remove this comment)
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ordersApi } from "../../features/marketplace/api/orders.api";
import { useCartBarVisibility } from "../../hooks/useCartBarVisibility";
import { useIsBottomTabRoute } from "../../hooks/useIsBottomTabRoute";
import { useLayoutStore } from "../../store/layoutStore";
import { useOrderNotificationStore } from "../../store/orderNotificationStore";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";
import { useTheme } from "../../theme/ThemeContext";
import { Typography } from "../../theme/typography";
import type { DeliveryStatus, MobileOrderSummary } from "../../types/order";

const BAR_HEIGHT = 64;
const FAB_SIZE = 52;
const DEFAULT_BOTTOM_TAB_BAR_HEIGHT = 49;
const GLOBAL_BAR_BOTTOM_OFFSET = 12;
const DISMISS_THRESHOLD_DY = 120;

// ── Ring geometry ────────────────────────────────────────────
const RING_SIZE = FAB_SIZE + 12;
const RING_HALF = RING_SIZE / 2;
const RING_BORDER = 2.5;
const RING_OFFSET = (RING_SIZE - FAB_SIZE) / 2;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function shouldHideOrderBar(pathname: string): boolean {
  if (pathname === "/" || pathname === "/intro" || pathname === "/splash")
    return true;
  if (
    pathname.startsWith("/(auth)") ||
    pathname === "/login" ||
    pathname === "/otp"
  )
    return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname.startsWith("/checkout")) return true;
  if (pathname.startsWith("/orders")) return true;
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
  const dismissedOrderIds = useOrderNotificationStore(
    (s) => s.dismissedOrderIds,
  );
  const dismissOrder = useOrderNotificationStore((s) => s.dismissOrder);

  // Heartbeat breathing shared values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const iconBreathe = useSharedValue(1);

  // Drag and Snap shared physical values
  const dragX = useSharedValue(SCREEN_WIDTH - FAB_SIZE - 16);
  const dragY = useSharedValue(SCREEN_HEIGHT - 220);
  const dragScale = useSharedValue(1);

  // ── NEW: Drag-feedback shared values ───────────────────────
  const dragProgress = useSharedValue(0); // 0 → 1 toward dismiss threshold
  const hintOpacity = useSharedValue(0); // drag-hint chevron at rest
  const mountBounceY = useSharedValue(0); // one-time entrance bounce
  const hapticFiredRef = useRef(false); // prevent double-haptic per drag
  const prevIsHomePage = useRef(true); // track mode transitions

  // Active orders payload query
  const { data, refetch } = useQuery({
    queryKey: ["active-orders"],
    queryFn: () => ordersApi.getOrders({ page: 1, limit: 10 }),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (lastStatusUpdate) {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["active-orders"] });
    }
  }, [lastStatusUpdate, refetch, queryClient]);

  const activeOrder = useMemo<MobileOrderSummary | null>(() => {
    const orders = data?.data?.data?.orders;
    if (!orders || !Array.isArray(orders)) return null;

    const found = orders.find((order: MobileOrderSummary) => {
      if (dismissedOrderIds[order.order_id]) return false;
      if (["PLACED", "ACCEPTED", "READY_FOR_PICKUP"].includes(order.status))
        return true;
      if (
        order.status === "COMPLETED" &&
        order.delivery_status &&
        !["DELIVERED", "FAILED", "CANCELLED"].includes(order.delivery_status)
      )
        return true;
      if (["CANCELLED", "REJECTED"].includes(order.status)) return true;
      if (order.status === "COMPLETED" && order.delivery_status === "DELIVERED")
        return true;
      return false;
    });

    return found || null;
  }, [data, dismissedOrderIds]);

  useEffect(() => {
    if (activeOrder) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 1600 }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1600 }),
          withTiming(0.4, { duration: 0 }),
        ),
        -1,
        false,
      );
      iconBreathe.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    }
  }, [activeOrder, pulseScale, pulseOpacity, iconBreathe]);

  const isHomePage = pathname === "/(tabs)/home" || pathname === "/home";

  // Reset positioning when switching modes
  useEffect(() => {
    if (!isHomePage) {
      dragX.value = SCREEN_WIDTH - FAB_SIZE - 16;
      dragY.value = SCREEN_HEIGHT - 220;
      dragScale.value = 1;
      dragProgress.value = 0;
    }
  }, [isHomePage, dragX, dragY, dragScale, dragProgress]);

  // ── NEW: Mount bounce + hint reveal when entering FAB mode ─
  useEffect(() => {
    if (prevIsHomePage.current && !isHomePage && activeOrder) {
      mountBounceY.value = withSequence(
        withDelay(250, withTiming(10, { duration: 220 })),
        withSpring(0, { damping: 6, stiffness: 140 }),
      );
      hintOpacity.value = withSequence(
        withDelay(600, withTiming(0.55, { duration: 400 })),
      );
    }
    if (!prevIsHomePage.current && isHomePage) {
      hintOpacity.value = 0;
      dragProgress.value = 0;
    }
    prevIsHomePage.current = isHomePage;
  }, [isHomePage, activeOrder, mountBounceY, hintOpacity, dragProgress]);

  const handleDismiss = useCallback(() => {
    if (activeOrder) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismissOrder(activeOrder.order_id);
    }
  }, [activeOrder, dismissOrder]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        dragX.value = gestureState.moveX - FAB_SIZE / 2;
        dragY.value = gestureState.moveY - FAB_SIZE / 2;

        if (gestureState.dy > 0) {
          const shrinkFactor = Math.max(
            0.4,
            1 - gestureState.dy / (DISMISS_THRESHOLD_DY * 1.6),
          );
          dragScale.value = shrinkFactor;

          // ── NEW: drive drag progress 0→1 ──────────────────
          const progress = Math.min(gestureState.dy / DISMISS_THRESHOLD_DY, 1);
          dragProgress.value = progress;
          hintOpacity.value = withTiming(0, { duration: 100 });

          // ── NEW: haptic tick at threshold ─────────────────
          if (progress >= 1 && !hapticFiredRef.current) {
            hapticFiredRef.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          if (progress < 0.85) {
            hapticFiredRef.current = false;
          }
        } else {
          dragScale.value = 1;
          dragProgress.value = 0;
        }
      },
      onPanResponderRelease: (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        // ── NEW: reset all drag feedback ────────────────────
        dragProgress.value = withTiming(0, { duration: 200 });
        hapticFiredRef.current = false;

        if (gestureState.dy > DISMISS_THRESHOLD_DY) {
          dragY.value = withTiming(SCREEN_HEIGHT + 100, { duration: 250 });
          dragScale.value = withTiming(0, { duration: 200 });
          setTimeout(() => handleDismiss(), 250);
          return;
        }

        dragScale.value = withSpring(1);
        hintOpacity.value = withTiming(0.55, { duration: 400 });

        const snapLeft = 16;
        const snapRight = SCREEN_WIDTH - FAB_SIZE - 16;
        const closestX =
          gestureState.moveX < SCREEN_WIDTH / 2 ? snapLeft : snapRight;

        const topBound = insets.top + 20;
        const bottomBound = SCREEN_HEIGHT - insets.bottom - 120;
        const boundedY = Math.max(
          topBound,
          Math.min(gestureState.moveY - FAB_SIZE / 2, bottomBound),
        );

        dragX.value = withSpring(closestX, { damping: 15 });
        dragY.value = withSpring(boundedY, { damping: 15 });
      },
    }),
  ).current;

  const handlePress = useCallback(() => {
    if (activeOrder) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/orders/${activeOrder.order_id}` as any);
    }
  }, [activeOrder]);

  // ── Breathing animated styles ──────────────────────────────
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconBreathe.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    left: dragX.value,
    top: dragY.value,
    transform: [{ scale: dragScale.value }, { translateY: mountBounceY.value }],
  }));

  // ── NEW: Drag-feedback animated styles ─────────────────────
  const statusIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - dragProgress.value,
    transform: [{ scale: 1 - dragProgress.value * 0.3 }],
  }));

  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: dragProgress.value,
    transform: [{ scale: 0.4 + dragProgress.value * 0.6 }],
  }));

  const redOverlayStyle = useAnimatedStyle(() => ({
    opacity: dragProgress.value * 0.9,
  }));

  const dismissLabelStyle = useAnimatedStyle(() => {
    const show = dragProgress.value > 0.35;
    const t = show ? Math.min((dragProgress.value - 0.35) / 0.25, 1) : 0;
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * 6 }],
    };
  });

  const rightHalfStyle = useAnimatedStyle(() => {
    const p = dragProgress.value;
    const rot = p <= 0.5 ? -180 + p * 2 * 180 : 0;
    return { transform: [{ rotate: `${rot}deg` }] };
  });

  const leftHalfStyle = useAnimatedStyle(() => {
    const p = dragProgress.value;
    const rot = p > 0.5 ? -180 + (p - 0.5) * 2 * 180 : -180;
    return { transform: [{ rotate: `${rot}deg` }] };
  });

  const ringTrackStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + dragProgress.value * 0.5,
  }));

  const hintChevronStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value * (1 - dragProgress.value),
  }));

  if (shouldHideOrderBar(pathname)) return null;
  if (!activeOrder) return null;

  const statusConfig = (() => {
    const oStatus = activeOrder.status;
    const dStatus: DeliveryStatus | undefined | null =
      activeOrder.delivery_status;

    if (oStatus === "CANCELLED") {
      return {
        text: "This order has been cancelled",
        icon: "close-circle" as const,
        gradient: [colors.status.error, "#b91c1c"] as [string, string],
        progress: 0,
        statusBadge: "Cancelled",
        isTerminal: true,
        isDelivered: false,
        isFailed: true,
      };
    }
    if (oStatus === "REJECTED") {
      return {
        text: "The store could not process this order",
        icon: "alert-circle" as const,
        gradient: [colors.status.error, "#b91c1c"] as [string, string],
        progress: 0,
        statusBadge: "Rejected",
        isTerminal: true,
        isDelivered: false,
        isFailed: true,
      };
    }
    if (dStatus === "DELIVERED") {
      return {
        text: "Medicines delivered successfully!",
        icon: "checkmark-circle" as const,
        gradient: [colors.status.success, "#15803d"] as [string, string],
        progress: 5,
        statusBadge: "Delivered",
        isTerminal: true,
        isDelivered: true,
        isFailed: false,
      };
    }
    if (dStatus === "FAILED") {
      return {
        text: "Delivery could not be completed",
        icon: "warning" as const,
        gradient: [colors.status.error, "#b91c1c"] as [string, string],
        progress: 0,
        statusBadge: "Failed",
        isTerminal: true,
        isDelivered: false,
        isFailed: true,
      };
    }
    if (oStatus === "PLACED") {
      return {
        text: "Waiting for store confirmation",
        icon: "time-outline" as const,
        gradient: [colors.brand.primary, colors.brand.secondary] as [
          string,
          string,
        ],
        progress: 1,
        statusBadge: "Placed",
        isTerminal: false,
        isDelivered: false,
        isFailed: false,
      };
    }
    if (oStatus === "ACCEPTED") {
      if (dStatus === "RIDER_NOTIFIED" || dStatus === "ACCEPTED") {
        return {
          text: "Rider is heading to the store",
          icon: "bicycle-outline" as const,
          gradient: [colors.brand.mid, colors.brand.light] as [string, string],
          progress: 2,
          statusBadge: "Rider Found",
          isTerminal: false,
          isDelivered: false,
          isFailed: false,
        };
      }
      return {
        text: "Pharmacy is packing your order",
        icon: "medical-outline" as const,
        gradient: [colors.brand.secondary, colors.brand.mid] as [
          string,
          string,
        ],
        progress: 2,
        statusBadge: "Preparing",
        isTerminal: false,
        isDelivered: false,
        isFailed: false,
      };
    }
    if (oStatus === "READY_FOR_PICKUP") {
      if (dStatus === "ARRIVED_AT_PHARMACY") {
        return {
          text: "Rider has arrived at the store",
          icon: "storefront-outline" as const,
          gradient: [colors.brand.light, colors.brand.soft] as [string, string],
          progress: 3,
          statusBadge: "Rider Arrived",
          isTerminal: false,
          isDelivered: false,
          isFailed: false,
        };
      }
      return {
        text: "Order packed & ready for pickup",
        icon: "cube-outline" as const,
        gradient: [colors.brand.light, colors.brand.soft] as [string, string],
        progress: 3,
        statusBadge: "Packed",
        isTerminal: false,
        isDelivered: false,
        isFailed: false,
      };
    }
    if (oStatus === "COMPLETED") {
      if (dStatus === "PICKED_UP" || dStatus === "EN_ROUTE") {
        return {
          text: "Rider is heading to you",
          icon: "navigate-outline" as const,
          gradient: [colors.brand.accent, colors.brand.light] as [
            string,
            string,
          ],
          progress: 4,
          statusBadge: "In Transit",
          isTerminal: false,
          isDelivered: false,
          isFailed: false,
        };
      }
      if (dStatus === "ARRIVED_AT_CUSTOMER") {
        return {
          text: "Rider is at your door!",
          icon: "location-outline" as const,
          gradient: [colors.brand.soft, colors.brand.accent] as [
            string,
            string,
          ],
          progress: 4.5,
          statusBadge: "At Door",
          isTerminal: false,
          isDelivered: false,
          isFailed: false,
        };
      }
    }
    return {
      text: "Updating order status...",
      icon: "swap-horizontal" as const,
      gradient: [colors.text.muted, colors.text.faint] as [string, string],
      progress: 1,
      statusBadge: "Updating",
      isTerminal: false,
      isDelivered: false,
      isFailed: false,
    };
  })();

  // ── Mode A: Docked Full-width Bar on Home Page ──────────────
  if (isHomePage) {
    const effectiveTabHeight =
      bottomTabBarHeight > 0
        ? bottomTabBarHeight
        : DEFAULT_BOTTOM_TAB_BAR_HEIGHT;

    const baseBottomOffset = isBottomTabRoute
      ? effectiveTabHeight + GLOBAL_BAR_BOTTOM_OFFSET
      : insets.bottom + GLOBAL_BAR_BOTTOM_OFFSET;

    const bottomOffset = isCartBarVisible
      ? baseBottomOffset + BAR_HEIGHT + Spacing.sm
      : baseBottomOffset;

    const showHomeDismiss = statusConfig.isTerminal;

    return (
      <Animated.View
        key="global-order-bar-docked"
        entering={FadeInDown.duration(300)}
        exiting={FadeOut.duration(150)}
        style={[
          styles.container,
          {
            bottom: bottomOffset,
            shadowColor: statusConfig.gradient[1],
          },
          statusConfig.isDelivered && {
            borderWidth: 1.5,
            borderColor: colors.status.successBorder,
            borderRadius: Radius.xl,
          },
          statusConfig.isFailed && {
            borderWidth: 1.5,
            borderColor: colors.status.errorBorder,
            borderRadius: Radius.xl,
          },
        ]}
      >
        <Pressable onPress={handlePress} style={styles.pressable}>
          <LinearGradient
            colors={statusConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.leftContainer}>
              <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
              <View style={styles.iconCircle}>
                <Animated.View style={iconAnimatedStyle}>
                  <Ionicons
                    name={statusConfig.icon}
                    size={18}
                    color="#FFFFFF"
                  />
                </Animated.View>
              </View>
            </View>

            <View style={styles.middleContainer}>
              <View style={styles.metaRow}>
                <Text style={styles.orderNumberText}>
                  Order #{activeOrder.order_number}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {statusConfig.statusBadge}
                  </Text>
                </View>
              </View>
              <Text style={styles.statusDescription} numberOfLines={1}>
                {statusConfig.text}
              </Text>
            </View>

            <View style={styles.rightContainer}>
              {showHomeDismiss ? (
                <TouchableOpacity
                  style={[
                    styles.dismissBtn,
                    { backgroundColor: colors.overlay.medium },
                  ]}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.progressTracker}>
                  <View
                    style={[
                      styles.progressDot,
                      statusConfig.progress >= 1
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressLine,
                      statusConfig.progress >= 2
                        ? styles.lineActive
                        : styles.lineInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressDot,
                      statusConfig.progress >= 2
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressLine,
                      statusConfig.progress >= 3
                        ? styles.lineActive
                        : styles.lineInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressDot,
                      statusConfig.progress >= 3
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressLine,
                      statusConfig.progress >= 4
                        ? styles.lineActive
                        : styles.lineInactive,
                    ]}
                  />
                  <View
                    style={[
                      styles.progressDot,
                      statusConfig.progress >= 4
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                </View>
              )}
              {!showHomeDismiss && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Mode B: Draggable FAB with full drag-feedback system ───
  return (
    <Animated.View
      key="global-order-bar-fab"
      {...panResponder.panHandlers}
      entering={FadeInRight.duration(350).springify().damping(15)}
      exiting={FadeOut.duration(150)}
      style={[
        styles.fabContainer,
        fabAnimatedStyle,
        { shadowColor: statusConfig.gradient[1] },
        statusConfig.isDelivered && {
          borderWidth: 1.5,
          borderColor: colors.status.successBorder,
          borderRadius: FAB_SIZE / 2,
        },
        statusConfig.isFailed && {
          borderWidth: 1.5,
          borderColor: colors.status.errorBorder,
          borderRadius: FAB_SIZE / 2,
        },
      ]}
    >
      {/* ── ④ Circular progress ring ──────────────────────── */}
      <View style={styles.ringContainer}>
        {/* Track (always faintly visible) */}
        <Animated.View style={[styles.ringTrack, ringTrackStyle]} />

        {/* Right half arc (0 → 50 % of threshold) */}
        <View style={styles.ringClipRight}>
          <Animated.View style={[styles.ringHalfRight, rightHalfStyle]} />
        </View>

        {/* Left half arc (50 → 100 % of threshold) */}
        <View style={styles.ringClipLeft}>
          <Animated.View style={[styles.ringHalfLeft, leftHalfStyle]} />
        </View>
      </View>

      {/* ── FAB body ──────────────────────────────────────── */}
      <Pressable onPress={handlePress} style={styles.fabPressable}>
        <LinearGradient
          colors={statusConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          {/* Pulse ring (breathing) */}
          <Animated.View style={[styles.fabPulseRing, pulseAnimatedStyle]} />

          {/* ── ② Red danger overlay ─────────────────────── */}
          <Animated.View style={[styles.fabRedOverlay, redOverlayStyle]}>
            <LinearGradient
              colors={["#ef4444", "#b91c1c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            />
          </Animated.View>

          {/* ── ⑥ Drag-hint chevron (at rest) ────────────── */}
          <Animated.View style={[styles.hintChevron, hintChevronStyle]}>
            <Ionicons
              name="chevron-down"
              size={9}
              color="rgba(255,255,255,0.8)"
            />
          </Animated.View>

          {/* ── ① Icon crossfade: status → X ─────────────── */}
          <View style={styles.fabIconStack}>
            <Animated.View style={statusIconStyle}>
              <Animated.View style={iconAnimatedStyle}>
                <Ionicons
                  name={statusConfig.icon}
                  size={20}
                  color="#FFFFFF"
                />
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.fabIconAbsolute, closeIconStyle]}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── ③ "Release to dismiss" label ─────────────────── */}
      <Animated.View style={[styles.dismissLabel, dismissLabelStyle]}>
        <Text style={styles.dismissLabelText}>Release to dismiss</Text>
      </Animated.View>
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
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },

  // ── FAB base ──────────────────────────────────────────────
  fabContainer: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 1000,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: "visible", // allow label + ring to paint outside
  },
  fabPressable: {
    flex: 1,
  },
  fabGradient: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fabPulseRing: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },

  // ── NEW: Red danger overlay ────────────────────────────────
  fabRedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: "hidden",
  },

  // ── NEW: Icon crossfade stack ──────────────────────────────
  fabIconStack: {
    alignItems: "center",
    justifyContent: "center",
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fabIconAbsolute: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── NEW: Drag-hint chevron ─────────────────────────────────
  hintChevron: {
    position: "absolute",
    top: 5,
    alignSelf: "center",
  },

  // ── NEW: Circular progress ring ────────────────────────────
  ringContainer: {
    position: "absolute",
    top: -RING_OFFSET,
    left: -RING_OFFSET,
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringTrack: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_HALF,
    borderWidth: RING_BORDER,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  ringClipRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: RING_HALF,
    height: RING_SIZE,
    overflow: "hidden",
  },
  ringHalfRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_HALF,
    borderWidth: RING_BORDER,
    borderColor: "#FFFFFF",
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  ringClipLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RING_HALF,
    height: RING_SIZE,
    overflow: "hidden",
  },
  ringHalfLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_HALF,
    borderWidth: RING_BORDER,
    borderColor: "#FFFFFF",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
  },

  // ── NEW: Dismiss label ─────────────────────────────────────
  dismissLabel: {
    position: "absolute",
    top: FAB_SIZE + 8,
    left: -30,
    right: -30,
    alignItems: "center",
  },
  dismissLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    letterSpacing: 0.2,
  },
});