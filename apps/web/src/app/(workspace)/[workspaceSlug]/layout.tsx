import { WorkspaceSidebar } from '@/features/workspace/components/WorkspaceSidebar';
import { PresenceBar } from '@/features/presence/components/PresenceBar';

type LayoutProps = {
  children: React.ReactNode;
  params: { workspaceSlug: string };
};

export default function WorkspaceLayout({ children, params }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <WorkspaceSidebar slug={params.workspaceSlug} />
      <div className="flex flex-1 flex-col">
        <PresenceBar slug={params.workspaceSlug} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
