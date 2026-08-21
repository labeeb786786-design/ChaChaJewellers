import Link from "next/link";

export function DashboardCard({
  title,
  href,
  tone = "neutral",
  children,
}: {
  title: string;
  href?: string;
  tone?: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-admin-card border p-4.5 ${
        tone === "danger" ? "border-[#efcfcf] bg-admin-danger-soft" : "border-admin-rule bg-admin-surface"
      }`}
    >
      <div className="mb-2.75">
        {href ? (
          <Link href={href} className="text-sm font-semibold text-admin-ink hover:underline">
            {title}
          </Link>
        ) : (
          <h2 className="text-sm font-semibold text-admin-ink">{title}</h2>
        )}
      </div>
      {children}
    </div>
  );
}
