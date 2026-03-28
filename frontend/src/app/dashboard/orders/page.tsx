"use client";

import { useState } from "react";
import { Plus, ShoppingCart, ChevronDown, ChevronUp, Trash2, Download } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useOrders } from "@/hooks/useOrders";
import { useCreateOrder, useUpdateOrderStatus, useCancelOrder } from "@/hooks/useOrderMutations";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomers } from "@/hooks/useCustomers";
import type { Order, OrderStatus, PaymentStatus } from "@/types/api";
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

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Qaralama",
  confirmed: "Təsdiqləndi",
  processing: "Hazırlanır",
  shipped: "Göndərildi",
  delivered: "Çatdırıldı",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
  returned: "Qaytarıldı",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

function orderStatusBadge(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "draft": return "secondary";
    case "confirmed": return "default";
    case "processing": return "warning";
    case "shipped": return "default";
    case "delivered": return "success";
    case "completed": return "success";
    case "cancelled": return "destructive";
    case "returned": return "destructive";
  }
}

function paymentStatusBadge(status: PaymentStatus): BadgeVariant {
  switch (status) {
    case "unpaid": return "destructive";
    case "partial": return "warning";
    case "paid": return "success";
    case "refunded": return "secondary";
  }
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Ödənilməyib",
  partial: "Qismən ödənilib",
  paid: "Ödənilib",
  refunded: "Geri qaytarıldı",
};

// Valid next status transitions
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["completed", "returned"],
  completed: [],
  cancelled: [],
  returned: [],
};

// Status filter tabs
const STATUS_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Hamısı", value: "all" },
  { label: "Qaralama", value: "draft" },
  { label: "Təsdiqləndi", value: "confirmed" },
  { label: "Hazırlanır", value: "processing" },
  { label: "Göndərildi", value: "shipped" },
  { label: "Tamamlandı", value: "completed" },
  { label: "Ləğv edildi", value: "cancelled" },
];

// ── Order line item form type ─────────────────────────────────────────────────

interface LineItem {
  variant_id: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
}

function emptyLineItem(): LineItem {
  return { variant_id: "", quantity: "1", unit_price: "0", discount_amount: "0" };
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
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

function StatusModal({ order, open, onClose }: StatusModalProps) {
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const statusFilter = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError } = useOrders(page, 20, statusFilter);
  const { data: warehousesData } = useWarehouses();
  const { data: customersData } = useCustomers(1, 100);

  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [createError, setCreateError] = useState<string | null>(null);

  // Status modal state
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);

  // Cancel confirm state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
    setWarehouseId("");
    setCustomerId("");
    setNotes("");
    setShippingAddress("");
    setLineItems([emptyLineItem()]);
    setCreateError(null);
    setCreateModalOpen(true);
  }

  function closeCreate() {
    setCreateModalOpen(false);
    setCreateError(null);
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function lineTotal(item: LineItem): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const disc = parseFloat(item.discount_amount) || 0;
    return qty * price - disc;
  }

  function grandTotal(): number {
    return lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

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
      warehouse_id: warehouseId,
      customer_id: customerId || undefined,
      notes: notes.trim() || undefined,
      shipping_address: shippingAddress.trim() || undefined,
      items: lineItems.map((item) => ({
        variant_id: item.variant_id.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        discount_amount: parseFloat(item.discount_amount) || 0,
      })),
    };

    try {
      await createOrder.mutateAsync(payload);
      closeCreate();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      setCancellingId(null);
    } catch {
      // silently fail
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const warehouses = warehousesData ?? [];
  const customers = customersData?.data ?? [];

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Sifarişlər
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} sifariş mövcuddur`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => downloadExport("/api/v1/export/orders", "orders.csv").catch(console.error)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Sifariş
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "Sifariş №",
                    "Müştəri",
                    "Anbar",
                    "Status",
                    "Ödəniş",
                    "Məbləğ",
                    "Tarix",
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
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Sifarişlər yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir sifariş yoxdur.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((order) => {
                  const isExpanded = expandedRows.has(order.id);
                  const canCancel =
                    order.status !== "completed" &&
                    order.status !== "cancelled" &&
                    order.status !== "returned";

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                          isExpanded && "bg-secondary/20"
                        )}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-primary">
                          <button
                            onClick={() => toggleRow(order.id)}
                            className="flex items-center gap-1.5 hover:underline"
                          >
                            {order.order_number}
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {order.customer?.name ?? (
                            <span className="text-muted-foreground">Pərakəndə</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {order.warehouse.name}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={orderStatusBadge(order.status)}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={paymentStatusBadge(order.payment_status)}>
                            {PAYMENT_STATUS_LABELS[order.payment_status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {order.total_amount.toLocaleString("az-AZ", {
                            style: "currency",
                            currency: order.currency || "AZN",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("az-AZ")}
                        </td>
                        <td className="px-6 py-4">
                          {cancellingId === order.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Ləğv edilsin?
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(order.id)}
                                disabled={cancelOrder.isPending}
                              >
                                Bəli
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancellingId(null)}
                              >
                                Xeyr
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStatusModalOrder(order)}
                                disabled={NEXT_STATUSES[order.status].length === 0}
                              >
                                Status
                              </Button>
                              {canCancel && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setCancellingId(order.id)}
                                  aria-label="Ləğv et"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${order.id}-expanded`}
                          className="border-b border-border/30"
                        >
                          <td colSpan={8} className="p-0">
                            <div className="bg-secondary/20 border-t border-border/30 px-8 py-4">
                              <p className="text-sm font-semibold text-foreground mb-3">
                                Sifariş sətirləri
                              </p>
                              {order.items.length === 0 ? (
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
                                          "Miqdar",
                                          "Qiymət",
                                          "Endirim",
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
                                      {order.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-border/20 last:border-0"
                                        >
                                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                            {item.variant.sku}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground font-medium">
                                            {item.variant.name}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2.5 text-foreground">
                                            {item.unit_price.toLocaleString("az-AZ", {
                                              style: "currency",
                                              currency: "AZN",
                                            })}
                                          </td>
                                          <td className="px-4 py-2.5 text-muted-foreground">
                                            {item.discount_amount > 0
                                              ? item.discount_amount.toLocaleString(
                                                  "az-AZ",
                                                  { style: "currency", currency: "AZN" }
                                                )
                                              : "—"}
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
                              {order.notes && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  <span className="font-medium">Qeyd:</span> {order.notes}
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

      {/* Create Order Modal */}
      <Modal
        open={createModalOpen}
        onClose={closeCreate}
        title="Yeni Sifariş"
        description="Sifariş məlumatlarını və məhsul sətirləri əlavə edin."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Müştəri
              </label>
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Pərakəndə / Guest</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Çatdırılma ünvanı
            </label>
            <Textarea
              placeholder="Şəhər, küçə, ev nömrəsi..."
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
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
              <div className="grid grid-cols-12 gap-2 px-1">
                <p className="col-span-4 text-xs font-bold text-muted-foreground uppercase">
                  Variant ID
                </p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase">
                  Miqdar
                </p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase">
                  Qiymət
                </p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase">
                  Endirim
                </p>
                <p className="col-span-1 text-xs font-bold text-muted-foreground uppercase">
                  Cəmi
                </p>
                <p className="col-span-1" />
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
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
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateLineItem(index, "unit_price", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount_amount}
                      onChange={(e) =>
                        updateLineItem(index, "discount_amount", e.target.value)
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
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Yaradılır..." : "Sifariş yarat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status change modal */}
      <StatusModal
        order={statusModalOrder}
        open={statusModalOrder !== null}
        onClose={() => setStatusModalOrder(null)}
      />
    </div>
  );
}
