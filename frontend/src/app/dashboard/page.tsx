"use client";

import { useInventory } from "@/hooks/useInventory";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useReorderSuggestions } from "@/hooks/useAI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Boxes, Package, Warehouse, AlertTriangle, ArrowRight, Bot, TrendingDown } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, description, icon: Icon, color }: StatCardProps) {
  return (
    <Card glass className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-110", color)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={cn("p-2 rounded-xl bg-secondary/50", color.replace("bg-", "text-"))}>
          <Icon size={18} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 font-medium italic">{description}</p>
      </CardContent>
    </Card>
  );
}

import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const inventory = useInventory();
  const products = useProducts(1, 1);
  const warehouses = useWarehouses();
  const reorderSuggestions = useReorderSuggestions();

  const totalAvailable = inventory.data?.reduce((sum, i) => sum + i.available, 0) ?? 0;
  const totalReserved = inventory.data?.reduce((sum, i) => sum + i.reserved_quantity, 0) ?? 0;
  const activeWarehouses = warehouses.data?.filter((w) => w.is_active).length ?? 0;
  const totalProducts = products.data?.total ?? 0;
  const inventoryPositions = inventory.data?.length ?? 0;

  return (
    <div className="space-y-10 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground font-medium mt-1">Sistem haqqında ümumi icmal və göstəricilər</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-background/50">
            Last update: Today, 08:58
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Stok Pozisiyaları"
          value={inventoryPositions}
          description="Aktiv anbar pozisiyaları"
          icon={Boxes}
          color="bg-blue-500"
        />
        <StatCard
          title="Mövcud Stok"
          value={totalAvailable.toLocaleString()}
          description="Satışa hazır vahidlər"
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="Rezerv Edilmiş"
          value={totalReserved.toLocaleString()}
          description="Sifarişdə olan vahidlər"
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <StatCard
          title="Məhsul Çeşidi"
          value={totalProducts}
          description={`${activeWarehouses} aktiv anbar üzrə`}
          icon={Warehouse}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Alerts */}
        <Card glass className="lg:col-span-2 lg:row-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Kritik Stok Səviyyəsi</CardTitle>
              <CardDescription>Ehtiyatı 10 vahiddən az olan məhsullar</CardDescription>
            </div>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group">
              Hamısına bax <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {inventory.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 w-full bg-secondary/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {(inventory.data ?? [])
                  .filter((i) => i.available < 10)
                  .slice(0, 6)
                  .map((i) => (
                    <div key={i.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/50 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm",
                          i.available === 0 ? "bg-red-500/10 text-red-600" : "bg-orange-500/10 text-orange-600"
                        )}>
                          {i.variant.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{i.variant.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            {i.warehouse.name} · {i.variant.sku}
                          </p>
                        </div>
                      </div>
                      <Badge variant={i.available === 0 ? "destructive" : "warning"} className="font-black">
                        {i.available} qalıb
                      </Badge>
                    </div>
                  ))}
                {(inventory.data ?? []).filter((i) => i.available < 10).length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground font-medium">Bütün məhsullar kifayət qədər stokdadır.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Reorder Widget */}
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Reorder Tövsiyələri
              </CardTitle>
              <CardDescription>Yenidən sifariş lazım olan məhsullar</CardDescription>
            </div>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group">
              Hamısına bax <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {reorderSuggestions.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(n => <div key={n} className="h-10 w-full bg-secondary/50 rounded-xl animate-pulse" />)}
              </div>
            ) : (reorderSuggestions.data?.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground font-medium">Bütün stoklar normaldır ✓</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(reorderSuggestions.data ?? []).slice(0, 5).map(s => (
                  <div key={s.variant_id + s.warehouse_name} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.variant_name}</p>
                        <p className="text-xs text-muted-foreground">{s.warehouse_name} · {s.avg_daily_consumption}/gün</p>
                      </div>
                    </div>
                    <Badge variant="warning">+{s.suggested_quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Status */}
        <Card glass>
          <CardHeader>
            <CardTitle>Anbarların Vəziyyəti</CardTitle>
            <CardDescription>Sistemdəki aktiv saxlama yerləri</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouses.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 w-full bg-secondary/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(warehouses.data ?? []).map((w) => (
                  <div key={w.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/5 group hover:bg-secondary/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{w.name}</p>
                      <Badge variant={w.is_active ? "success" : "secondary"}>
                        {w.is_active ? "Aktiv" : "Passiv"}
                      </Badge>
                    </div>
                    {w.address && (
                      <p className="mt-1 text-[10px] text-muted-foreground font-medium truncate">{w.address}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
