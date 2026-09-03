import { AIInlinePanel } from '@/features/ai-assistant/components/AIInlinePanel';
import { DocumentCanvas } from '@/features/editor/components/DocumentCanvas';

// CSR-heavy route — the editor body is hydrated from Yjs over WebSocket,
// so SSR contributes little. We still get the workspace shell SSR'd by
// the parent layout for fast first paint.
export const dynamic = 'force-dynamic';

type Props = { params: { workspaceSlug: string; docId: string } };

export default function DocumentPage({ params }: Props) {
  return (
    <div className="grid h-full grid-cols-[1fr_minmax(280px,340px)]">
      <DocumentCanvas documentId={params.docId} />
      <AIInlinePanel documentId={params.docId} />
    </div>
  );
}
