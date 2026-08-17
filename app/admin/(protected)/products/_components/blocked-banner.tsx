export function BlockedBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-admin-card border border-[#ebd6b4] bg-admin-warn-soft px-4 py-3.5 text-sm text-[#6b4514]">
      <span aria-hidden className="text-[15px] leading-tight">
        ⚠
      </span>
      <div>
        <strong className="block text-admin-warn">
          {count} product{count === 1 ? "" : "s"} can&apos;t be published yet
        </strong>
        Their weight falls in a pricing band still set to 0% markup, so they
        would sell at the cost of the gold. Set the markup under Pricing to
        unlock them.
      </div>
    </div>
  );
}
