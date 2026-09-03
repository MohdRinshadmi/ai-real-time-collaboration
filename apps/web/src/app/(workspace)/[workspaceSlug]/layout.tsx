import { PresenceBar } from '@/features/presence/components/PresenceBar';
import { WorkspaceSidebar } from '@/features/workspace/components/WorkspaceSidebar';

type LayoutProps = {
  children: React.ReactNode;
  params: { workspaceSlug: string };
};

// The workspace runs in the deep graphite "Live Canvas" app shell, independent of
// the visitor's system theme — the app is where the dark surface belongs.
export default function WorkspaceLayout({ children, params }: LayoutProps) {
  return (
    <div className="dark">
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <WorkspaceSidebar slug={params.workspaceSlug} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PresenceBar slug={params.workspaceSlug} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
