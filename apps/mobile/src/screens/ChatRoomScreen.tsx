import React, {useLayoutEffect, useRef, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';

import {type Message} from '@/api';
import {Button} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import {useChannelMessages} from '@/hooks';
import {Screen} from '@/layout';
import type {WorkspaceStackParamList} from '@/routes/types';

// Port of apps/web/src/features/chat/components/ChatRoom.tsx — inverted list so
// new messages appear at the bottom, optimistic send, live socket updates.
export function ChatRoomScreen() {
  const route = useRoute<RouteProp<WorkspaceStackParamList, 'ChatRoom'>>();
  const navigation = useNavigation();
  const {channelId, channelName} = route.params;
  const {messages, sendMessage} = useChannelMessages(channelId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({title: `#${channelName}`});
  }, [navigation, channelName]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(text);
    setDraft('');
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({offset: 0, animated: true}),
    );
  };

  // FlatList is inverted, so render newest-first.
  const ordered = [...messages].reverse();

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <FlatList
          ref={listRef}
          inverted
          data={ordered}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <View style={styles.message}>
              <View style={styles.metaRow}>
                <Text style={styles.author}>{item.authorName}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Say hello 👋</Text>
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={`Message #${channelName}`}
            placeholderTextColor={colors.mutedForeground}
            multiline
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <Button title="Send" onPress={onSend} disabled={!draft.trim()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  listContent: {padding: spacing.lg, gap: spacing.md},
  empty: {
    textAlign: 'center',
    color: colors.mutedForeground,
    marginTop: spacing.xl,
    transform: [{scaleY: -1}],
  },
  message: {gap: 2},
  metaRow: {flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm},
  author: {fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground},
  time: {fontSize: fontSize.xs, color: colors.mutedForeground},
  text: {fontSize: fontSize.base, color: colors.foreground},
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
