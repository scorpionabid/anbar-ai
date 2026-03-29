"use client";

import { useState } from "react";
import { SlidersHorizontal, PackageSearch, Download, Bot, ChevronDown } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { useReorderSuggestions, type ReorderSuggestion } from "@/hooks/useAI";
import { useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useAdjustInventory } from "@/hooks/useInventoryMutations";
import type { InventoryItem } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import MovementsPage from "@/app/dashboard/inventory/movements/page";
import WarehousesPage from "@/app/dashboard/warehouses/page";

// ─── adjustment form ──────────────────────────────────────────────────────────

interface AdjustForm {
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: string;
  notes: string;
}

const emptyAdjust: AdjustForm = { movement_type: "IN", quantity: "", notes: "" };

import { SkeletonRow } from "@/components/ui/SkeletonRow";

// ─── stock tab ────────────────────────────────────────────────────────────────

function StockTab() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [showReorder, setShowReorder] = useState(false);
  const reorderSuggestions = useReorderSuggestions();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Cari Stok</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {inventory.isLoading ? "Yüklənir..." : `${inventory.data?.length ?? 0} mövqe`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadExport("/api/v1/export/inventory", "inventory.csv").catch(console.error)}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="w-52">
            <option value="">Bütün Anbarlar</option>
            {(warehouses.data ?? []).map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["SKU", "Variant", "Anbar", "Əldə olan", "Rezerv", "Mövcud", "Gözlənilən", "Əməliyyatlar"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.isLoading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
                {inventory.isError && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-destructive">İnventar yüklənərkən xəta baş verdi.</td></tr>
                )}
                {!inventory.isLoading && !inventory.isError && inventory.data?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      İnventar qeydi tapılmadı.
                    </td>
                  </tr>
                )}
                {(inventory.data ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0">
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{item.variant.sku}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.variant.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.warehouse.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{item.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm"><Badge variant="warning">{item.reserved_quantity.toLocaleString()}</Badge></td>
                    <td className="px-6 py-4 text-sm">
                      <span className={item.available === 0 ? "font-bold text-destructive" : item.available < 10 ? "font-bold text-orange-500" : "font-bold text-green-600"}>
                        {item.available.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-500 font-medium">{item.incoming_quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <Button size="sm" variant="ghost" onClick={() => openAdjust(item)} className="gap-1.5">
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

      {/* ── AI Reorder Suggestions ─────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowReorder(s => !s)}
          className="w-full flex items-center justify-between rounded-xl border border-border/50 px-5 py-3 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">AI Reorder Tövsiyələri</span>
            {(reorderSuggestions.data?.length ?? 0) > 0 && (
              <Badge variant="warning">{reorderSuggestions.data!.length}</Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showReorder ? "rotate-180" : ""}`} />
        </button>

        {showReorder && (
          <Card glass className="mt-2">
            <CardContent className="p-0">
              {reorderSuggestions.isLoading && (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-4 bg-secondary/60 rounded animate-pulse" />)}
                </div>
              )}
              {!reorderSuggestions.isLoading && (reorderSuggestions.data?.length ?? 0) === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Bütün stok səviyyələri normaldır ✓
                </div>
              )}
              {(reorderSuggestions.data ?? []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        {["SKU", "Məhsul", "Anbar", "Cari Stok", "Gündəlik Ort.", "Tövsiyə", "Səbəb"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(reorderSuggestions.data ?? []).map((s: ReorderSuggestion) => (
                        <tr key={s.variant_id + s.warehouse_name} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{s.sku}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-foreground">{s.variant_name}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{s.warehouse_name}</td>
                          <td className="px-5 py-3 text-sm font-bold text-destructive">{s.current_stock}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{s.avg_daily_consumption}/gün</td>
                          <td className="px-5 py-3 text-sm font-bold text-primary">{s.suggested_quantity} ədəd</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={!!adjustItem}
        onClose={closeAdjust}
        title="Stok Tənzimləmə"
        description={adjustItem ? `${adjustItem.variant.name} — cari miqdar: ${adjustItem.quantity}` : undefined}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Hərəkət növü</label>
            <Select value={adjustForm.movement_type} onChange={(e) => setAdjustForm((f) => ({ ...f, movement_type: e.target.value as "IN" | "OUT" | "ADJUSTMENT" }))}>
              <option value="IN">Stok Girişi</option>
              <option value="OUT">Stok Çıxışı</option>
              <option value="ADJUSTMENT">Düzəliş</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Miqdar <span className="text-destructive">*</span></label>
            <Input type="number" min={1} placeholder="1" value={adjustForm.quantity} onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Qeyd</label>
            <Textarea placeholder="İxtiyari açıqlama..." value={adjustForm.notes} onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {adjustError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{adjustError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeAdjust}>Ləğv et</Button>
            <Button type="submit" disabled={adjustInventory.isPending}>{adjustInventory.isPending ? "Saxlanılır..." : "Tətbiq et"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "stok",       label: "Cari Stok" },
  { id: "hereketler", label: "Hərəkətlər" },
  { id: "anbarlar",   label: "Anbarlar" },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stok");

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === "stok"       && <StockTab />}
      {activeTab === "hereketler" && <MovementsPage />}
      {activeTab === "anbarlar"   && <WarehousesPage />}
    </div>
  );
}
