"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type ColorTheme =
  | "blue"
  | "green"
  | "red"
  | "amber"
  | "orange"
  | "purple"
  | "indigo"
  | "emerald"
  | "pink"
  | "teal";

const COLOR_MAP: Record<ColorTheme, { card: string; icon: string; text: string }> = {
  blue:    { card: "from-blue-500/10 border-blue-500/20",    icon: "bg-blue-500/10 text-blue-600",    text: "text-blue-600" },
  green:   { card: "from-green-500/10 border-green-500/20",  icon: "bg-green-500/10 text-green-600",  text: "text-green-600" },
  red:     { card: "from-red-500/10 border-red-500/20",      icon: "bg-red-500/10 text-red-600",      text: "text-red-600" },
  amber:   { card: "from-amber-500/10 border-amber-500/20",  icon: "bg-amber-500/10 text-amber-600",  text: "text-amber-600" },
  orange:  { card: "from-orange-500/10 border-orange-500/20",icon: "bg-orange-500/10 text-orange-600",text: "text-orange-600" },
  purple:  { card: "from-purple-500/10 border-purple-500/20",icon: "bg-purple-500/10 text-purple-600",text: "text-purple-600" },
  indigo:  { card: "from-indigo-500/10 border-indigo-500/20",icon: "bg-indigo-500/10 text-indigo-600",text: "text-indigo-600" },
  emerald: { card: "from-emerald-500/10 border-emerald-500/20",icon: "bg-emerald-500/10 text-emerald-600",text: "text-emerald-600" },
  pink:    { card: "from-pink-500/10 border-pink-500/20",    icon: "bg-pink-500/10 text-pink-600",    text: "text-pink-600" },
  teal:    { card: "from-teal-500/10 border-teal-500/20",    icon: "bg-teal-500/10 text-teal-600",    text: "text-teal-600" },
};

interface StatCardProps {
  /** KPI başlığı (kiçik hərf) */
  label: string;
  /** Göstərilən əsas dəyər */
  value: string | number;
  /** Lucide ikonu */
  icon: LucideIcon;
  /** Rəng mövzusu */
  color: ColorTheme;
  /** Əlavə className */
  className?: string;
}

/**
 * Statistik KPI kart komponenti.
 * Bütün `*Stats.tsx` fayllarındakı eyni kart strukturunu birləşdirir.
 *
 * @example
 * <StatCard
 *   label="Cəmi Sifariş"
 *   value={245}
 *   icon={ShoppingCart}
 *   color="blue"
 * />
 */
export function StatCard({ label, value, icon: Icon, color, className }: StatCardProps) {
  const theme = COLOR_MAP[color];

  return (
    <Card
      glass
      className={cn(
        `bg-gradient-to-br to-transparent ${theme.card}`,
        className
      )}
    >
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("p-3 rounded-2xl shadow-sm", theme.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">
            {label}
          </p>
          <p className="text-xl font-black text-foreground tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
