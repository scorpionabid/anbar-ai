"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useWarehouses } from "@/hooks/useWarehouses";
import type { StockMovement } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

// ─── movement type config ─────────────────────────────────────────────────────

const MOVEMENT_TYPE_LABELS: Record<StockMovement["movement_type"], string> = {
  IN: "Giriş",
  OUT: "Çıxış",
  ADJUSTMENT: "Düzəliş",
  RESERVE: "Rezerv",
  RELEASE: "Buraxma",
  TRANSFER_IN: "Transfer (Giriş)",
  TRANSFER_OUT: "Transfer (Çıxış)",
  INITIAL: "İlkin",
};

const MOVEMENT_TYPE_VARIANT: Record<
  StockMovement["movement_type"],
  BadgeProps["variant"]
> = {
  IN: "success",
  INITIAL: "success",
  TRANSFER_IN: "success",
  OUT: "destructive",
  TRANSFER_OUT: "destructive",
  RESERVE: "warning",
  RELEASE: "secondary",
  ADJUSTMENT: "default",
};

// ─── skeleton row ─────────────────────────────────────────────────────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

const ALL_MOVEMENT_TYPES: StockMovement["movement_type"][] = [
  "IN",
  "OUT",
  "ADJUSTMENT",
  "RESERVE",
  "RELEASE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "INITIAL",
];

export default function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [movementType, setMovementType] = useState<string>("");

  const warehouses = useWarehouses();
  const { data, isLoading, isError } = useStockMovements(page, perPage, {
    warehouse_id: warehouseId || undefined,
    movement_type: (movementType as StockMovement["movement_type"]) || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Stok Hərəkətləri
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {isLoading
            ? "Yüklənir..."
            : `Cəmi ${data?.total ?? 0} hərəkət qeydi`}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filterlər</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-52">
              <Select
                label="Anbar"
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="">Bütün Anbarlar</option>
                {(warehouses.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-52">
              <Select
                label="Hərəkət növü"
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="">Hamısı</option>
                {ALL_MOVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MOVEMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-36">
              <Select
                label="Səhifə ölçüsü"
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Tarix", "Variant", "SKU", "Anbar", "Növ", "Miqdar", "Qeyd"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
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
                      Stok hərəkətləri yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Heç bir stok hərəkəti tapılmadı.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((mv) => (
                  <tr
                    key={mv.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(mv.created_at).toLocaleString("az-AZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {mv.inventory.variant.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                      {mv.inventory.variant.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {mv.inventory.warehouse.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={MOVEMENT_TYPE_VARIANT[mv.movement_type]}>
                        {MOVEMENT_TYPE_LABELS[mv.movement_type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      <span
                        className={
                          mv.quantity >= 0 ? "text-green-600" : "text-destructive"
                        }
                      >
                        {mv.quantity >= 0 ? "+" : ""}
                        {mv.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[180px] truncate">
                      {mv.notes ?? <span className="opacity-40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Səhifə {page} / {totalPages} &mdash; cəmi {data?.total ?? 0} qeyd
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
    </div>
  );
}
