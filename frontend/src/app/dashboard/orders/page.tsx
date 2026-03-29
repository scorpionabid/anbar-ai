"use client";

import { useState } from "react";
import { Plus, Download, ShoppingCart } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { SkeletonRow } from "@/components/ui/SkeletonRow";
import { useOrders } from "@/hooks/useOrders";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Extracted Components
import { STATUS_TABS } from "./components/constants";
import { StatusModal } from "./components/StatusModal";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { OrderRow } from "./components/OrderRow";
import { OrderStats } from "./components/OrderStats";
import type { Order, OrderStatus } from "@/types/api";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const statusFilter = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError } = useOrders(page, 20, statusFilter);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Sifarişlər
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} satış sifarişi daxil edilib`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => downloadExport("/api/v1/export/orders", "orders.csv").catch(console.error)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Sifariş
          </Button>
        </div>
      </div>

      {/* KPI Cards Section */}
      {!isLoading && !isError && data && (
        <OrderStats orders={data.data} totalCount={data.total} />
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap items-center bg-secondary/20 p-1.5 rounded-2xl w-fit border border-border/30">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.value
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10">
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
                    <td
                      colSpan={8}
                      className="px-6 py-20 text-center text-sm text-destructive"
                    >
                      Məlumatlar yüklənərkən xəta baş verdi. Zəhmət olmasa internet bağlantısını yoxlayın.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-20 text-center text-sm text-muted-foreground"
                    >
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      Hələ heç bir sifariş tapılmadı.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    onStatusClick={(o) => setStatusModalOrder(o)} 
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/5">
              <p className="text-sm font-medium text-muted-foreground">
                Səhifə <span className="text-foreground">{page}</span> / {totalPages}
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

      {/* Modals */}
      {statusModalOrder && (
        <StatusModal
          open={statusModalOrder !== null}
          order={statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
        />
      )}

      {createModalOpen && (
        <CreateOrderModal 
          open={createModalOpen} 
          onClose={() => setCreateModalOpen(false)} 
        />
      )}
    </div>
  );
}
