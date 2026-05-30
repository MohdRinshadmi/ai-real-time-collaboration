import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {channelsApi, type Channel} from '@/api';
import {colors, fontSize, spacing} from '@/global/theme';
import {useWorkspace} from '@/hooks';
import {Screen} from '@/layout';
import type {WorkspaceStackParamList} from '@/routes/types';

type Nav = NativeStackNavigationProp<WorkspaceStackParamList>;

const Separator = () => <View style={styles.sep} />;

export function ChannelListScreen() {
  const {workspaceId} = useWorkspace();
  const navigation = useNavigation<Nav>();

  const {data, isLoading, isError, refetch, isRefetching} = useQuery<Channel[]>(
    {
      queryKey: ['channels', workspaceId],
      queryFn: () => channelsApi.listChannels(workspaceId),
    },
  );

  // Fall back to the default channel the web sidebar always shows.
  const channels: Channel[] =
    data && data.length > 0 ? data : [{id: 'general', name: 'general'}];

  if (isLoading) {
    return (
      <Screen edges={['top']} style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Text style={styles.title}>Channels</Text>
      {isError ? (
        <Text style={styles.notice}>
          Couldn’t reach the server — showing defaults.
        </Text>
      ) : null}
      <FlatList
        data={channels}
        keyExtractor={c => c.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        ItemSeparatorComponent={Separator}
        renderItem={({item}) => (
          <Pressable
            style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                channelId: item.id,
                channelName: item.name,
              })
            }>
            <Text style={styles.hash}>#</Text>
            <Text style={styles.name}>{item.name}</Text>
            {item.unread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.foreground,
    padding: spacing.lg,
  },
  notice: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  rowPressed: {backgroundColor: colors.muted},
  hash: {fontSize: fontSize.lg, color: colors.mutedForeground},
  name: {fontSize: fontSize.base, color: colors.foreground, flex: 1},
  sep: {height: StyleSheet.hairlineWidth, backgroundColor: colors.border},
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {color: colors.primaryForeground, fontSize: fontSize.xs, fontWeight: '700'},
});
