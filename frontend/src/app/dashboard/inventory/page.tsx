"use client";

import { useState } from "react";
import { SlidersHorizontal, PackageSearch } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useAdjustInventory } from "@/hooks/useInventoryMutations";
import type { InventoryItem } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

// ─── adjustment form state ────────────────────────────────────────────────────

interface AdjustForm {
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: string;
  notes: string;
}

const emptyAdjust: AdjustForm = {
  movement_type: "IN",
  quantity: "",
  notes: "",
};

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const inventory = useInventory(warehouseFilter || undefined);
  const warehouses = useWarehouses();
  const adjustInventory = useAdjustInventory();

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(emptyAdjust);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  function openAdjust(item: InventoryItem) {
    setAdjustItem(item);
    setAdjustForm(emptyAdjust);
    setAdjustError(null);
  }

  function closeAdjust() {
    setAdjustItem(null);
    setAdjustForm(emptyAdjust);
    setAdjustError(null);
  }

  async function handleAdjustSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setAdjustError(null);

    if (!adjustItem) return;

    const qty = parseInt(adjustForm.quantity, 10);
    if (!adjustForm.quantity || isNaN(qty) || qty < 1) {
      setAdjustError("Miqdar ən azı 1 olmalıdır.");
      return;
    }

    try {
      await adjustInventory.mutateAsync({
        warehouse_id: adjustItem.warehouse_id,
        variant_id: adjustItem.variant_id,
        quantity: qty,
        movement_type: adjustForm.movement_type,
        note: adjustForm.notes.trim() || undefined,
      });
      closeAdjust();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            İnventar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {inventory.isLoading
              ? "Yüklənir..."
              : `${inventory.data?.length ?? 0} mövqe`}
          </p>
        </div>
        <Select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="w-52"
        >
          <option value="">Bütün Anbarlar</option>
          {(warehouses.data ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "SKU",
                    "Variant",
                    "Anbar",
                    "Əldə olan",
                    "Rezerv",
                    "Mövcud",
                    "Gözlənilən",
                    "Əməliyyatlar",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {inventory.isError && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      İnventar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!inventory.isLoading && !inventory.isError && inventory.data?.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      İnventar qeydi tapılmadı.
                    </td>
                  </tr>
                )}
                {(inventory.data ?? []).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                      {item.variant.sku}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {item.variant.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {item.warehouse.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="warning">{item.reserved_quantity.toLocaleString()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={
                          item.available === 0
                            ? "font-bold text-destructive"
                            : item.available < 10
                            ? "font-bold text-orange-500"
                            : "font-bold text-green-600"
                        }
                      >
                        {item.available.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-500 font-medium">
                      {item.incoming_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAdjust(item)}
                        className="gap-1.5"
                        aria-label="Stok tənzimlə"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Tənzimlə
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      <Modal
        open={!!adjustItem}
        onClose={closeAdjust}
        title="Stok Tənzimləmə"
        description={
          adjustItem
            ? `${adjustItem.variant.name} — cari miqdar: ${adjustItem.quantity}`
            : undefined
        }
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Hərəkət növü
            </label>
            <Select
              value={adjustForm.movement_type}
              onChange={(e) =>
                setAdjustForm((f) => ({
                  ...f,
                  movement_type: e.target.value as "IN" | "OUT" | "ADJUSTMENT",
                }))
              }
            >
              <option value="IN">Stok Girişi</option>
              <option value="OUT">Stok Çıxışı</option>
              <option value="ADJUSTMENT">Düzəliş</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Miqdar <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={1}
              placeholder="1"
              value={adjustForm.quantity}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, quantity: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Qeyd
            </label>
            <Textarea
              placeholder="İxtiyari açıqlama..."
              value={adjustForm.notes}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          {adjustError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {adjustError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeAdjust}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={adjustInventory.isPending}>
              {adjustInventory.isPending ? "Saxlanılır..." : "Tətbiq et"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
