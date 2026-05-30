import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

import {RootNavigator} from '@/routes';
import {AppProviders} from '@/store';

export default function App() {
  return (
    <AppProviders>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}
