"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useUpdateOrderStatus } from "@/hooks/useOrderMutations";
import { ORDER_STATUS_LABELS, NEXT_STATUSES } from "./constants";
import type { Order, OrderStatus } from "@/types/api";

interface StatusModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function StatusModal({ order, open, onClose }: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdateOrderStatus();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !selectedStatus) return;
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: order.id, status: selectedStatus as OrderStatus });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const nextStatuses = order ? NEXT_STATUSES[order.status] : [];

  return (
    <Modal open={open} onClose={onClose} title="Statusu dəyiş" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Yeni status
          </label>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
          >
            <option value="">Status seçin</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          {nextStatuses.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Bu status üçün dəyişiklik mümkün deyil.
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Ləğv et
          </Button>
          <Button
            type="submit"
            disabled={!selectedStatus || updateStatus.isPending || nextStatuses.length === 0}
          >
            {updateStatus.isPending ? "Yenilənir..." : "Yenilə"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
