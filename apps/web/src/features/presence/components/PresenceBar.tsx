export function PresenceBar({ slug }: { slug: string }) {
  return (
    <header className="flex h-12 items-center justify-between border-b px-4">
      <div className="text-sm text-muted-foreground">{slug}</div>
      <div className="flex -space-x-1.5" aria-label="Online members" />
    </header>
  );
}
