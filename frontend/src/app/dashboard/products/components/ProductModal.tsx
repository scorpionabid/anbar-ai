"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Bot, Sparkles, CheckCircle2, ChevronDown, Package } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useGenerateDescription } from "@/hooks/useAI";
import { type ProductForm } from "./types";
import type { Product } from "@/types/api";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  target: Product | null;
  form: ProductForm;
  setForm: (f: ProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
}

export function ProductModal({
  open,
  onClose,
  target,
  form,
  setForm,
  onSubmit,
  isPending,
  error,
}: ProductModalProps) {
  const { data: categoriesData } = useCategories();
  const generateDescription = useGenerateDescription();

  const handleGenerate = async () => {
    if (!form.name) return;
    try {
      const desc = await generateDescription.mutateAsync(form.name);
      setForm({ ...form, description: desc });
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target ? "Məhsulu Redaktə Et" : "Yeni Məhsul"}
      description="Məhsulun əsas məlumatlarını daxil edin."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
               Məhsulun Adı <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Məs. iPhone 15 Pro"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
               SKU <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Məs. PH-15P-BLK"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
             <Select
                label="Kateqoriya"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
             >
                <option value="">Kateqoriya seçin</option>
                {categoriesData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
             </Select>
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5">Ölçü Vahidi</label>
             <Input
               placeholder="ədəd, kq, litr"
               value={form.unit_of_measure}
               onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
             />
          </div>
        </div>

        <div className="space-y-2 relative group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">Təsvir</label>
            {/* AI Generator Button - Phase 2 Enhancement: Better UI & Premium feel */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generateDescription.isPending || !form.name}
              className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 border-blue-500/20 shadow-sm transition-all animate-in zoom-in-50"
            >
              {generateDescription.isPending ? (
                <div className="flex items-center gap-2">
                   <div className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                   Yaradılır...
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group-hover:animate-pulse">
                   <Bot className="h-4 w-4 text-blue-500" />
                   AI ilə Yaz (Magic)
                   <Sparkles className="h-3 w-3 text-purple-500" />
                </div>
              )}
            </Button>
          </div>
          <Textarea
            placeholder="Məhsul barədə ətraflı məlumat..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="resize-none border-border/60 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/40">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background border border-border/50">
                 <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                 <p className="text-xs font-bold text-foreground">Status</p>
                 <p className="text-[10px] text-muted-foreground">Məhsulun sistemdə aktivliyi</p>
              </div>
           </div>
           <button
             type="button"
             onClick={() => setForm({ ...form, is_active: !form.is_active })}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.is_active ? "bg-primary shadow-lg shadow-primary/20" : "bg-secondary"}`}
           >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
           </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 animate-in shake-in-1">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6">Ləğv et</Button>
          <Button type="submit" disabled={isPending} className="h-11 px-8 min-w-[140px] shadow-lg shadow-primary/10">
            {isPending ? (
              <div className="flex items-center gap-2">
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Saxlanılır...
              </div>
            ) : "Yadda Saxla"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
