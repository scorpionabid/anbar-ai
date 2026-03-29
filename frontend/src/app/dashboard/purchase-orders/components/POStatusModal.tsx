"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useUpdatePurchaseOrderStatus } from "@/hooks/usePurchaseOrderMutations";
import { PO_STATUS_LABELS, NEXT_PO_STATUSES } from "./constants";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/api";

interface StatusModalProps {
  po: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
}

export function POStatusModal({ po, open, onClose }: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdatePurchaseOrderStatus();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!po || !selectedStatus) return;
    setError(null);
    try {
      await updateStatus.mutateAsync({ 
        id: po.id, 
        status: selectedStatus as PurchaseOrderStatus 
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const nextStatuses = po ? NEXT_PO_STATUSES[po.status] : [];

  return (
    <Modal open={open} onClose={onClose} title="Statusu dəyiş" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
        <div>
          <label className="block text-[10px] font-black uppercase text-foreground mb-1.5 tracking-widest opacity-80">
            Yeni status
          </label>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as PurchaseOrderStatus)}
            className="rounded-xl border-border/60"
          >
            <option value="">Status seçin</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>
                {PO_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          {nextStatuses.length === 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Bu status üçün dəyişiklik mümkün deyil.
            </p>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/10">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 font-bold h-10 text-xs">
            Ləğv et
          </Button>
          <Button
            type="submit"
            disabled={!selectedStatus || updateStatus.isPending || nextStatuses.length === 0}
            className="rounded-xl px-8 font-black h-10 text-xs shadow-lg shadow-primary/15"
          >
            {updateStatus.isPending ? "Yenilənir..." : "Yenilə"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
