"use client";

import { ShoppingCart, TrendingUp, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { Order } from "@/types/api";

interface OrderStatsProps {
  orders: Order[];
  totalCount: number;
}

export function OrderStats({ orders, totalCount }: OrderStatsProps) {
  // Simple calculations from the current data slice
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter(o => o.status === "confirmed" || o.status === "processing").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card glass className="bg-gradient-to-br from-blue-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Cəmi Sifariş</p>
            <p className="text-xl font-black text-foreground">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-500/10 text-green-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Cari Gəlir</p>
            <p className="text-xl font-black text-foreground">
              {totalRevenue.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-orange-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Gözləmədə</p>
            <p className="text-xl font-black text-foreground">{pendingCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-red-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Ləğv Edilən</p>
            <p className="text-xl font-black text-foreground">{cancelledCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
