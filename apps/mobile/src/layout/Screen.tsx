import React, {type ReactNode} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

import {colors} from '@/global/theme';

type Props = {
  children: ReactNode;
  // Which safe-area edges to inset. Defaults to top only (tab screens keep the
  // bottom edge for the tab bar).
  edges?: readonly Edge[];
  // Wrap content in a KeyboardAvoidingView (chat/AI composers, forms).
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
};

// Consistent screen chrome: safe-area insets + background + optional keyboard
// avoidance. Keeps individual screens free of boilerplate.
export function Screen({
  children,
  edges = ['top'],
  keyboardAvoiding = false,
  style,
}: Props) {
  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
      {children}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
});
