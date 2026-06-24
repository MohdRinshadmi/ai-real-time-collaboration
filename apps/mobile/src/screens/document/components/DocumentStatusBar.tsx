import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {ConnectionStatus, PeerState} from '@/collab';
import {colors, fontSize, spacing} from '@/global/theme';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Live',
  connecting: 'Syncing…',
  offline: 'Offline',
};

// Connection state + a compact stack of presence dots for the peers in the doc.
export function DocumentStatusBar({
  status,
  peers,
}: {
  status: ConnectionStatus;
  peers: PeerState[];
}) {
  const dotColor =
    status === 'connected'
      ? colors.primary
      : status === 'connecting'
        ? colors.mutedForeground
        : colors.destructive;

  return (
    <View style={styles.statusBar}>
      <View style={styles.statusLeft}>
        <View style={[styles.dot, {backgroundColor: dotColor}]} />
        <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
      </View>
      <View style={styles.peers}>
        {peers.slice(0, 4).map((p, i) => (
          <View
            key={`${p.user.id}-${i}`}
            style={[styles.peerDot, {backgroundColor: p.user.color}]}
          />
        ))}
        {peers.length > 0 ? (
          <Text style={styles.peerCount}>{peers.length} here</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statusLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  dot: {width: 8, height: 8, borderRadius: 4},
  statusText: {fontSize: fontSize.xs, color: colors.mutedForeground, fontWeight: '600'},
  peers: {flexDirection: 'row', alignItems: 'center', gap: 4},
  peerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  peerCount: {fontSize: fontSize.xs, color: colors.mutedForeground, marginLeft: 4},
});
