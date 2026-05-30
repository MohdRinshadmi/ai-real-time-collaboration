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

import {documentsApi, type Doc} from '@/api';
import {colors, fontSize, spacing} from '@/global/theme';
import {useWorkspace} from '@/hooks';
import {Screen} from '@/layout';
import type {WorkspaceStackParamList} from '@/routes/types';

type Nav = NativeStackNavigationProp<WorkspaceStackParamList>;

const Separator = () => <View style={styles.sep} />;

export function DocumentListScreen() {
  const {workspaceId} = useWorkspace();
  const navigation = useNavigation<Nav>();

  const {data, isLoading, isError, refetch, isRefetching} = useQuery<Doc[]>({
    queryKey: ['documents', workspaceId],
    queryFn: () => documentsApi.listDocuments(workspaceId),
  });

  const docs: Doc[] =
    data && data.length > 0
      ? data
      : [{id: 'welcome', title: 'Welcome', icon: '👋'}];

  if (isLoading) {
    return (
      <Screen edges={['top']} style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Text style={styles.title}>Documents</Text>
      {isError ? (
        <Text style={styles.notice}>
          Couldn’t reach the server — showing defaults.
        </Text>
      ) : null}
      <FlatList
        data={docs}
        keyExtractor={d => d.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        ItemSeparatorComponent={Separator}
        renderItem={({item}) => (
          <Pressable
            style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate('Document', {
                docId: item.id,
                title: item.title,
              })
            }>
            <Text style={styles.icon}>{item.icon ?? '📄'}</Text>
            <Text style={styles.name}>{item.title}</Text>
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
    gap: spacing.md,
  },
  rowPressed: {backgroundColor: colors.muted},
  icon: {fontSize: fontSize.lg},
  name: {fontSize: fontSize.base, color: colors.foreground, flex: 1},
  sep: {height: StyleSheet.hairlineWidth, backgroundColor: colors.border},
});
