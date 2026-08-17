import { SignOutButton } from "./sign-out-button";

function initialsFor(label: string): string {
  const initials = label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "?";
}

export function AdminTopBar({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-admin-rule bg-admin-surface px-5 py-3.5">
      <div className="flex items-baseline gap-2.5">
        <strong className="text-[15px] font-bold tracking-tight text-admin-ink">
          Chacha Jewellers
        </strong>
        <span className="rounded-[3px] border border-admin-rule-strong px-1.5 py-0.5 font-admin-mono text-[10px] tracking-[0.12em] text-admin-faint uppercase">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-sm text-admin-muted">{label}</span>
        <div className="grid h-6.5 w-6.5 place-items-center rounded-full bg-admin-gold-soft text-[11px] font-semibold text-admin-gold">
          {initialsFor(label)}
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
