import React, {useEffect} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import {colors, fontSize, radius, spacing} from '@/global/theme';
import {useVoiceRoom} from '@/hooks';
import {requestMicPermission} from '@/utils';

// Compact voice-huddle control for a document or channel. Wraps useVoiceRoom
// (WebRTC mesh over the shared socket). The "live" dot pulses on the UI thread
// via Reanimated so it stays smooth regardless of JS-thread load.

type Props = {room: string; label?: string};

export function VoiceHuddleBar({room, label = 'Huddle'}: Props) {
  const {active, muted, peers, join, leave, toggleMute} = useVoiceRoom(room);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withTiming(1, {duration: 900, easing: Easing.inOut(Easing.ease)}),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [active, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.6,
    transform: [{scale: 0.85 + pulse.value * 0.4}],
  }));

  const onJoin = async () => {
    setError(null);
    const granted = await requestMicPermission();
    if (!granted) {
      setError('Microphone permission denied.');
      return;
    }
    setConnecting(true);
    try {
      await join();
    } catch {
      // useVoiceRoom has already reset itself; just surface a retryable message.
      setError('Couldn’t start the huddle. Tap to retry.');
    } finally {
      setConnecting(false);
    }
  };

  if (!active) {
    return (
      <Pressable
        style={({pressed}) => [styles.joinBar, {opacity: pressed ? 0.85 : 1}]}
        onPress={onJoin}
        disabled={connecting}>
        {connecting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={error ? styles.joinError : styles.joinText}>
            {error ?? `🎙  Start ${label}`}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.liveBar}>
      <View style={styles.liveLeft}>
        <Animated.View style={[styles.liveDot, dotStyle]} />
        <Text style={styles.liveText}>
          Live · {peers.length + 1} {peers.length + 1 === 1 ? 'person' : 'people'}
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={toggleMute}
          style={({pressed}) => [styles.pill, {opacity: pressed ? 0.7 : 1}]}>
          <Text style={styles.pillText}>{muted ? 'Unmute' : 'Mute'}</Text>
        </Pressable>
        <Pressable
          onPress={leave}
          style={({pressed}) => [
            styles.pill,
            styles.leave,
            {opacity: pressed ? 0.7 : 1},
          ]}>
          <Text style={[styles.pillText, styles.leaveText]}>Leave</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  joinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
  },
  joinText: {fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground},
  joinError: {fontSize: fontSize.sm, fontWeight: '600', color: colors.destructive},
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  liveLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  liveDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: colors.destructive},
  liveText: {fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground},
  controls: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  pill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  pillText: {fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground},
  leave: {backgroundColor: colors.destructive},
  leaveText: {color: colors.destructiveForeground},
});
