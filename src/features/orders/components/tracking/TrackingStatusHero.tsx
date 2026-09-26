// src/features/orders/components/tracking/TrackingStatusHero.tsx
//
// Slot A — The hero of the tracking bottom sheet.
// Shows ETA countdown during transit, dual status lines,
// rotating subtitle, and morphs into OTP display on arrival.
// Handles terminal states (cancelled/rejected/delivered) with
// appropriate color and action buttons.

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { router } from 'expo-router';

import { useTheme } from '../../../../theme/ThemeContext';
import { useRotatingMessage } from './hooks/useRotatingMessage';
import { useLiveETA } from './hooks/useLiveETA';
import type { MobileOrderDetail } from '../../../../types/order';

interface TrackingStatusHeroProps {
  order: MobileOrderDetail;
}

export function TrackingStatusHero({ order }: TrackingStatusHeroProps) {
  const { colors } = useTheme();
  const { line1, line2, subtitle } = useRotatingMessage(order);
  const { etaMinutes, isStale, isArriving } = useLiveETA(order);

  const ds = order.delivery?.status;
  const status = order.status;

  // ── Terminal state detection ─────────────────────────────────
  const isTerminal = useMemo(() => {
    if (status === 'CANCELLED' || status === 'REJECTED') return status;
    if (ds === 'DELIVERED') return 'DELIVERED';
    if (ds === 'FAILED') return 'FAILED';
    return null;
  }, [status, ds]);

  const isArrived = ds === 'ARRIVED_AT_CUSTOMER';
  const showOtp = isArrived && order.delivery_otp;

  // ── ETA display text ─────────────────────────────────────────
  const etaText = useMemo(() => {
    if (isArriving) return 'Arriving now';
    if (etaMinutes == null) return null;
    if (isStale) return `~${etaMinutes} min (updating...)`;
    return `Arriving in ~${etaMinutes} min`;
  }, [etaMinutes, isStale, isArriving]);

  // ── Terminal state rendering ─────────────────────────────────
  if (isTerminal) {
    const isError = isTerminal === 'CANCELLED' || isTerminal === 'REJECTED' || isTerminal === 'FAILED';
    const icon = isError ? 'close-circle' : 'checkmark-circle';
    const color = isError ? colors.status.error : colors.status.success;
    const bg = isError ? colors.status.errorBg : colors.status.successBg;
    const border = isError ? colors.status.errorBorder : colors.status.successBorder;

    const title =
      isTerminal === 'CANCELLED' ? 'Order Cancelled' :
      isTerminal === 'REJECTED' ? 'Order Rejected' :
      isTerminal === 'FAILED' ? 'Delivery Failed' :
      'Order Delivered!';

    const reason =
      isTerminal === 'REJECTED'
        ? order.rejection_reason || 'The pharmacy could not fulfil this order'
        : isTerminal === 'FAILED'
          ? 'Your delivery could not be completed'
          : isTerminal === 'CANCELLED'
            ? 'This order has been cancelled'
            : 'Your medicines have been delivered successfully';

    return (
      <View style={[styles.terminalCard, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[styles.terminalTitle, { color }]}>{title}</Text>
        <Text style={[styles.terminalReason, { color: colors.text.secondary }]}>
          {reason}
        </Text>
        <View style={styles.terminalActions}>
          <TouchableOpacity
            style={[styles.terminalBtn, { backgroundColor: colors.brand.primary }]}
            onPress={() =>
              router.push({
                pathname: '/support/raise' as any,
                params: { orderId: order.order_id, orderNumber: order.order_number },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={[styles.terminalBtnText, { color: colors.brand.primaryText }]}>
              Contact Support
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.terminalBtnOutline, { borderColor: colors.border.default }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.terminalBtnOutlineText, { color: colors.text.primary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active tracking rendering ────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ETA Hero Line (only during transit) */}
      {etaText && (
        <View style={styles.etaRow}>
          <Ionicons
            name={isArriving ? 'location' : 'time-outline'}
            size={18}
            color={isArriving ? colors.status.success : colors.brand.primary}
          />
          <Text
            style={[
              styles.etaText,
              {
                color: isArriving ? colors.status.success : colors.brand.primary,
              },
            ]}
          >
            {etaText}
          </Text>
          {isStale && !isArriving && (
            <View style={[styles.stalePill, { backgroundColor: colors.status.warningBg }]}>
              <Ionicons name="cloud-offline-outline" size={10} color={colors.status.warning} />
            </View>
          )}
        </View>
      )}

      {/* OTP Display (morphs in when arrived) */}
      {showOtp && (
        <Animated.View entering={FadeInUp.duration(350)} style={styles.otpBlock}>
          <Text style={[styles.otpLabel, { color: colors.status.success }]}>
            Share this PIN with your rider
          </Text>
          <View style={styles.otpDigits}>
            {order.delivery_otp!.split('').map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.otpDigitBox,
                  {
                    backgroundColor: colors.status.successBg,
                    borderColor: colors.status.successBorder,
                  },
                ]}
              >
                <Text style={[styles.otpDigit, { color: colors.status.success }]}>
                  {digit}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Dual Status Lines */}
      {line1 && (
        <Text style={[styles.line1, { color: colors.text.primary }]} numberOfLines={1}>
          {line1}
        </Text>
      )}
      {line2 && (
        <Text style={[styles.line2, { color: colors.text.secondary }]} numberOfLines={1}>
          {line2}
        </Text>
      )}

      {/* Rotating Subtitle */}
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

      {/* Order Number Tag */}
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
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  etaText: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
  },
  stalePill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBlock: {
    gap: 8,
    marginBottom: 8,
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
  // Terminal states
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