import React from 'react';
import {Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useRoute, type RouteProp} from '@react-navigation/native';

import {colors, fontSize} from '@/global/theme';
import {
  AIAssistantScreen,
  ChannelListScreen,
  ChatRoomScreen,
  DocumentListScreen,
  DocumentScreen,
  WorkspaceHomeScreen,
} from '@/screens';
import {WorkspaceProvider} from '@/store';

import type {
  RootStackParamList,
  WorkspaceStackParamList,
  WorkspaceTabParamList,
} from './types';

const Tab = createBottomTabNavigator<WorkspaceTabParamList>();
const Stack = createNativeStackNavigator<WorkspaceStackParamList>();

// Text-glyph tab icons keep the app icon-library-free; swap for a vector icon
// set (e.g. react-native-vector-icons) when one is added to the project.
function tabIcon(glyph: string) {
  return ({color}: {color: string}) => (
    <Text style={{fontSize: fontSize.lg, color}}>{glyph}</Text>
  );
}

function WorkspaceTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}>
      <Tab.Screen
        name="Overview"
        component={WorkspaceHomeScreen}
        options={{tabBarIcon: tabIcon('⌂')}}
      />
      <Tab.Screen
        name="Channels"
        component={ChannelListScreen}
        options={{tabBarIcon: tabIcon('#')}}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentListScreen}
        options={{tabBarIcon: tabIcon('🗎')}}
      />
      <Tab.Screen
        name="Assistant"
        component={AIAssistantScreen}
        options={{tabBarIcon: tabIcon('✦')}}
      />
    </Tab.Navigator>
  );
}

export function WorkspaceNavigator() {
  // The active workspace slug arrives as a route param from the root stack.
  const route = useRoute<RouteProp<RootStackParamList, 'Workspace'>>();
  const slug = route.params?.workspaceSlug ?? 'my-workspace';

  return (
    <WorkspaceProvider slug={slug}>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={WorkspaceTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="Document" component={DocumentScreen} />
      </Stack.Navigator>
    </WorkspaceProvider>
  );
}
