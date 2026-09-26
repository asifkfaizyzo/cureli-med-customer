// src/features/orders/screens/OrderDetailScreen.tsx (do not remove this comment)
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

import { useDialog } from "../../../components/Dialog/DialogProvider";
import { RemoteImage } from "../../../components/RemoteImage";
import { useOrderNotificationStore } from "../../../store/orderNotificationStore";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  MobileOrderDetail,
  MobileOrderPrescription,
  ReorderItemsResponse,
} from "../../../types/order";
import { ordersApi } from "../../marketplace/api/orders.api";
import { PriceRow } from "../components/PriceRow";
import { ReorderSheet } from "../components/ReorderSheet";
import {
  formatDeliveryDate,
  getRejectionLabel,
  getStatusColorKey,
  getStatusColors,
  getStatusIcon,
  getStatusLabel,
  type StatusColorKey,
} from "../constants/orders.constants";
import { ActiveTrackingScreen } from "./ActiveTrackingScreen";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "REJECTED"]);
const INVOICE_STATUSES = new Set(["READY_FOR_PICKUP", "COMPLETED"]);

function safeNum(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

function getRelativeTime(dateString: string): string | null {
  try {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return null;
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return null;
  } catch {
    return null;
  }
}

// ── Branded Smooth Loading Transition ───────────────────────────
function OrderDetailLoader() {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900 }),
        withTiming(0.4, { duration: 900 }),
      ),
      -1,
    );
  }, [scale, opacity]);

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.loaderCenter}>
        <View style={styles.loaderGlowWrap}>
          <Animated.View
            style={[
              styles.loaderGlow,
              { backgroundColor: colors.background.tint },
              animatedGlow,
            ]}
          />
          <View
            style={[
              styles.loaderCore,
              { backgroundColor: colors.background.card, borderColor: colors.border.brand },
            ]}
          >
            <Ionicons name="navigate" size={26} color={colors.brand.primary} />
          </View>
        </View>

        <Text style={[styles.loaderTitle, { color: colors.text.primary }]}>
          Connecting to pharmacy...
        </Text>
        <Text style={[styles.loaderSub, { color: colors.text.muted }]}>
          Preparing live tracking
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface ImagePreviewModalProps {
  url: string;
  name: string;
  colors: any;
  onClose: () => void;
}

function ImagePreviewModal({ url, name, onClose }: ImagePreviewModalProps) {
  const { width, height } = Dimensions.get("window");
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={previewStyles.backdrop}>
        <StatusBar
          backgroundColor="rgba(0,0,0,0.95)"
          barStyle="light-content"
        />
        <View style={previewStyles.header}>
          <Text style={previewStyles.headerName} numberOfLines={1}>
            {name}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={previewStyles.closeBtn}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: url }}
          style={{ width, height: height * 0.8 }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const previewStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  headerName: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginRight: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});

interface PrescriptionRowProps {
  prescription: MobileOrderPrescription;
  orderId: string;
  colors: any;
}

function PrescriptionRow({
  prescription,
  orderId,
  colors,
}: PrescriptionRowProps) {
  const { alert: showAlert } = useDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = prescription.mime_type.startsWith("image/");
  const isPdf = prescription.mime_type === "application/pdf";
  const isExpired = prescription.is_expired;
  const iconName = isPdf ? "document-outline" : "image-outline";

  const handlePress = useCallback(async () => {
    if (isExpired) return;
    setIsLoading(true);
    try {
      const res = await ordersApi.getPrescriptionUrl(
        orderId,
        prescription.prescription_id,
      );
      const url = res.data?.data?.url;
      if (!url) return;
      if (isImage) {
        setPreviewUrl(url);
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (err: any) {
      if (err?.response?.status === 410) {
        await showAlert({
          title: "Expired",
          message: "This prescription file has been deleted.",
          confirmLabel: "OK",
        });
      } else {
        await showAlert({
          title: "Error",
          message: "Could not open prescription.",
          confirmLabel: "OK",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [prescription, orderId, isImage, isExpired, showAlert]);

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isExpired || isLoading}
        activeOpacity={isExpired ? 1 : 0.7}
        style={[
          styles.prescriptionRow,
          {
            backgroundColor: isExpired
              ? colors.background.elevated
              : colors.background.tint,
            borderColor: colors.border.subtle,
            opacity: isExpired ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons
          name={iconName as any}
          size={18}
          color={isExpired ? colors.text.disabled : colors.text.brand}
        />
        <Text
          style={[
            styles.prescriptionName,
            {
              color: isExpired ? colors.text.disabled : colors.text.secondary,
              fontFamily: "Inter_400Regular",
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {prescription.original_name}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text.brand} />
        ) : isExpired ? (
          <Text
            style={[
              styles.expiredLabel,
              { color: colors.text.disabled, fontFamily: "Inter_400Regular" },
            ]}
          >
            Expired
          </Text>
        ) : (
          <View style={styles.prescriptionActionHint}>
            <Text
              style={[
                styles.prescriptionActionText,
                { color: colors.text.brand, fontFamily: "Inter_500Medium" },
              ]}
            >
              {isImage ? "Preview" : "Open"}
            </Text>
            <Ionicons
              name={isImage ? "eye-outline" : "open-outline"}
              size={15}
              color={colors.text.brand}
            />
          </View>
        )}
      </TouchableOpacity>

      {previewUrl != null && isImage && (
        <ImagePreviewModal
          url={previewUrl}
          name={prescription.original_name}
          colors={colors}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { colors } = useTheme();
  const { confirm: confirmDialog, alert: showAlert } = useDialog();
  const brandColor = colors.brand.primary;

  const lastStatusUpdate = useOrderNotificationStore((s) => s.lastStatusUpdate);
  const clearLastStatusUpdate = useOrderNotificationStore(
    (s) => s.clearLastStatusUpdate,
  );

  const [order, setOrder] = useState<MobileOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  const [reorderData, setReorderData] = useState<ReorderItemsResponse | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await ordersApi.getOrderDetail(orderId);
      setOrder(res.data.data);
    } catch (err) {
      console.error("[OrderDetailScreen] fetchDetail error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!lastStatusUpdate) return;
    if (lastStatusUpdate.order_id !== orderId) return;
    fetchDetail();
    clearLastStatusUpdate();
  }, [lastStatusUpdate, orderId, fetchDetail, clearLastStatusUpdate]);

  useEffect(() => {
    if (!order) return;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (TERMINAL_STATUSES.has(order.status)) return;
    pollingIntervalRef.current = setInterval(fetchDetail, 30_000);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [order?.status, fetchDetail]);

  const handleCancel = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      confirmLabel: "Yes, Cancel",
      cancelLabel: "No",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await ordersApi.cancelOrder(orderId);
      fetchDetail();
    } catch (err: any) {
      await showAlert({
        title: "Cancel Failed",
        message: err.response?.data?.message || "Could not cancel order.",
        confirmLabel: "OK",
      });
    }
  }, [orderId, fetchDetail, confirmDialog, showAlert]);

  const handleReorder = useCallback(async () => {
    setReorderLoading(true);
    try {
      const res = await ordersApi.getReorderItems(orderId);
      const data: ReorderItemsResponse = res.data.data;
      if (data.available.length === 0 && data.unavailable.length > 0) {
        await showAlert({
          title: "Items Unavailable",
          message: "None of the items are currently available.",
          confirmLabel: "OK",
        });
        return;
      }
      setReorderData(data);
      setReorderSheetVisible(true);
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Could not load reorder information.",
        confirmLabel: "OK",
      });
    } finally {
      setReorderLoading(false);
    }
  }, [orderId, showAlert]);

  const handleDownloadInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    try {
      const res = await ordersApi.getInvoiceUrl(orderId);
      const url = res.data?.data?.url;
      if (!url) {
        await showAlert({
          title: "Not Available",
          message: "Invoice is not ready yet. Please try again shortly.",
          confirmLabel: "OK",
        });
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch (err: any) {
      const msg =
        err?.response?.status === 404
          ? "Invoice not yet generated. The pharmacy may still be processing your order."
          : "Could not open invoice. Please try again.";
      await showAlert({ title: "Error", message: msg, confirmLabel: "OK" });
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, showAlert]);

  // Calculations
  const billSubtotal = useMemo(() => {
    if (!order) return 0;
    return (
      safeNum(order.subtotal) ??
      order.items.reduce(
        (sum, item) => sum + (safeNum(item.line_total) ?? 0),
        0,
      )
    );
  }, [order]);

  const billServiceCharge = useMemo(
    () => (order ? safeNum(order.service_charge) : null),
    [order],
  );
  const billDeliveryFee = useMemo(
    () => (order ? safeNum(order.delivery_fee) : null),
    [order],
  );
  const billKmSurcharge = useMemo(
    () => (order ? safeNum(order.km_surcharge) : null),
    [order],
  );
  const billTip = useMemo(() => (order ? safeNum(order.tip) : null), [order]);

  const billGrandTotal = useMemo(() => {
    if (!order) return 0;
    return (
      safeNum(order.grand_total) ?? safeNum(order.total_amount) ?? billSubtotal
    );
  }, [order, billSubtotal]);

  const billOtherCharges = useMemo(() => {
    const hasBreakdown =
      billServiceCharge != null ||
      billDeliveryFee != null ||
      billKmSurcharge != null;
    if (hasBreakdown) return null;
    const knownTotal = safeNum(order?.grand_total) ?? safeNum(order?.total_amount);
    if (knownTotal == null) return null;
    const gap = knownTotal - billSubtotal;
    return gap > 0.01 ? gap : null;
  }, [order, billSubtotal, billServiceCharge, billDeliveryFee, billKmSurcharge]);

  // ── 1. Branded Loading State (No Flash) ────────────────────────
  if (isLoading) {
    return <OrderDetailLoader />;
  }

  // ── 2. Error Fallback ──────────────────────────────────────────
  if (!order) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <Text
            style={[
              styles.notFoundText,
              { color: colors.text.primary, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Order not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: brandColor, fontFamily: "Inter_600SemiBold" }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── 3. Smart Switchboard: Active orders → Live Tracking View ───
  const isOrderActive = !TERMINAL_STATUSES.has(order.status);
  if (isOrderActive) {
    return <ActiveTrackingScreen order={order} onBack={() => router.back()} />;
  }

  // ── 4. Terminal Orders View (COMPLETED / CANCELLED / REJECTED) ──
  const isRefunded =
    order.status === "CANCELLED" && order.payment_status === "REFUNDED";

  const colorKey: StatusColorKey = isRefunded
    ? "success"
    : getStatusColorKey(order.status);
  const statusIcon = (
    isRefunded ? "refresh-circle-outline" : getStatusIcon(order.status)
  ) as any;
  const statusLabel = isRefunded ? "Refunded" : getStatusLabel(order.status);

  const { fg: statusFg, bg: statusBg } = getStatusColors(colorKey, colors);

  const addr = order.delivery_address;
  const addressLine = addr
    ? [
        addr.address_line_1,
        addr.address_line_2,
        addr.landmark,
        addr.city,
        addr.state,
        addr.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

  const orderInfoRows = [
    { icon: "receipt-outline", label: "Order ID", value: order.order_number },
    {
      icon: "storefront-outline",
      label: "Shop",
      value: order.shop_name ?? "—",
    },
    {
      icon: "git-branch-outline",
      label: "Branch",
      value: order.branch_name ?? "—",
    },
    { icon: "location-outline", label: "Delivery Address", value: addressLine },
    {
      icon: "wallet-outline",
      label: "Payment",
      value: (() => {
        const method = order.payment_method ?? "COD";
        const status = order.payment_status;

        let methodLabel = method;
        if (method.startsWith("RAZORPAY_")) {
          const mode = method.replace("RAZORPAY_", "");
          const modeMap: Record<string, string> = {
            UPI: "UPI",
            CARD: "Card",
            NETBANKING: "Net Banking",
            WALLET: "Wallet",
            EMI: "EMI",
          };
          methodLabel = modeMap[mode] ?? "Online";
        } else if (method === "RAZORPAY") {
          methodLabel = "Online";
        } else if (method === "COD") {
          methodLabel = "Cash on Delivery";
        }

        if (status === "PAID") return `${methodLabel} · Paid`;
        if (status === "REFUNDED") return `${methodLabel} · Refunded`;
        if (status === "PARTIALLY_REFUNDED")
          return `${methodLabel} · Partially Refunded`;
        if (status === "FAILED") return `${methodLabel} · Failed`;
        if (status === "PENDING") return `${methodLabel} · Pending`;
        return methodLabel;
      })(),
    },
    {
      icon: "time-outline",
      label: "Order Placed",
      value: formatDeliveryDate(order.placed_at),
    },
    ...(order.notes
      ? [
          {
            icon: "chatbubble-outline",
            label: "Delivery Instructions",
            value: order.notes,
          },
        ]
      : []),
  ];

  const showInvoiceButton = INVOICE_STATUSES.has(order.status);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          Order Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon} size={16} color={statusFg} />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: statusFg, fontFamily: "Inter_700Bold" },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryMeta,
                { color: colors.text.faint, fontFamily: "Inter_400Regular" },
              ]}
            >
              {order.order_number} · {order.items.length} item
              {order.items.length !== 1 ? "s" : ""}
            </Text>
            {order.status === "REJECTED" && order.rejection_reason && (
              <View
                style={[
                  styles.rejectionBanner,
                  { backgroundColor: colors.status.errorBg },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={colors.status.error}
                />
                <Text
                  style={[
                    styles.rejectionText,
                    {
                      color: colors.status.error,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  Reason:{" "}
                  {order.rejection_reason_other
                    ? order.rejection_reason_other
                    : getRejectionLabel(order.rejection_reason)}
                </Text>
              </View>
            )}
          </View>

          {order.items.map((item, index) => {
            const showMrpDiscount = item.mrp > item.unit_price;

            return (
              <View key={item.item_id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.itemDivider,
                      { backgroundColor: colors.border.subtle },
                    ]}
                  />
                )}
                <View style={styles.itemRow}>
                  <RemoteImage
                    uri={(item as any).image_url ?? null}
                    style={[
                      styles.itemImageWrap,
                      {
                        backgroundColor: colors.background.elevated,
                        borderColor: colors.border.subtle,
                      },
                    ]}
                    resizeMode="contain"
                    mode="medicine"
                  />
                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.itemName,
                        {
                          color: colors.text.primary,
                          fontFamily: "Inter_600SemiBold",
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.medicine_name}
                    </Text>
                    {item.brand && (
                      <Text
                        style={[
                          styles.itemBrand,
                          {
                            color: colors.text.faint,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        {item.brand}
                        {item.pack_size ? ` · ${item.pack_size}` : ""}
                      </Text>
                    )}

                    <View style={styles.priceContainer}>
                      <Text
                        style={[
                          styles.itemQty,
                          {
                            color: colors.text.muted,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        Qty: {item.quantity} · {formatCurrency(item.unit_price)}
                      </Text>
                      {showMrpDiscount && (
                        <Text
                          style={[
                            styles.originalMrp,
                            { color: colors.text.faint },
                          ]}
                        >
                          {formatCurrency(item.mrp)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.itemPrice,
                      {
                        color: colors.text.primary,
                        fontFamily: "Inter_700Bold",
                      },
                    ]}
                  >
                    {formatCurrency(safeNum(item.line_total) ?? 0)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Prescriptions */}
        {order.prescriptions.length > 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              Prescriptions
            </Text>
            <View style={styles.prescriptionList}>
              {order.prescriptions.map((p) => (
                <PrescriptionRow
                  key={p.prescription_id}
                  prescription={p}
                  orderId={orderId}
                  colors={colors}
                />
              ))}
            </View>
            {order.prescriptions.some((p) => p.is_expired) && (
              <Text
                style={[
                  styles.prescriptionExpiredNote,
                  { color: colors.text.faint, fontFamily: "Inter_400Regular" },
                ]}
              >
                Expired files are deleted after the order is resolved.
              </Text>
            )}
          </View>
        )}

        {/* Bill Details */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Bill Details
          </Text>
          <View style={styles.priceRows}>
            <PriceRow
              label="Items subtotal"
              value={formatCurrency(billSubtotal)}
            />
            {billServiceCharge != null && billServiceCharge > 0 && (
              <PriceRow
                label="Service charge"
                value={formatCurrency(billServiceCharge)}
              />
            )}
            {billDeliveryFee != null && billDeliveryFee > 0 && (
              <PriceRow
                label="Delivery fee"
                value={formatCurrency(billDeliveryFee)}
              />
            )}
            {billKmSurcharge != null && billKmSurcharge > 0 && (
              <PriceRow
                label="Distance surcharge"
                value={formatCurrency(billKmSurcharge)}
              />
            )}
            {billTip != null && billTip > 0 && (
              <PriceRow label="Tip" value={formatCurrency(billTip)} />
            )}
            {billOtherCharges != null && billOtherCharges > 0 && (
              <PriceRow
                label="Delivery & charges"
                value={formatCurrency(billOtherCharges)}
              />
            )}
            <View
              style={[
                styles.totalDivider,
                { borderTopColor: colors.border.default },
              ]}
            >
              <View
                style={[
                  styles.totalRow,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <PriceRow
                  label="Grand Total"
                  value={formatCurrency(billGrandTotal)}
                  isTotal
                />
              </View>
            </View>
          </View>
        </View>

        {/* Order Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Order Info
          </Text>
          {orderInfoRows.map((row) => (
            <View key={row.label} style={styles.metaRow}>
              <Ionicons
                name={row.icon as any}
                size={16}
                color={colors.text.muted}
              />
              <View style={styles.metaText}>
                <Text
                  style={[
                    styles.metaLabel,
                    {
                      color: colors.text.faint,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    {
                      color: colors.text.primary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Unified Timeline */}
        {(() => {
          interface TimelineEntry {
            id: string;
            label: string;
            icon: React.ComponentProps<typeof Ionicons>["name"];
            colorKey: StatusColorKey;
            date: string;
            actor: string | null;
            reason: string | null;
            isCurrent: boolean;
            sortKey: number;
          }

          const entries: TimelineEntry[] = [];

          if (
            order.payment_status === "PAID" &&
            order.payment_method !== "COD"
          ) {
            entries.push({
              id: "payment-confirmed",
              label: "Payment Confirmed",
              icon: "checkmark-circle",
              colorKey: "success",
              date: order.placed_at,
              actor: "System",
              reason: null,
              isCurrent: false,
              sortKey: new Date(order.placed_at).getTime() + 1,
            });
          }

          order.status_history.forEach((entry, index) => {
            const isPaymentOnlyEntry =
              entry.from_status === entry.to_status &&
              entry.reason?.startsWith("payment_status:");

            if (isPaymentOnlyEntry) {
              const match = entry.reason?.match(
                /payment_status:\s*(\w+)\s*→\s*(\w+)/,
              );
              if (match) {
                const newPaymentStatus = match[2];
                const isRefund =
                  newPaymentStatus === "REFUNDED" ||
                  newPaymentStatus === "PARTIALLY_REFUNDED";
                const isLatest =
                  index === order.status_history.length - 1 &&
                  order.status === "CANCELLED" &&
                  isRefund;

                entries.push({
                  id: `payment-${index}`,
                  label:
                    newPaymentStatus === "REFUNDED"
                      ? "Refunded"
                      : newPaymentStatus === "PARTIALLY_REFUNDED"
                        ? "Partially Refunded"
                        : `Payment ${newPaymentStatus}`,
                  icon: isRefund ? "refresh-circle" : "card-outline",
                  colorKey: isRefund ? "success" : "warning",
                  date: entry.created_at,
                  actor: "Admin",
                  reason:
                    entry.reason?.split("|").slice(1).join("|").trim() || null,
                  isCurrent: isLatest && isRefunded,
                  sortKey: new Date(entry.created_at).getTime(),
                });
              }
              return;
            }

            const isLatest = index === order.status_history.length - 1;
            const isCurrentStepRefund =
              isLatest && isRefunded && entry.to_status === "CANCELLED";

            entries.push({
              id: `status-${index}`,
              label: isCurrentStepRefund
                ? "Refunded"
                : getStatusLabel(entry.to_status),
              icon: isCurrentStepRefund
                ? "refresh-circle"
                : (getStatusIcon(entry.to_status) as any),
              colorKey: isCurrentStepRefund
                ? "success"
                : getStatusColorKey(entry.to_status),
              date: entry.created_at,
              actor:
                entry.changed_by_type === "customer"
                  ? "You"
                  : entry.changed_by_type === "pharmacy"
                    ? "Pharmacy"
                    : entry.changed_by_type === "cadmin"
                      ? "Admin"
                      : "System",
              reason: entry.reason,
              isCurrent: isLatest && !isRefunded,
              sortKey: new Date(entry.created_at).getTime(),
            });
          });

          entries.sort((a, b) => a.sortKey - b.sortKey);

          if (entries.length > 0) {
            entries.forEach((e) => (e.isCurrent = false));
            entries[entries.length - 1].isCurrent = true;
          }

          if (entries.length === 0) return null;

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text.primary,
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              >
                Order Timeline
              </Text>
              {entries.map((entry, index) => {
                const isLatest = entry.isCurrent;
                const isPast = !isLatest;

                const { fg: stepColor, bg: stepBg } = getStatusColors(
                  entry.colorKey,
                  colors,
                );
                const elapsed = getRelativeTime(entry.date);

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.timelineRow,
                      isLatest && {
                        backgroundColor: stepBg,
                        borderRadius: 12,
                        marginHorizontal: -8,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                      },
                    ]}
                  >
                    <View style={styles.timelineIconCol}>
                      <View
                        style={[
                          styles.timelineIconWrap,
                          {
                            backgroundColor: isLatest
                              ? stepBg
                              : colors.background.elevated,
                            borderColor: isLatest
                              ? stepColor
                              : colors.border.default,
                            borderWidth: isLatest ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name={entry.icon}
                          size={isLatest ? 16 : 14}
                          color={
                            isLatest
                              ? stepColor
                              : isPast
                                ? colors.text.muted
                                : colors.text.faint
                          }
                        />
                      </View>
                      {index < entries.length - 1 && (
                        <View
                          style={[
                            styles.timelineConnector,
                            {
                              backgroundColor: isPast
                                ? colors.border.default
                                : colors.border.subtle,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View
                      style={[
                        styles.timelineContent,
                        index < entries.length - 1 &&
                          styles.timelineContentSpaced,
                      ]}
                    >
                      <View style={styles.timelineTextRow}>
                        <Text
                          style={[
                            styles.timelineStatus,
                            {
                              color: isLatest ? stepColor : colors.text.primary,
                              fontFamily: isLatest
                                ? "Inter_700Bold"
                                : "Inter_600SemiBold",
                            },
                          ]}
                        >
                          {entry.label}
                        </Text>
                        {isLatest && (
                          <View
                            style={[
                              styles.timelineLatestBadge,
                              { backgroundColor: colors.background.card },
                            ]}
                          >
                            <Text
                              style={[
                                styles.timelineLatestText,
                                {
                                  color: stepColor,
                                  fontFamily: "Inter_600SemiBold",
                                },
                              ]}
                            >
                              Current
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.timelineDate,
                          {
                            color: colors.text.faint,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        {formatDeliveryDate(entry.date)}
                        {elapsed ? `  ·  ${elapsed}` : ""}
                      </Text>
                      {entry.actor && (
                        <View style={styles.timelineByRow}>
                          <Ionicons
                            name={
                              entry.actor === "You"
                                ? "person-outline"
                                : entry.actor === "Pharmacy"
                                  ? "storefront-outline"
                                  : entry.actor === "Admin"
                                    ? "shield-checkmark-outline"
                                    : "settings-outline"
                            }
                            size={11}
                            color={colors.text.faint}
                          />
                          <Text
                            style={[
                              styles.timelineBy,
                              {
                                color: colors.text.faint,
                                fontFamily: "Inter_400Regular",
                              },
                            ]}
                          >
                            {entry.actor}
                          </Text>
                        </View>
                      )}
                      {entry.reason && (
                        <Text
                          style={[
                            styles.timelineReason,
                            {
                              color: colors.text.muted,
                              fontFamily: "Inter_400Regular",
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {entry.reason}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.default,
          },
        ]}
      >
        {showInvoiceButton && (
          <TouchableOpacity
            style={[
              styles.invoiceButton,
              { borderColor: colors.border.default },
            ]}
            onPress={handleDownloadInvoice}
            disabled={invoiceLoading}
            activeOpacity={0.7}
          >
            {invoiceLoading ? (
              <ActivityIndicator size="small" color={brandColor} />
            ) : (
              <Ionicons
                name="document-text-outline"
                size={16}
                color={brandColor}
              />
            )}
            <Text
              style={[
                styles.invoiceButtonText,
                { color: brandColor, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {invoiceLoading ? "Opening..." : "Download Invoice"}
            </Text>
          </TouchableOpacity>
        )}

        {order.status === "COMPLETED" || isRefunded ? (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: brandColor,
                  opacity: reorderLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleReorder}
              disabled={reorderLoading}
              activeOpacity={0.8}
            >
              {reorderLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#ffffff" />
              )}
              <Text
                style={[
                  styles.actionButtonText,
                  { fontFamily: "Inter_700Bold" },
                ]}
              >
                Reorder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.invoiceButton,
                { borderColor: colors.border.default, marginTop: 4 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/support/raise" as any,
                  params: {
                    orderId: order.order_id,
                    orderNumber: order.order_number,
                  },
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={colors.text.secondary}
              />
              <Text
                style={[
                  styles.invoiceButtonText,
                  {
                    color: colors.text.secondary,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Need help with this order?
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.statusInfoBar}>
              <Ionicons name={statusIcon} size={16} color={statusFg} />
              <Text
                style={[
                  styles.statusInfoText,
                  { color: statusFg, fontFamily: "Inter_500Medium" },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.invoiceButton,
                { borderColor: colors.border.default },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/support/raise" as any,
                  params: {
                    orderId: order.order_id,
                    orderNumber: order.order_number,
                  },
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={colors.text.secondary}
              />
              <Text
                style={[
                  styles.invoiceButtonText,
                  {
                    color: colors.text.secondary,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Need help with this order?
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {reorderData && (
        <ReorderSheet
          visible={reorderSheetVisible}
          data={reorderData}
          onClose={() => {
            setReorderSheetVisible(false);
            setReorderData(null);
          }}
          onConfirm={() => {
            setReorderSheetVisible(false);
            setReorderData(null);
            router.push("/cart" as any);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderGlowWrap: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loaderGlow: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  loaderCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  loaderSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notFoundText: { fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, marginBottom: 4 },
  summaryHeader: { gap: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: 14 },
  summaryMeta: { fontSize: 13, paddingLeft: 2 },
  rejectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  rejectionText: { fontSize: 13, flex: 1 },
  itemDivider: { height: 1, marginVertical: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, lineHeight: 20 },
  itemBrand: { fontSize: 12 },
  itemQty: { fontSize: 12 },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  originalMrp: { fontSize: 12, textDecorationLine: "line-through" },
  itemPrice: { fontSize: 15, flexShrink: 0 },
  prescriptionList: { gap: 8 },
  prescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  prescriptionName: { fontSize: 13 },
  prescriptionActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  prescriptionActionText: { fontSize: 12 },
  expiredLabel: { fontSize: 11 },
  prescriptionExpiredNote: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  priceRows: { gap: 2 },
  totalDivider: { borderTopWidth: 1, marginTop: 6, paddingTop: 10 },
  totalRow: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  metaText: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 13, lineHeight: 18 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineIconCol: { alignItems: "center", width: 32 },
  timelineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },
  timelineContent: { flex: 1, gap: 3, paddingTop: 4 },
  timelineContentSpaced: { paddingBottom: 20 },
  timelineTextRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timelineStatus: { fontSize: 14 },
  timelineLatestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timelineLatestText: { fontSize: 10 },
  timelineDate: { fontSize: 12 },
  timelineByRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timelineBy: { fontSize: 11, textTransform: "capitalize" },
  timelineReason: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  bottomPad: { height: 80 },
  stickyBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  invoiceButtonText: { fontSize: 14 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: { fontSize: 15, color: "#ffffff" },
  actionNote: { fontSize: 11, textAlign: "center" },
  statusInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  statusInfoText: { fontSize: 14 },
});