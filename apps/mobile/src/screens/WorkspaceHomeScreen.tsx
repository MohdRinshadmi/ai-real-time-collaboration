import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Button, PresenceBar} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import {useAuth, useWorkspace} from '@/hooks';
import {Screen} from '@/layout';

// Port of the web workspace home page (apps/web/.../[workspaceSlug]/page.tsx)
// with a presence bar header and a sign-out affordance.
export function WorkspaceHomeScreen() {
  const {slug, workspaceId} = useWorkspace();
  const {user, logout} = useAuth();

  return (
    <Screen edges={['top']}>
      <PresenceBar workspaceId={workspaceId} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{slug}</Text>
        <Text style={styles.sub}>
          Pick a document or channel from the tabs below.
        </Text>

        {user ? (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        ) : null}

        <Button title="Sign out" variant="ghost" onPress={logout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: spacing.xl, gap: spacing.md},
  heading: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
  },
  sub: {fontSize: fontSize.base, color: colors.mutedForeground},
  userCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.muted,
    gap: spacing.xs,
  },
  userName: {fontSize: fontSize.base, fontWeight: '600', color: colors.foreground},
  userEmail: {fontSize: fontSize.sm, color: colors.mutedForeground},
});
