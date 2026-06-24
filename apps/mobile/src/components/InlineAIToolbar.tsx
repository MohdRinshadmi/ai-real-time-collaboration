import React, {useEffect} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {colors, fontSize, radius, spacing} from '@/global/theme';
import type {InlineAction} from '@/hooks/useInlineAI';

// Floating toolbar that animates in when the user selects text in the editor.
// The fade + slide runs entirely on the UI thread via Reanimated shared values,
// so it stays at 60fps even while the JS thread is busy streaming AI tokens.
//
// Entrance-only by design: when the selection clears the toolbar simply unmounts
// (an exit tween would never paint — the component returns null on that same
// render). Re-entering replays the animation from zero.

const ACTIONS: {key: InlineAction; label: string}[] = [
  {key: 'improve', label: 'Improve'},
  {key: 'explain', label: 'Explain'},
  {key: 'shorten', label: 'Shorten'},
  {key: 'summarize', label: 'Summarize'},
];

type Props = {
  visible: boolean;
  disabled?: boolean;
  onAction: (action: InlineAction) => void;
};

export function InlineAIToolbar({visible, disabled, onAction}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Replay the entrance each time a selection appears.
    if (visible) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{translateY: (1 - progress.value) * 8}],
  }));

  // No selection → unmount (no exit tween; see file header).
  if (!visible) return null;

  return (
    <Animated.View style={[styles.bar, animatedStyle]} pointerEvents="box-none">
      <Text style={styles.badge}>✦ AI</Text>
      {ACTIONS.map(a => (
        <Pressable
          key={a.key}
          disabled={disabled}
          onPress={() => onAction(a.key)}
          style={({pressed}) => [
            styles.action,
            {opacity: disabled ? 0.4 : pressed ? 0.7 : 1},
          ]}>
          <Text style={styles.actionText}>{a.label}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.foreground,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  badge: {
    color: colors.primaryForeground,
    fontSize: fontSize.xs,
    fontWeight: '800',
    marginRight: spacing.xs,
  },
  action: {paddingVertical: 4, paddingHorizontal: spacing.sm},
  actionText: {color: '#ffffff', fontSize: fontSize.sm, fontWeight: '600'},
});
