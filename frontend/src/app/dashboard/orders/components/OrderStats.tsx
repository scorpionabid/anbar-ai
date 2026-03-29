"use client";

import { ShoppingCart, TrendingUp, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { Order } from "@/types/api";

interface OrderStatsProps {
  orders: Order[];
  totalCount: number;
}

export function OrderStats({ orders, totalCount }: OrderStatsProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter(o => ["pending", "confirmed"].includes(o.status)).length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Cəmi Sifariş" value={totalCount} icon={ShoppingCart} color="blue" />
      <StatCard label="Gəlir (Bu Səhifə)"
        value={totalRevenue.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
        icon={TrendingUp} color="green" />
      <StatCard label="Gözləmədə" value={pendingCount} icon={Clock} color="orange" />
      <StatCard label="Ləğv Edilən" value={cancelledCount} icon={XCircle} color="red" />
    </div>
  );
}
