"use client";

import { useState } from "react";
import { Plus, FileText, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from "@/hooks/usePurchaseOrderMutations";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useSuppliers } from "@/hooks/useSuppliers";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Labels & badges ──────────────────────────────────────────────────────────

const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Qaralama",
  sent: "Göndərildi",
  confirmed: "Təsdiqləndi",
  partial_received: "Qismən alındı",
  received: "Alındı",
  cancelled: "Ləğv edildi",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

function poStatusBadge(status: PurchaseOrderStatus): BadgeVariant {
  switch (status) {
    case "draft": return "secondary";
    case "sent": return "default";
    case "confirmed": return "default";
    case "partial_received": return "warning";
    case "received": return "success";
    case "cancelled": return "destructive";
    default: return "secondary";
  }
}

const ALL_PO_STATUSES: PurchaseOrderStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "partial_received",
  "received",
  "cancelled",
];

// ── Line item form type ───────────────────────────────────────────────────────

interface POLineItem {
  variant_id: string;
  ordered_quantity: string;
  unit_cost: string;
}

function emptyPOLineItem(): POLineItem {
  return { variant_id: "", ordered_quantity: "1", unit_cost: "0" };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Status change modal ───────────────────────────────────────────────────────

interface StatusModalProps {
  po: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
}

function POStatusModal({ po, open, onClose }: StatusModalProps) {
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
        status: selectedStatus as PurchaseOrderStatus,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const availableStatuses = ALL_PO_STATUSES.filter(
    (s) => s !== po?.status
  );

  return (
    <Modal open={open} onClose={onClose} title="Statusu dəyiş" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Yeni status
          </label>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as PurchaseOrderStatus)}
          >
            <option value="">Status seçin</option>
            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {PO_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
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
            disabled={!selectedStatus || updateStatus.isPending}
          >
            {updateStatus.isPending ? "Yenilənir..." : "Yenilə"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePurchaseOrders(page, 20);
  const { data: warehousesData } = useWarehouses();
  const { data: suppliersData } = useSuppliers(1, 100);

  const createPO = useCreatePurchaseOrder();

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([emptyPOLineItem()]);
  const [createError, setCreateError] = useState<string | null>(null);

  // Status modal
  const [statusModalPO, setStatusModalPO] = useState<PurchaseOrder | null>(null);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setSupplierId("");
    setWarehouseId("");
    setExpectedDate("");
    setNotes("");
    setLineItems([emptyPOLineItem()]);
    setCreateError(null);
    setCreateModalOpen(true);
  }

  function closeCreate() {
    setCreateModalOpen(false);
    setCreateError(null);
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyPOLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof POLineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function lineTotal(item: POLineItem): number {
    const qty = parseFloat(item.ordered_quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return qty * cost;
  }

  function grandTotal(): number {
    return lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!supplierId) {
      setCreateError("Təchizatçı mütləqdir.");
      return;
    }
    if (!warehouseId) {
      setCreateError("Anbar mütləqdir.");
      return;
    }
    if (lineItems.length === 0) {
      setCreateError("Ən azı bir məhsul sətri əlavə edin.");
      return;
    }
    for (const item of lineItems) {
      if (!item.variant_id.trim()) {
        setCreateError("Bütün sətirlərdə variant ID daxil edin.");
        return;
      }
    }

    const payload = {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      expected_delivery_date: expectedDate || undefined,
      notes: notes.trim() || undefined,
      items: lineItems.map((item) => ({
        variant_id: item.variant_id.trim(),
        ordered_quantity: parseFloat(item.ordered_quantity) || 1,
        unit_cost: parseFloat(item.unit_cost) || 0,
      })),
    };

    try {
      await createPO.mutateAsync(payload);
      closeCreate();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const warehouses = warehousesData ?? [];
  const suppliers = suppliersData?.data ?? [];

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Alış Sifarişləri
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Yüklənir..."
              : `${data?.total ?? 0} alış sifarişi mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Alış Sifarişi
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "PO №",
                    "Təchizatçı",
                    "Anbar",
                    "Status",
                    "Məbləğ",
                    "Gözlənilən tarix",
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
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {isError && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Alış sifarişləri yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir alış sifarişi yoxdur.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((po) => {
                  const isExpanded = expandedRows.has(po.id);

                  return (
                    <>
                      <tr
                        key={po.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                          isExpanded && "bg-secondary/20"
                        )}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-primary">
                          <button
                            onClick={() => toggleRow(po.id)}
                            className="flex items-center gap-1.5 hover:underline"
                          >
                            {po.po_number}
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {po.supplier?.name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {po.warehouse?.name ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={poStatusBadge(po.status)}>
                            {PO_STATUS_LABELS[po.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {po.total_amount.toLocaleString("az-AZ", {
                            style: "currency",
                            currency: "AZN",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {po.expected_delivery_date
                            ? new Date(po.expected_delivery_date).toLocaleDateString("az-AZ")
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {po.status !== "received" && po.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatusModalPO(po)}
                            >
                              Status
                            </Button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${po.id}-expanded`}
                          className="border-b border-border/30"
                        >
                          <td colSpan={7} className="p-0">
                            <div className="bg-secondary/20 border-t border-border/30 px-8 py-4">
                              <p className="text-sm font-semibold text-foreground mb-3">
                                Sifariş sətirləri
                              </p>
                              {po.items.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  Sətir yoxdur.
                                </p>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-border/40">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border/40 bg-background/50">
                                        {[
                                          "SKU",
                                          "Ad",
                                          "Sifariş miqdarı",
                                          "Alınan miqdar",
                                          "Vahid məbləği",
                                          "Cəmi",
                                        ].map((h) => (
                                          <th
                                            key={h}
                                            className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                                          >
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {po.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-border/20 last:border-0"
                                        >
                                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                            {item.variant?.sku ?? "—"}
                                          </td>
                                          <td className="px-4 py-2.5 font-medium text-foreground">
                                            {item.variant?.name ?? "—"}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground">
                                            {item.ordered_quantity}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground">
                                            {item.received_quantity}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground">
                                            {item.unit_cost.toLocaleString("az-AZ", {
                                              style: "currency",
                                              currency: "AZN",
                                            })}
                                          </td>
                                          <td className="px-4 py-2.5 font-semibold text-foreground">
                                            {item.line_total.toLocaleString("az-AZ", {
                                              style: "currency",
                                              currency: "AZN",
                                            })}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {po.notes && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  <span className="font-medium">Qeyd:</span> {po.notes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Səhifə {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Növbəti
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create PO Modal */}
      <Modal
        open={createModalOpen}
        onClose={closeCreate}
        title="Yeni Alış Sifarişi"
        description="Alış sifarişi məlumatlarını və məhsul sətirləri əlavə edin."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Təchizatçı <span className="text-destructive">*</span>
              </label>
              <Select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Təchizatçı seçin</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Anbar <span className="text-destructive">*</span>
              </label>
              <Select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Anbar seçin</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Gözlənilən tarix
            </label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Qeydlər
            </label>
            <Textarea
              placeholder="Əlavə qeydlər..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Məhsul sətirləri</p>
              <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Sətir əlavə et
              </Button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-11 gap-2 px-1">
                <p className="col-span-5 text-xs font-bold text-muted-foreground uppercase">
                  Variant ID
                </p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase">
                  Miqdar
                </p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase">
                  Maya dəyəri
                </p>
                <p className="col-span-1 text-xs font-bold text-muted-foreground uppercase">
                  Cəmi
                </p>
                <p className="col-span-1" />
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-11 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Variant UUID"
                      value={item.variant_id}
                      onChange={(e) =>
                        updateLineItem(index, "variant_id", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.ordered_quantity}
                      onChange={(e) =>
                        updateLineItem(index, "ordered_quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateLineItem(index, "unit_cost", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 text-sm font-medium text-foreground">
                    {lineTotal(item).toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand total */}
            <div className="flex justify-end mt-3 pt-3 border-t border-border/50">
              <p className="text-sm font-bold text-foreground">
                Ümumi:{" "}
                {grandTotal().toLocaleString("az-AZ", {
                  style: "currency",
                  currency: "AZN",
                })}
              </p>
            </div>
          </div>

          {createError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreate}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={createPO.isPending}>
              {createPO.isPending ? "Yaradılır..." : "Sifariş yarat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status change modal */}
      <POStatusModal
        po={statusModalPO}
        open={statusModalPO !== null}
        onClose={() => setStatusModalPO(null)}
      />
    </div>
  );
}
