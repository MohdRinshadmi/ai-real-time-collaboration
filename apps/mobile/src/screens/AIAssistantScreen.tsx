import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {Button} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import {useStreamChat, useWorkspace} from '@/hooks';
import {Screen} from '@/layout';

// Port of apps/web/src/features/ai-assistant/components/AIChatPanel.tsx.
// Streams tokens over SSE and renders citations the RAG pipeline returns.
export function AIAssistantScreen() {
  const {workspaceId} = useWorkspace();
  const {text, citations, isStreaming, error, send, stop} =
    useStreamChat(workspaceId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const onSend = () => {
    const message = draft.trim();
    if (!message || isStreaming) return;
    send(message);
    setDraft('');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({animated: true})
          }>
          {text ? (
            <View style={styles.answer}>
              <Text style={styles.answerText}>{text}</Text>
              {isStreaming ? (
                <ActivityIndicator
                  style={styles.inlineSpinner}
                  size="small"
                  color={colors.primary}
                />
              ) : null}
            </View>
          ) : (
            <Text style={styles.placeholder}>
              Ask anything about this workspace — documents, channels, decisions.
            </Text>
          )}

          {citations.length > 0 ? (
            <View style={styles.citations}>
              <Text style={styles.citationsLabel}>Sources</Text>
              {citations.map((c, i) => (
                <View
                  key={`${c.documentId}-${c.chunkIndex}-${i}`}
                  style={styles.citation}>
                  <Text style={styles.citationExcerpt} numberOfLines={2}>
                    {c.excerpt}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything…"
            placeholderTextColor={colors.mutedForeground}
            editable={!isStreaming}
            multiline
          />
          {isStreaming ? (
            <Button title="Stop" variant="destructive" onPress={stop} />
          ) : (
            <Button title="Send" onPress={onSend} disabled={!draft.trim()} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground},
  body: {padding: spacing.lg, gap: spacing.lg, flexGrow: 1},
  placeholder: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    marginTop: spacing.xl,
  },
  answer: {
    backgroundColor: colors.muted,
    borderRadius: 12,
    padding: spacing.lg,
  },
  answerText: {fontSize: fontSize.base, lineHeight: 23, color: colors.foreground},
  inlineSpinner: {alignSelf: 'flex-start', marginTop: spacing.sm},
  citations: {gap: spacing.sm},
  citationsLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  citation: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.md,
  },
  citationExcerpt: {fontSize: fontSize.sm, color: colors.mutedForeground},
  error: {fontSize: fontSize.sm, color: colors.destructive},
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
});
