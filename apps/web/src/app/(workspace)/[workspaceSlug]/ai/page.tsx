import { AIChatPanel } from '@/features/ai-assistant/components/AIChatPanel';

type Props = { params: { workspaceSlug: string } };

export default function AIPage({ params }: Props) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <AIChatPanel workspaceSlug={params.workspaceSlug} />
    </div>
  );
}
