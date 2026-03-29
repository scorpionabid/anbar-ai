"use client";

import { Users, Building2, User, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { Customer } from "@/types/api";

interface CustomerStatsProps {
  customers: Customer[];
  totalCount: number;
}

export function CustomerStats({ customers, totalCount }: CustomerStatsProps) {
  const companyCount = customers.filter(c => c.customer_type === "company").length;
  const individualCount = customers.filter(c => c.customer_type === "individual").length;
  const activeCount = customers.filter(c => c.is_active).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card glass className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Cəmi Müştəri</p>
            <p className="text-xl font-black text-foreground tracking-tight">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Şirkətlər</p>
            <p className="text-xl font-black text-foreground tracking-tight">{companyCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Fərdi</p>
            <p className="text-xl font-black text-foreground tracking-tight">{individualCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Aktiv Faizi</p>
            <p className="text-xl font-black text-foreground tracking-tight">
               {totalCount > 0 ? Math.round((activeCount / customers.length) * 100) : 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
