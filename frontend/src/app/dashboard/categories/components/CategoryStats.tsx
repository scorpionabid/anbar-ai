"use client";

import { Layers, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
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
      <StatCard label="Ümumi Kateqoriya" value={totalCount} icon={Layers} color="blue" />
      <StatCard label="Aktiv" value={activeCount} icon={CheckCircle2} color="green" />
      <StatCard label="Deaktiv" value={inActiveCount} icon={XCircle} color="amber" />
    </div>
  );
}
