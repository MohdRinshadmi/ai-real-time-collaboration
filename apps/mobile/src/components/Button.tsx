import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import {colors, fontSize, radius, spacing} from '@/global/theme';

type Variant = 'primary' | 'destructive' | 'ghost';

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'destructive'
      ? colors.destructive
      : variant === 'ghost'
        ? 'transparent'
        : colors.primary;
  const fg = variant === 'ghost' ? colors.foreground : colors.primaryForeground;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        {backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1},
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, {color: fg}]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
