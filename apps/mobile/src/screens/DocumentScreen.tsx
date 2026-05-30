import React, {useLayoutEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';

import {documentsApi, type DocDetail} from '@/api';
import {Button} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import {Screen} from '@/layout';
import type {WorkspaceStackParamList} from '@/routes/types';
import {extractText} from '@/utils';

// Port of the web document view. The full collaborative CRDT editor
// (TipTap + Yjs) is web-only; here we render a read view + AI summarisation.
export function DocumentScreen() {
  const route = useRoute<RouteProp<WorkspaceStackParamList, 'Document'>>();
  const navigation = useNavigation();
  const {docId, title} = route.params;
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({title});
  }, [navigation, title]);

  const {data, isLoading, isError} = useQuery<DocDetail>({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.getDocument(docId),
  });

  const body =
    data?.plainText ?? (data?.content ? extractText(data.content).trim() : '');

  const summarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await documentsApi.summarizeDocument(docId, 'short');
      setSummary(res.summary);
    } catch {
      setSummary('Could not generate a summary right now.');
    } finally {
      setSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <Screen edges={['bottom']} style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {data?.icon ? `${data.icon} ` : ''}
          {data?.title ?? title}
        </Text>

        {isError ? (
          <Text style={styles.notice}>Couldn’t load this document.</Text>
        ) : (
          <Text style={styles.body}>{body || 'This document is empty.'}</Text>
        )}

        <View style={styles.aiBlock}>
          <Button
            title="Summarize with AI"
            variant="ghost"
            loading={summarizing}
            onPress={summarize}
          />
          {summary ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>AI summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
  content: {padding: spacing.xl, gap: spacing.lg},
  title: {fontSize: fontSize['2xl'], fontWeight: '700', color: colors.foreground},
  notice: {fontSize: fontSize.sm, color: colors.destructive},
  body: {fontSize: fontSize.base, lineHeight: 24, color: colors.foreground},
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
