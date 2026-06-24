import React, {useLayoutEffect, useMemo} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';

import {InlineAIToolbar, VoiceHuddleBar} from '@/components';
import {useAuth, useWorkspace} from '@/hooks';
import {colors, fontSize, spacing} from '@/global/theme';
import {Screen} from '@/layout';
import type {WorkspaceStackParamList} from '@/routes/types';

import {colorFor} from './presence';
import {DocumentStatusBar} from './components/DocumentStatusBar';
import {InlineResultCard} from './components/InlineResultCard';
import {DocumentSummary} from './components/DocumentSummary';
import {useDocumentBody} from './hooks/useDocumentBody';
import {useDocumentSummary} from './hooks/useDocumentSummary';
import {useInlineEditing} from './hooks/useInlineEditing';

// Offline-first collaborative editor. Composition only — the moving parts live
// in dedicated hooks and components:
//   - useDocumentBody:    Yjs CRDT synced over realtime, seeded from the server.
//   - useInlineEditing:   select text → stream improve/explain/etc from the
//                         gateway, applied back into the CRDT (and so to peers).
//   - useDocumentSummary: the one-shot whole-doc summary.
//   - VoiceHuddleBar:     an in-document WebRTC huddle (room = doc:<id>).
export function DocumentScreen() {
  const route = useRoute<RouteProp<WorkspaceStackParamList, 'Document'>>();
  const navigation = useNavigation();
  const {docId, title} = route.params;
  const {user} = useAuth();
  const {workspaceId} = useWorkspace();

  const collabUser = useMemo(
    () => ({
      id: user?.id ?? 'anon',
      name: user?.name ?? 'Anonymous',
      color: colorFor(user?.id ?? 'anon'),
    }),
    [user?.id, user?.name],
  );

  const {text, setText, status, peers, setTyping, isLoading} = useDocumentBody(
    docId,
    collabUser,
  );
  const inline = useInlineEditing({workspaceId, text, setText});
  const summary = useDocumentSummary(docId);

  useLayoutEffect(() => {
    navigation.setOptions({title});
  }, [navigation, title]);

  const typingPeers = peers.filter(p => p.typing);

  if (isLoading && text.length === 0) {
    return (
      <Screen edges={['bottom']} style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <DocumentStatusBar status={status} peers={peers} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <VoiceHuddleBar room={`doc:${docId}`} label="huddle" />

        <InlineAIToolbar
          visible={inline.hasSelection}
          disabled={inline.isStreaming}
          onAction={inline.run}
        />

        <TextInput
          style={styles.editor}
          value={text}
          onChangeText={next => {
            setText(next);
            setTyping(true);
          }}
          onSelectionChange={inline.onSelectionChange}
          onBlur={() => setTyping(false)}
          multiline
          scrollEnabled={false}
          placeholder="Start writing — changes sync to everyone in real time."
          placeholderTextColor={colors.mutedForeground}
          textAlignVertical="top"
        />

        {typingPeers.length > 0 ? (
          <Text style={styles.typing}>
            {typingPeers.map(p => p.user.name).join(', ')}{' '}
            {typingPeers.length === 1 ? 'is' : 'are'} typing…
          </Text>
        ) : null}

        {inline.action ? (
          <InlineResultCard
            action={inline.action}
            result={inline.result}
            error={inline.error}
            isStreaming={inline.isStreaming}
            staleSpan={inline.staleSpan}
            onReplace={inline.apply}
            onDismiss={inline.dismiss}
          />
        ) : null}

        <DocumentSummary
          summary={summary.summary}
          summarizing={summary.summarizing}
          onSummarize={summary.summarize}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
  content: {padding: spacing.xl, gap: spacing.lg},
  editor: {
    minHeight: 240,
    fontSize: fontSize.base,
    lineHeight: 24,
    color: colors.foreground,
    padding: 0,
  },
  typing: {fontSize: fontSize.sm, color: colors.mutedForeground, fontStyle: 'italic'},
});
