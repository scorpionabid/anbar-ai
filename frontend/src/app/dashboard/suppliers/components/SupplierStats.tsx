"use client";

import { Truck, CheckCircle2, XCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { Supplier } from "@/types/api";

interface SupplierStatsProps {
  suppliers: Supplier[];
  totalCount: number;
}

export function SupplierStats({ suppliers, totalCount }: SupplierStatsProps) {
  const activeCount = suppliers.filter(s => s.is_active).length;
  const inActiveCount = totalCount - activeCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card glass className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Cəmi Təchizatçı</p>
            <p className="text-xl font-black text-foreground tracking-tight">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-500/10 text-green-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Aktiv</p>
            <p className="text-xl font-black text-foreground tracking-tight">{activeCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shadow-sm">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Deaktiv</p>
            <p className="text-xl font-black text-foreground tracking-tight">{inActiveCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Əsas Kontaktlar</p>
            <p className="text-xl font-black text-foreground tracking-tight">
               {suppliers.filter(s => s.contact_name).length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
