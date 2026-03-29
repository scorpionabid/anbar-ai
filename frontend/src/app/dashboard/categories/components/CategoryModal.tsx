"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Tag, Layers, CheckCircle2 } from "lucide-react";
import type { CategoryForm } from "./types";
import type { Category } from "@/types/api";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  target: Category | null;
  form: CategoryForm;
  setForm: (f: CategoryForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
  categories: Category[];
}

export function CategoryModal({
  open,
  onClose,
  target,
  form,
  setForm,
  onSubmit,
  isPending,
  error,
  categories,
}: CategoryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target ? "Kateqoriyanı Düzəlt" : "Yeni Kateqoriya"}
      description={
        target
          ? "Kateqoriya məlumatlarını yeniləyin."
          : "Yeni kateqoriya yaratmaq üçün məlumatları doldurun."
      }
    >
      <form onSubmit={onSubmit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-black text-foreground mb-1.5 flex items-center gap-2 uppercase tracking-tight text-[10px]">
               <Tag className="h-3 w-3 text-primary" /> Ad <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="məs. Elektronika"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-secondary/20 border-border/60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-black text-foreground mb-1.5 flex items-center gap-2 uppercase tracking-tight text-[10px]">
               <Layers className="h-3 w-3 text-primary" /> Ana Kateqoriya
            </label>
            <Select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="bg-secondary/20 border-border/60"
            >
              <option value="">Yoxdur (Əsas Kateqoriya)</option>
              {categories
                .filter((c) => c.id !== target?.id && !c.parent_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
            <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
               * Qeyd: Yalnız ana kateqoriyalar siyahıda görünür.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 text-[10px] font-black uppercase tracking-tight">Açıqlama</label>
          <Textarea
            placeholder="Kateqoriya haqqında qısa məlumat..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="bg-secondary/20 border-border/60 resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-3xl bg-primary/5 border border-primary/10 shadow-inner">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-background border ${form.is_active ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border/40"}`}>
                 <CheckCircle2 className={`h-4 w-4 ${form.is_active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="space-y-0.5">
                 <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Aktiv Status</p>
                 <p className="text-[10px] text-muted-foreground">Kataloqda görünməsini tənzimləyir</p>
              </div>
           </div>
           <button
             type="button"
             onClick={() => setForm({ ...form, is_active: !form.is_active })}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.is_active ? "bg-primary shadow-lg shadow-primary/20 scale-105" : "bg-secondary"}`}
           >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
           </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-2xl px-4 py-3 border border-destructive/20 font-bold animate-in shake-in-1">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-8 rounded-2xl font-bold">Ləğv et</Button>
          <Button type="submit" disabled={isPending} className="h-11 px-10 rounded-2xl font-black shadow-lg shadow-primary/20">
            {isPending ? (
              <div className="flex items-center gap-2">
                 <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Saxlanılır...
              </div>
            ) : (target ? "Yenilə" : "Yarat")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
