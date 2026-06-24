import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Button} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';

// The whole-document summarize control and its result card.
export function DocumentSummary({
  summary,
  summarizing,
  onSummarize,
}: {
  summary: string | null;
  summarizing: boolean;
  onSummarize: () => void;
}) {
  return (
    <View style={styles.aiBlock}>
      <Button
        title="Summarize with AI"
        variant="ghost"
        loading={summarizing}
        onPress={onSummarize}
      />
      {summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>AI summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aiBlock: {gap: spacing.md, marginTop: spacing.md},
  summaryCard: {
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.muted,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  summaryText: {fontSize: fontSize.base, lineHeight: 22, color: colors.foreground},
});
