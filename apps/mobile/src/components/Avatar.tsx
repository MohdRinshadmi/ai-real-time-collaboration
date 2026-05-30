import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import {colors, radius} from '@/global/theme';
import {initials} from '@/utils/text';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({name, uri, size = 32}: Props) {
  const dimension = {width: size, height: size, borderRadius: radius.full};
  if (uri) {
    return <Image source={{uri}} style={[styles.image, dimension]} />;
  }
  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={[styles.initials, {fontSize: size * 0.4}]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {backgroundColor: colors.muted},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  initials: {color: colors.primaryForeground, fontWeight: '700'},
});
