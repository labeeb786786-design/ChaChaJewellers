export function AdminStubPage({
  title,
  description,
  emptyState,
}: {
  title: string;
  description: string;
  emptyState: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-admin-ink">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-admin-muted">{description}</p>
      <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-10 text-center text-sm text-admin-muted">
        {emptyState}
      </div>
    </div>
  );
}
