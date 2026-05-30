export default function AdminHome() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Workspace metrics, AI spend, abuse signals, feature flags.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-4">
        <li className="rounded-lg border p-4">Workspaces</li>
        <li className="rounded-lg border p-4">AI usage</li>
        <li className="rounded-lg border p-4">Feature flags</li>
        <li className="rounded-lg border p-4">Audit log</li>
      </ul>
    </main>
  );
}
