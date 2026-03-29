"use client";

import { Layers, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { Category } from "@/types/api";

interface CategoryStatsProps {
  categories: Category[];
  totalCount: number;
}

export function CategoryStats({ categories, totalCount }: CategoryStatsProps) {
  const activeCount = categories.filter(c => c.is_active).length;
  const inActiveCount = totalCount - activeCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card glass className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Ümumi Kateqoriya</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{totalCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm border border-blue-500/20">
            <Layers size={22} />
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Aktiv</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{activeCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shadow-sm border border-green-500/20">
            <CheckCircle2 size={22} />
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Deaktiv</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{inActiveCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm border border-amber-500/20">
            <XCircle size={22} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
