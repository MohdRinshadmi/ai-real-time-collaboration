import { ChatRoom } from '@/features/chat/components/ChatRoom';

type Props = { params: { workspaceSlug: string; channelId: string } };

export default function ChannelPage({ params }: Props) {
  return <ChatRoom channelId={params.channelId} />;
}
