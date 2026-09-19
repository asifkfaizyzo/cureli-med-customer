import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

interface KeyboardSafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  /** 
   * Extra offset if you have a custom header/navbar.
   * Default 0. If using Expo Router stack header, try 90 for iOS.
   */
  headerOffset?: number;
  /** 
   * Set to true if the screen already has its own ScrollView/FlatList.
   * This prevents double-scrolling.
   */
  hasOwnScroll?: boolean;
  /**
   * Set to true to dismiss keyboard when tapping outside inputs.
   * Default: true
   */
  dismissOnTap?: boolean;
  /**
   * Keyboard dismiss mode when scrolling.
   * Default: "none"
   */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
}

export function KeyboardSafeView({
  children,
  style,
  contentContainerStyle,
  headerOffset = 0,
  hasOwnScroll = false,
  dismissOnTap = true,
  keyboardDismissMode = 'none',
}: KeyboardSafeViewProps) {
  const { keyboardHeight } = useKeyboardHeight();

  // Dynamically calculate bottom padding so scrolled content touches the keyboard nicely
  const dynamicContentStyle = useMemo(() => {
    return [
      styles.scrollContent,
      contentContainerStyle,
      { paddingBottom: Math.max(16, keyboardHeight + 16) },
    ];
  }, [keyboardHeight, contentContainerStyle]);

  const content = hasOwnScroll ? (
    <View style={styles.container}>{children}</View>
  ) : (
    <ScrollView
      style={styles.container}
      contentContainerStyle={dynamicContentStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
    >
      {children}
    </ScrollView>
  );

  const wrapped = dismissOnTap ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  ) : (
    content
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerOffset : 0}
    >
      {wrapped}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});