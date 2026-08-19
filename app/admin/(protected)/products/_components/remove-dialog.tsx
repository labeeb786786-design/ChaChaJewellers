"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { removeProduct } from "../actions";
import { Modal } from "./modal";

export function RemoveProductDialog({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsRemoving(true);
    setError(null);

    const result = await removeProduct(productId);
    if ("error" in result) {
      setError(result.error);
      setIsRemoving(false);
      return;
    }

    setIsOpen(false);
    setIsRemoving(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-admin-control border border-[#e8cfcf] bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-danger hover:bg-admin-danger-soft"
      >
        Remove
      </button>

      {isOpen && (
        <Modal
          labelledBy="remove-dialog-title"
          onClose={() => {
            if (!isRemoving) setIsOpen(false);
          }}
        >
          <h3 id="remove-dialog-title" className="mb-2 text-base font-bold text-admin-ink">
            Remove {productName}?
          </h3>
          <p className="text-sm text-admin-muted">
            It disappears from the site straight away. Any past orders for it stay exactly as they are.
          </p>
          {error && <p className="mt-2 text-sm text-admin-danger">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isRemoving}
              className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isRemoving}
              className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
