export default function WorkspaceHomePage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{params.workspaceSlug}</h1>
      <p className="mt-2 text-muted-foreground">Pick a document or channel from the sidebar.</p>
    </div>
  );
}
