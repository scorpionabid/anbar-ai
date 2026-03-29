"use client";

import { ShoppingBag, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { PurchaseOrder } from "@/types/api";

interface POStatsProps {
  orders: PurchaseOrder[];
  totalCount: number;
}

export function PurchaseOrderStats({ orders, totalCount }: POStatsProps) {
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter(o => ["draft", "sent", "confirmed"].includes(o.status)).length;
  const receivedCount = orders.filter(o => o.status === "received").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Cəmi Alış" value={totalCount} icon={ShoppingBag} color="indigo" />
      <StatCard
        label="Sərfiyyat"
        value={totalSpent.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
        icon={TrendingDown} color="red" />
      <StatCard label="Gözləmədə" value={pendingCount} icon={Clock} color="orange" />
      <StatCard label="Tam Alınan" value={receivedCount} icon={CheckCircle2} color="emerald" />
    </div>
  );
}
