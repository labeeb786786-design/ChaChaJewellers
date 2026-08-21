"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteBand } from "../actions";
import { Modal } from "../../products/_components/modal";

export function DeleteBandDialog({
  bandId,
  bandLabel,
  productCount,
}: {
  bandId: string;
  bandLabel: string;
  productCount: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);

    const result = await deleteBand(bandId);
    if ("error" in result) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }

    setIsOpen(false);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-admin-control border border-[#e8cfcf] bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-danger hover:bg-admin-danger-soft"
      >
        Delete
      </button>

      {isOpen && (
        <Modal
          labelledBy="delete-band-dialog-title"
          onClose={() => {
            if (!isDeleting) setIsOpen(false);
          }}
        >
          <h3 id="delete-band-dialog-title" className="mb-2 text-base font-bold text-admin-ink">
            Delete {bandLabel}?
          </h3>
          <p className="text-sm text-admin-muted">This can&apos;t be undone.</p>
          {productCount > 0 && (
            <p className="mt-2 rounded-admin-control bg-admin-warn-soft px-3 py-2.5 text-xs text-[#6b4514]">
              {productCount} product{productCount === 1 ? "" : "s"} currently priced by this band will match
              no band at all once it&apos;s gone, and won&apos;t be able to be priced until another band
              covers this weight.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-admin-danger">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="rounded-admin-control bg-admin-danger px-3.5 py-2 text-sm font-medium text-white hover:bg-[#7a2020] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
