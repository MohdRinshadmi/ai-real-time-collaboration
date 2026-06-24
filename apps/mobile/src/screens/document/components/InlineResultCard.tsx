import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Button} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import type {InlineAction} from '@/hooks';

// Renders a streaming inline-AI result and the replace/dismiss controls. When
// the underlying span has gone stale (a concurrent edit moved it), replacing is
// blocked and the user is asked to re-select.
export function InlineResultCard({
  action,
  result,
  error,
  isStreaming,
  staleSpan,
  onReplace,
  onDismiss,
}: {
  action: InlineAction;
  result: string;
  error: string | null;
  isStreaming: boolean;
  staleSpan: boolean;
  onReplace: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.inlineCard}>
      <Text style={styles.inlineLabel}>
        AI · {action}
        {isStreaming ? ' …' : ''}
      </Text>
      <Text style={styles.inlineText}>{result || (error ?? 'Thinking…')}</Text>
      {staleSpan ? (
        <Text style={styles.inlineWarning}>
          The selection changed — can’t replace it safely. Re-select and try
          again.
        </Text>
      ) : null}
      {result && !isStreaming ? (
        <View style={styles.inlineActions}>
          <Button title="Replace selection" onPress={onReplace} disabled={staleSpan} />
          <Button title="Dismiss" variant="ghost" onPress={onDismiss} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineCard: {
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    gap: spacing.sm,
  },
  inlineLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  inlineText: {fontSize: fontSize.base, lineHeight: 22, color: colors.foreground},
  inlineWarning: {fontSize: fontSize.sm, color: colors.destructive},
  inlineActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
});
