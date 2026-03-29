"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Layers, CheckCircle2, XCircle } from "lucide-react";
import { type VariantForm } from "./types";
import type { Product, ProductVariant } from "@/types/api";

interface VariantModalProps {
  open: boolean;
  onClose: () => void;
  productTarget: Product | null;
  variantTarget: ProductVariant | null;
  form: VariantForm;
  setForm: (f: VariantForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
}

export function VariantModal({
  open,
  onClose,
  productTarget,
  variantTarget,
  form,
  setForm,
  onSubmit,
  isPending,
  error,
}: VariantModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={variantTarget ? "Variantı Redaktə Et" : "Yeni Variant"}
      description={productTarget ? `Məhsul: ${productTarget.name}` : "Məhsulun xüsusiyyətlərini (rəng, ölçü və s.) daxil edin."}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
               Variantın Adı <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Məs. Black 256GB"
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
              placeholder="Məs. PH-BLK-256"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Barkod</label>
            <Input
              placeholder="Barkod daxil edin"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Qiymət (Satış)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Maya Dəyəri</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/40">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background border border-border/50">
                 {form.is_active ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                 <p className="text-xs font-bold text-foreground">Status</p>
                 <p className="text-[10px] text-muted-foreground">Məhsul variantının aktivliyi</p>
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
