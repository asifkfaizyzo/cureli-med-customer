// src/features/orders/components/tracking/PickupStatusHero.tsx (do not remove this comment)
//
// Pickup equivalent of TrackingStatusHero.
// Shows status lines + rotating subtitle, prominent OTP block when ready,
// self-confirm button, and terminal state card for cancelled/rejected/completed.
// No ETA (customer controls when they arrive).

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';

import { useTheme } from '../../../../theme/ThemeContext';
import { useDialog } from '../../../../components/Dialog/DialogProvider';
import { ordersApi } from '../../../marketplace/api/orders.api';
import type { MobileOrderDetail } from '../../../../types/order';

interface PickupStatusHeroProps {
  order: MobileOrderDetail;
  onOrderUpdate?: () => void;
}

interface MessageConfig {
  line1: string | null;
  line2: string | null;
  subtitles: string[];
}

function buildMessages(order: MobileOrderDetail): MessageConfig {
  const status = order.status;

  if (status === 'CANCELLED') {
    return {
      line1: 'Order Cancelled',
      line2: null,
      subtitles: [order.rejection_reason || 'This order has been cancelled'],
    };
  }
  if (status === 'REJECTED') {
    return {
      line1: 'Order Rejected',
      line2: null,
      subtitles: [
        order.rejection_reason ||
          'The pharmacy could not fulfil this order',
      ],
    };
  }
  if (status === 'PLACED') {
    return {
      line1: 'Waiting for pharmacy to confirm',
      line2: null,
      subtitles: [
        'Sending your order to the pharmacy',
        'This usually takes just a moment',
        'The pharmacist will review shortly',
      ],
    };
  }
  if (status === 'ACCEPTED') {
    return {
      line1: 'Pharmacy is preparing your order',
      line2: 'Ready in a few minutes',
      subtitles: [
        'The pharmacist is picking your medicines',
        'Your order is being packed with care',
        "We'll notify you when it's ready for pickup",
      ],
    };
  }
  if (status === 'READY_FOR_PICKUP') {
    return {
      line1: 'Your order is ready for pickup',
      line2: 'Head to the pharmacy to collect',
      subtitles: [
        'Show your pickup code at the counter',
        'The pharmacy is expecting you',
        'Your medicines are packed and waiting',
      ],
    };
  }
  if (status === 'COMPLETED') {
    return {
      line1: 'Order Picked Up',
      line2: null,
      subtitles: [
        'Thank you for choosing Cureli',
        'Rate your pickup experience',
      ],
    };
  }
  return {
    line1: null,
    line2: null,
    subtitles: ['Updating order status...'],
  };
}

export function PickupStatusHero({ order, onOrderUpdate }: PickupStatusHeroProps) {
  const { colors } = useTheme();
  const { alert: showAlert, confirm: confirmDialog } = useDialog();

  const [index, setIndex] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);

  const status = order.status;
  const isReady = status === 'READY_FOR_PICKUP';

  const config = useMemo(() => buildMessages(order), [order]);

  // Rotate subtitle every 4s
  useEffect(() => {
    setIndex(0);
    if (config.subtitles.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % config.subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [config.subtitles]);

  const subtitle = config.subtitles[index] || config.subtitles[0] || '';

  // OTP pulse animation
  const otpScale = useSharedValue(1);
  useEffect(() => {
    if (isReady) {
      otpScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
      );
    }
  }, [isReady, otpScale]);

  const otpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: otpScale.value }],
  }));

  // Self-confirm pickup
  const handleConfirmPickup = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: 'Confirm Pickup',
      message: 'Have you collected your order from the pharmacy?',
      confirmLabel: 'Yes, I have it',
      cancelLabel: 'Not yet',
    });
    if (!confirmed) return;

    setIsConfirming(true);
    try {
      await ordersApi.confirmPickup(order.order_id);
      onOrderUpdate?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Could not confirm pickup. Please try again or show your code at the counter.';
      await showAlert({ title: 'Error', message: msg, confirmLabel: 'OK' });
    } finally {
      setIsConfirming(false);
    }
  }, [order.order_id, confirmDialog, showAlert, onOrderUpdate]);

  // ── Terminal state card ──────────────────────────────────────
  const isTerminal =
    status === 'CANCELLED' || status === 'REJECTED' || status === 'COMPLETED';

  if (isTerminal) {
    const isError = status === 'CANCELLED' || status === 'REJECTED';
    const icon = isError ? 'close-circle' : 'checkmark-circle';
    const color = isError ? colors.status.error : colors.status.success;
    const bg = isError ? colors.status.errorBg : colors.status.successBg;
    const border = isError
      ? colors.status.errorBorder
      : colors.status.successBorder;

    const title =
      status === 'CANCELLED'
        ? 'Order Cancelled'
        : status === 'REJECTED'
          ? 'Order Rejected'
          : 'Order Picked Up!';

    const reason =
      status === 'REJECTED'
        ? order.rejection_reason ||
          'The pharmacy could not fulfil this order'
        : status === 'CANCELLED'
          ? order.rejection_reason || 'This order has been cancelled'
          : 'Thanks for picking up your order at the pharmacy';

    return (
      <View
        style={[
          styles.terminalCard,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[styles.terminalTitle, { color }]}>{title}</Text>
        <Text
          style={[styles.terminalReason, { color: colors.text.secondary }]}
        >
          {reason}
        </Text>
        <View style={styles.terminalActions}>
          <TouchableOpacity
            style={[
              styles.terminalBtn,
              { backgroundColor: colors.brand.primary },
            ]}
            onPress={() =>
              router.push({
                pathname: '/support/raise' as any,
                params: {
                  orderId: order.order_id,
                  orderNumber: order.order_number,
                },
              })
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.terminalBtnText,
                { color: colors.brand.primaryText },
              ]}
            >
              Contact Support
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.terminalBtnOutline,
              { borderColor: colors.border.default },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.terminalBtnOutlineText,
                { color: colors.text.primary },
              ]}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active state ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* OTP Block (prominent, pulsing, only when ready) */}
      {isReady && order.delivery_otp && (
        <Animated.View
          entering={FadeInUp.duration(350)}
          style={[styles.otpBlock, otpAnimStyle]}
        >
          <Text style={[styles.otpLabel, { color: colors.status.success }]}>
            Show this code at the counter
          </Text>
          <View style={styles.otpDigits}>
            {order.delivery_otp.split('').map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.otpDigitBox,
                  {
                    backgroundColor: colors.status.successBg,
                    borderColor:
                      colors.status.successBorder ?? colors.status.success,
                  },
                ]}
              >
                <Text
                  style={[styles.otpDigit, { color: colors.status.success }]}
                >
                  {digit}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Self-confirm button (only when ready) */}
      {isReady && (
        <TouchableOpacity
          onPress={handleConfirmPickup}
          disabled={isConfirming}
          activeOpacity={0.85}
          style={[
            styles.confirmBtn,
            { backgroundColor: colors.brand.primary },
            isConfirming && { opacity: 0.6 },
          ]}
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#fff"
            />
          )}
          <Text style={styles.confirmBtnText}>
            {isConfirming ? 'Confirming…' : "I've Picked Up My Order"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Dual status lines */}
      {config.line1 && (
        <Text
          style={[styles.line1, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {config.line1}
        </Text>
      )}
      {config.line2 && (
        <Text
          style={[styles.line2, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {config.line2}
        </Text>
      )}

      {/* Rotating subtitle */}
      <View style={styles.subtitleContainer}>
        <Animated.Text
          key={subtitle}
          entering={FadeInUp.duration(250)}
          exiting={FadeOutDown.duration(200)}
          style={[styles.subtitle, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {subtitle}
        </Animated.Text>
      </View>

      {/* Order number */}
      <Text style={[styles.orderNum, { color: colors.text.faint }]}>
        #{order.order_number}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingVertical: 4,
  },
  otpBlock: {
    gap: 8,
    marginBottom: 10,
  },
  otpLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpDigits: {
    flexDirection: 'row',
    gap: 8,
  },
  otpDigitBox: {
    width: 40,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  line1: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  line2: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  subtitleContainer: {
    height: 18,
    justifyContent: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  orderNum: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  // Terminal
  terminalCard: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  terminalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
  },
  terminalReason: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  terminalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  terminalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  terminalBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  terminalBtnOutline: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  terminalBtnOutlineText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});