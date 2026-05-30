import React, {forwardRef} from 'react';
import {StyleSheet, Text, TextInput, View, type TextInputProps} from 'react-native';

import {colors, fontSize, radius, spacing} from '@/global/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  {label, error, style, ...rest},
  ref,
) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, !!error && styles.inputError, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {gap: spacing.xs},
  label: {fontSize: fontSize.sm, fontWeight: '500', color: colors.foreground},
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  inputError: {borderColor: colors.destructive},
  error: {fontSize: fontSize.xs, color: colors.destructive},
});
