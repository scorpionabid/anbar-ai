"use client";

import { Box, Package, CheckCircle2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { Product } from "@/types/api";

interface ProductStatsProps {
  products: Product[];
  totalCount: number;
}

export function ProductStats({ products, totalCount }: ProductStatsProps) {
  const activeProducts = products.filter(p => p.is_active).length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length ?? 0), 0);
  const categories = new Set(products.map(p => p.category_id)).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card glass className="bg-gradient-to-br from-blue-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Cəmi Məhsul</p>
            <p className="text-xl font-black text-foreground">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-purple-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Cəmi Variant</p>
            <p className="text-xl font-black text-foreground">{totalVariants}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Aktiv Məhsul</p>
            <p className="text-xl font-black text-foreground">{activeProducts}</p>
          </div>
        </CardContent>
      </Card>

      <Card glass className="bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Kateqoriyalar</p>
            <p className="text-xl font-black text-foreground">{categories}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
