"use client";

import { Package, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { Product } from "@/types/api";

interface ProductStatsProps {
  products: Product[];
  totalCount: number;
}

export function ProductStats({ products, totalCount }: ProductStatsProps) {
  const activeCount = products.filter(p => p.is_active).length;
  const variantCount = products.reduce((sum, p) => sum + (p.variants?.length ?? 0), 0);
  const avgVariants = totalCount > 0 ? (variantCount / products.length).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Cəmi Məhsul" value={totalCount} icon={Package} color="blue" />
      <StatCard label="Aktiv Məhsul" value={activeCount} icon={CheckCircle2} color="green" />
      <StatCard label="Cəmi Variant" value={variantCount} icon={Layers} color="purple" />
      <StatCard label="Ort. Variant / Məhsul" value={avgVariants} icon={TrendingUp} color="amber" />
    </div>
  );
}
