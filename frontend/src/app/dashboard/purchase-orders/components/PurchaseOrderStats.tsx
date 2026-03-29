"use client";

import { ShoppingBag, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { PurchaseOrder } from "@/types/api";

interface POStatsProps {
  orders: PurchaseOrder[];
  totalCount: number;
}

export function PurchaseOrderStats({ orders, totalCount }: POStatsProps) {
  // Simple calculations from the current data slice
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter(o => ["draft", "sent", "confirmed"].includes(o.status)).length;
  const receivedCount = orders.filter(o => o.status === "received").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card glass className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Cəmi Alış</p>
            <p className="text-xl font-black text-foreground tracking-tight">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shadow-sm">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Sərfiyyat</p>
            <p className="text-xl font-black text-foreground tracking-tight">
              {totalSpent.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Gözləmədə</p>
            <p className="text-xl font-black text-foreground tracking-tight">{pendingCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Tam Alınan</p>
            <p className="text-xl font-black text-foreground tracking-tight">{receivedCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
