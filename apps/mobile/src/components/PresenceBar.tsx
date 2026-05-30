import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, fontSize, spacing} from '@/global/theme';
import {usePresence} from '@/hooks/usePresence';

import {Avatar} from './Avatar';

export function PresenceBar({workspaceId}: {workspaceId: string}) {
  const members = usePresence(workspaceId);

  return (
    <View style={styles.bar}>
      <Text style={styles.label}>
        {members.length > 0 ? `${members.length} online` : 'No one else here'}
      </Text>
      <View style={styles.avatars}>
        {members.slice(0, 5).map((m, i) => (
          <View
            key={m.id}
            style={[styles.avatarWrap, i > 0 && styles.avatarStacked]}>
            <Avatar name={m.name} uri={m.avatarUrl} size={26} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  label: {fontSize: fontSize.sm, color: colors.mutedForeground},
  avatars: {flexDirection: 'row'},
  avatarWrap: {
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 999,
  },
  avatarStacked: {marginLeft: -8},
});
