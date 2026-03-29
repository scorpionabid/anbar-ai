"use client";

import { Truck, CheckCircle2, XCircle, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { Supplier } from "@/types/api";

interface SupplierStatsProps {
  suppliers: Supplier[];
  totalCount: number;
}

export function SupplierStats({ suppliers, totalCount }: SupplierStatsProps) {
  const activeCount = suppliers.filter(s => s.is_active).length;
  const inActiveCount = totalCount - activeCount;
  const withContactCount = suppliers.filter(s => s.contact_name).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Cəmi Təchizatçı" value={totalCount} icon={Truck} color="blue" />
      <StatCard label="Aktiv" value={activeCount} icon={CheckCircle2} color="green" />
      <StatCard label="Deaktiv" value={inActiveCount} icon={XCircle} color="red" />
      <StatCard label="Əsas Kontaktlar" value={withContactCount} icon={Users} color="purple" />
    </div>
  );
}
