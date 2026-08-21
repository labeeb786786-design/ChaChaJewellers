"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ORDER_STATUS_LABEL } from "@/lib/orders";
import type { ClientSettableOrderStatus, OrderStatus } from "@/lib/schemas/order";
import { updateOrderStatus } from "../actions";

const SETTABLE_STATUSES: ClientSettableOrderStatus[] = ["processing", "ready", "completed", "cancelled"];

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState<ClientSettableOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(next: ClientSettableOrderStatus) {
    setPending(next);
    setError(null);

    const result = await updateOrderStatus(orderId, next);
    if ("error" in result) {
      setError(result.error);
      setPending(null);
      return;
    }

    setPending(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {SETTABLE_STATUSES.map((option) => {
          const isCurrent = option === status;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSetStatus(option)}
              disabled={isCurrent || pending !== null}
              className={
                isCurrent
                  ? "rounded-admin-control bg-admin-ink px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed"
                  : "rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {pending === option ? "Saving…" : ORDER_STATUS_LABEL[option]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-admin-faint">
        Paid, failed and refunded are set automatically by Stripe and can&apos;t be changed here.
      </p>
      {error && <p className="mt-2 text-sm text-admin-danger">{error}</p>}
    </div>
  );
}
