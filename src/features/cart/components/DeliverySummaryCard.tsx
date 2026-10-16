// src/features/cart/components/DeliverySummaryCard.tsx (do not remove this comment)
// src/features/cart/components/DeliverySummaryCard.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDialog } from "../../../components/Dialog/DialogProvider";

import { useDeliveryETA } from "../../../hooks/useDeliveryETA";
import { useCartStore, type CartItem } from "../../../store/cartStore";
import { useCheckoutStore } from "../../../store/checkoutStore";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { getPlaceholder } from "../../../utils/placeholderImage";

// ── Quantity selector ─────────────────────────────────────────

function QuantitySelector({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  const { confirm: confirmDialog } = useDialog();
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = useCallback(async () => {
    if (item.quantity === 1) {
      const confirmed = await confirmDialog({
        title: "Remove Item",
        message: `Remove ${item.name} from cart?`,
        confirmLabel: "Remove",
        cancelLabel: "Cancel",
        destructive: true,
      });

      if (confirmed) {
        removeItem(item.variantId);
      }
    } else {
      decrementItem(item.variantId);
    }
  }, [item, decrementItem, removeItem, confirmDialog]);

  const handleIncrement = useCallback(() => {
    incrementItem(item.variantId);
  }, [item.variantId, incrementItem]);

  return (
    <View
      style={[
        styles.qtySelector,
        {
          backgroundColor: colors.brand.primary,
          borderColor: colors.brand.primary,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleDecrement}
        activeOpacity={0.7}
        style={styles.qtyBtn}
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={14} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.qtyCount}>{item.quantity}</Text>
      <TouchableOpacity
        onPress={handleIncrement}
        activeOpacity={0.7}
        style={styles.qtyBtn}
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Cart item image ───────────────────────────────────────────

function CartItemImage({ uri }: { uri: string | null }) {
  const { colors, isDark } = useTheme();
  const placeholder = getPlaceholder(isDark);
  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;

  return (
    <View
      style={[
        styles.imageBox,
        {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {showPlaceholder ? (
        <Animated.Image
          source={placeholder}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}

      {uri && !imageError ? (
        <Animated.Image
          source={{ uri }}
          style={[
            styles.image,
            styles.realImageOverlay,
            realImageAnimatedStyle,
          ]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
    </View>
  );
}

// ── Cart item row ─────────────────────────────────────────────

function CartItemRow({
  item,
  isLast,
  zebra,
}: {
  item: CartItem;
  isLast: boolean;
  zebra: boolean;
}) {
  const { colors } = useTheme();
  const lineTotal = item.pricePerUnit * item.quantity;

  return (
    <View
      style={[
        styles.itemRow,
        zebra && {
          backgroundColor: colors.background.tint,
          marginHorizontal: -10,
          paddingHorizontal: 10,
          borderRadius: 10,
        },
      ]}
    >
      <CartItemImage uri={item.image ?? null} />

      <View style={styles.itemDetails}>
        <Text
          style={[styles.itemName, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.manufacturer ? (
          <Text
            style={[styles.itemMeta, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {item.manufacturer}
          </Text>
        ) : null}

        <View style={styles.itemPriceRow}>
          <Text style={[styles.itemUnitPrice, { color: colors.text.faint }]}>
            ₹{item.pricePerUnit} × {item.quantity}
          </Text>
          <Text style={[styles.itemLineTotal, { color: colors.text.primary }]}>
            ₹{lineTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      <QuantitySelector item={item} />

      {/* Subtle separator between items */}
      {!isLast && (
        <View
          style={[
            styles.itemSeparator,
            { backgroundColor: colors.border.subtle },
          ]}
        />
      )}
    </View>
  );
}

// ── ETA header ────────────────────────────────────────────────

function ETAHeader({
  itemCount,
  durationText,
  distanceText,
  isLoading,
  isSameDay,
  isPickup,
}: {
  itemCount: number;
  durationText: string | null;
  distanceText: string | null;
  isLoading: boolean;
  isSameDay?: boolean;
  isPickup?: boolean;
}) {
  const { colors } = useTheme();

  const etaLine = (() => {
    if (isPickup) return "Ready for pickup";
    if (isSameDay) return "Delivered by end of day";
    if (isLoading) return null;
    if (durationText) return `Delivery in ${durationText}`;
    return "Estimating delivery time…";
  })();

  const subtitleLine = (() => {
    const base = itemCount === 1 ? "1 item" : `${itemCount} items`;
    if (isPickup || isSameDay) return base;
    if (distanceText && durationText) return `${base} · ${distanceText} away`;
    return base;
  })();

  const iconName = isPickup
    ? "storefront-outline"
    : isSameDay
      ? "calendar-outline"
      : "time-outline";

  return (
    <View style={styles.etaSection}>
      <View style={styles.etaHeader}>
        <View
          style={[styles.iconWrap, { backgroundColor: colors.background.tint }]}
        >
          {isLoading && !isSameDay && !isPickup ? (
            <ActivityIndicator size={18} color={colors.brand.primary} />
          ) : (
            <Ionicons name={iconName} size={20} color={colors.brand.primary} />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.eta, { color: colors.text.primary }]}>
            {etaLine ?? "Calculating…"}
          </Text>
          <Text style={[styles.shipment, { color: colors.text.muted }]}>
            {subtitleLine}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Dashed divider ────────────────────────────────────────────

function DashedDivider({ color }: { color: string }) {
  return (
    <View style={styles.dashedWrap}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={[styles.dash, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────

export function DeliverySummaryCard() {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);
  const cartPharmacy = useCartStore((s) => s.cartPharmacy);
  const location = useDeliveryLocationStore((s) => s.location);
  const fulfillmentType = useCheckoutStore((s) => s.fulfillmentType);
  const isSameDay = fulfillmentType === "SAME_DAY";
  const isPickup = fulfillmentType === "PICKUP";

  const pharmacy = cartPharmacy();

  const firstItem = items[0] as
    | (CartItem & {
        branchLatitude?: number | null;
        branchLongitude?: number | null;
      })
    | undefined;

  const branchLat = firstItem?.branchLatitude ?? null;
  const branchLng = firstItem?.branchLongitude ?? null;
  const userLat = location.latitude;
  const userLng = location.longitude;

  const {
    durationText,
    distanceText,
    isLoading: etaLoading,
  } = useDeliveryETA(userLat, userLng, branchLat, branchLng);

  return (
    <View style={styles.cardOuter}>
      <View
        style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]}
      />
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View
            style={[
              styles.titleIconWrap,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="cart-outline"
              size={14}
              color={colors.brand.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Order Summary
          </Text>
          <View
            style={[
              styles.titleUnderline,
              { backgroundColor: colors.brand.primary },
            ]}
          />
        </View>

        <ETAHeader
          itemCount={items.length}
          durationText={durationText}
          distanceText={distanceText}
          isLoading={etaLoading}
          isSameDay={isSameDay}
          isPickup={isPickup}
        />

        <DashedDivider color={colors.border.default} />

        {/* ── Items micro-label ── */}
        <Text style={[styles.sectionLabel, { color: colors.text.faint }]}>
          ITEMS ({items.length})
        </Text>

        {items.map((item, index) => (
          <CartItemRow
            key={item.variantId}
            item={item}
            isLast={index === items.length - 1}
            zebra={index % 2 === 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Card shell with left accent ──
  cardOuter: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: "#090025",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 8,
  },
  titleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  titleUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.08,
    marginLeft: 4,
  },

  // ── Section micro-label ──
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 2,
  },

  // ── ETA ──
  etaSection: {
    marginBottom: 4,
  },
  etaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  eta: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  shipment: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // ── Dashed divider ──
  dashedWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    overflow: "hidden",
  },
  dash: {
    width: 4,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.5,
  },

  // ── Item rows ──
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    paddingVertical: 6,
    position: "relative",
  },
  itemSeparator: {
    position: "absolute",
    bottom: -2,
    left: 68,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  realImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingRight: 4,
  },
  itemUnitPrice: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  itemLineTotal: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Quantity selector ──
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    width: 84,
    height: 30,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1,
  },
  qtyBtn: {
    width: 28,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyCount: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
});
