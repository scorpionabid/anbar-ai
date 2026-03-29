"use client";

import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Extracted Components
import { PurchaseOrderStats } from "./components/PurchaseOrderStats";
import { PurchaseOrderRow } from "./components/PurchaseOrderRow";
import { CreatePurchaseOrderModal } from "./components/CreatePurchaseOrderModal";
import { POStatusModal } from "./components/POStatusModal";
import type { PurchaseOrder } from "@/types/api";
import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePurchaseOrders(page, 20);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusModalPO, setStatusModalPO] = useState<PurchaseOrder | null>(null);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             Satınalma Sifarişləri
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} satınalma qeydə alınıb`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 rounded-2xl h-11 px-8 font-black">
            <Plus className="h-4 w-4" />
            Yeni Satınalma
          </Button>
        </div>
      </div>

      {/* KPI Stats Section */}
      {!isLoading && !isError && data && (
        <PurchaseOrderStats orders={data.data} totalCount={data.total} />
      )}

      {/* Table Section */}
      <Card glass className="overflow-hidden border-border/40 shadow-xl shadow-primary/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10">
                <tr className="border-b border-border/50 text-left">
                  {[
                    "Sifariş №",
                    "Təchizatçı",
                    "Anbar",
                    "Status",
                    "Məbləğ",
                    "Tarix",
                    "Əməllər",
                  ].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {isError && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-sm text-destructive">
                       Satınalma sifarişləri yüklənərkən xəta baş verdi. Zəhmət olmasa internet bağlantısını yoxlayın.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center text-sm text-muted-foreground">
                       <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-5" />
                       Hələ heç bir alış sifarişi tapılmadı.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((po) => (
                  <PurchaseOrderRow
                    key={po.id}
                    po={po}
                    onStatusClick={(target) => setStatusModalPO(target)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-5 border-t border-border/50 bg-secondary/5">
              <p className="text-xs font-bold text-muted-foreground opacity-70">
                Səhifə <span className="text-foreground">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1} className="h-9 px-4 rounded-xl">Əvvəlki</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="h-9 px-4 rounded-xl">Növbəti</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreatePurchaseOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <POStatusModal
        po={statusModalPO}
        open={statusModalPO !== null}
        onClose={() => setStatusModalPO(null)}
      />
    </div>
  );
}
