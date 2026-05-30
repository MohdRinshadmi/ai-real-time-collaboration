import {http} from './http';

export type Channel = {id: string; name: string; unread?: number};

export type Message = {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export function listChannels(workspaceId: string): Promise<Channel[]> {
  return http<Channel[]>(`/workspaces/${workspaceId}/channels`);
}

export function listMessages(channelId: string): Promise<Message[]> {
  return http<Message[]>(`/channels/${channelId}/messages`);
}

export function postMessage(channelId: string, text: string): Promise<Message> {
  return http<Message>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({text}),
  });
}
