"use client";

export function Modal({
  onClose,
  labelledBy,
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-[#1a1917]/45 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-admin-card bg-admin-surface p-5.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        {children}
      </div>
    </div>
  );
}
