"use client";

import { Package, ShoppingCart, Truck, Activity, User } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ActivityItem, ActivityType } from "@/types/api";

function timeAgo(isoString: string): string {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "indicə";
  if (mins < 60) return `${mins} dəq əvvəl`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.floor(hours / 24);
  return `${days} gün əvvəl`;
}

function activityIcon(type: ActivityType) {
  if (type === "stock_movement") return <Package className="h-4 w-4 text-blue-500" />;
  if (type === "order") return <ShoppingCart className="h-4 w-4 text-green-500" />;
  if (type === "purchase_order") return <Truck className="h-4 w-4 text-orange-500" />;
  if (type === "user") return <User className="h-4 w-4 text-purple-500" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  stock_movement: "Stok",
  order: "Sifariş",
  purchase_order: "Alış",
  user: "İstifadəçi",
};

export function AktivlikTab() {
  const activity = useActivity();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-7 w-7 text-primary" /> Son Aktivlik
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {activity.isLoading ? "Yüklənir..." : `Son ${activity.data?.length ?? 0} fəaliyyət`}
        </p>
      </div>

      <Card glass>
        <CardContent className="p-6">
          {activity.isLoading && (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/60 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary/60 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-secondary/40 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activity.isError && (
            <div className="p-8 text-center text-sm text-destructive bg-destructive/5 rounded-xl">
              Aktivlik yüklənərkən xəta baş verdi.
            </div>
          )}

          {!activity.isLoading && !activity.isError && activity.data?.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Hələ heç bir aktivlik yoxdur
            </div>
          )}

          {/* Phase 2: Vertical Timeline UI */}
          <div className="relative space-y-2">
            {!activity.isLoading && !activity.isError && (activity.data ?? []).map((item: ActivityItem, idx: number) => (
              <div key={item.id} className="relative flex gap-6 pb-6 last:pb-0">
                {/* Timeline line */}
                {idx !== (activity.data?.length ?? 0) - 1 && (
                  <div className="absolute left-[15px] top-8 w-px h-full bg-border/40" />
                )}
                
                {/* Icon dot */}
                <div className="relative z-10 mt-0.5 h-8 w-8 rounded-full bg-secondary/30 border border-border/50 flex items-center justify-center shrink-0">
                  {activityIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-0.5">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase tracking-wider font-bold">
                      {ACTIVITY_TYPE_LABELS[item.type]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-snug">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
