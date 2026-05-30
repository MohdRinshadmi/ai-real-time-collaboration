import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {colors} from '@/global/theme';
import {useAuth} from '@/hooks';
import {LoginScreen} from '@/screens';

import {WorkspaceNavigator} from './WorkspaceNavigator';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const {status} = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {status === 'authenticated' ? (
        <Stack.Screen
          name="Workspace"
          component={WorkspaceNavigator}
          // A workspace switcher can override this; default seeds the demo slug.
          initialParams={{workspaceSlug: 'my-workspace'}}
        />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
