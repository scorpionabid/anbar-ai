"use client";

import { Users, Building2, User, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { Customer } from "@/types/api";

interface CustomerStatsProps {
  customers: Customer[];
  totalCount: number;
}

export function CustomerStats({ customers, totalCount }: CustomerStatsProps) {
  const companyCount = customers.filter(c => c.customer_type === "company").length;
  const individualCount = customers.filter(c => c.customer_type === "individual").length;
  const activePercent = customers.length > 0
    ? Math.round((customers.filter(c => c.is_active).length / customers.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Cəmi Müştəri" value={totalCount} icon={Users} color="blue" />
      <StatCard label="Şirkətlər" value={companyCount} icon={Building2} color="indigo" />
      <StatCard label="Fərdi" value={individualCount} icon={User} color="purple" />
      <StatCard label="Aktivlik Faizi" value={`${activePercent}%`} icon={CheckCircle2} color="emerald" />
    </div>
  );
}
