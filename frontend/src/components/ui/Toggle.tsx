"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  /** Aktiv (açıq) vəziyyətdə mi */
  checked: boolean;
  /** Dəyişiklik hadisəsi */
  onChange: (checked: boolean) => void;
  /** Başlıq mətni */
  label: string;
  /** Alt izah mətni */
  description?: string;
  /** Əlavə wrapper class */
  className?: string;
}

/**
 * Premium Toggle (açar) komponenti.
 * 5 modal faylındakı eyni `is_active` toggle HTML-ni birləşdirir.
 *
 * @example
 * <Toggle
 *   checked={form.is_active}
 *   onChange={(v) => setForm({ ...form, is_active: v })}
 *   label="Aktiv Status"
 *   description="Sistemdə aktiv görünər"
 * />
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  className,
}: ToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-3xl bg-secondary/20 border border-border/40 backdrop-blur-sm shadow-inner",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-xl bg-background border transition-all",
            checked
              ? "border-primary/40 shadow-sm shadow-primary/10"
              : "border-border/40"
          )}
        >
          <CheckCircle2
            className={cn(
              "h-4 w-4 transition-colors",
              checked ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            {label}
          </p>
          {description && (
            <p className="text-[10px] text-muted-foreground italic">
              {description}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300",
          checked ? "bg-primary shadow-lg shadow-primary/20" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
