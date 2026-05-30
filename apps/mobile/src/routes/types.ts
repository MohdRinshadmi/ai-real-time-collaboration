import type {NavigatorScreenParams} from '@react-navigation/native';

// Centralised route params so screens and navigation calls stay type-safe.

export type WorkspaceTabParamList = {
  Overview: undefined;
  Channels: undefined;
  Documents: undefined;
  Assistant: undefined;
};

export type WorkspaceStackParamList = {
  Tabs: NavigatorScreenParams<WorkspaceTabParamList>;
  ChatRoom: {channelId: string; channelName: string};
  Document: {docId: string; title: string};
};

export type RootStackParamList = {
  Login: undefined;
  Workspace: {workspaceSlug: string};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
