"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { 
  Truck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Hash,
  CheckCircle2
} from "lucide-react";
import type { SupplierForm } from "./types";
import type { Supplier } from "@/types/api";

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  target: Supplier | null;
  form: SupplierForm;
  setForm: (f: SupplierForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
}

export function SupplierModal({
  open,
  onClose,
  target,
  form,
  setForm,
  onSubmit,
  isPending,
  error,
}: SupplierModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target ? "Təchizatçını Redaktə Et" : "Yeni Təchizatçı"}
      description="Təchizatçı və əlaqə məlumatlarını daxil edin."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Təchizatçı Adı <span className="text-destructive">*</span>
             </label>
             <Input
               placeholder="Məs. Global Logistics LLC"
               value={form.name}
               onChange={(e) => setForm({ ...form, name: e.target.value })}
               required
             />
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Kontakt Şəxs
             </label>
             <Input
               placeholder="Məs. Əli Məmmədov"
               value={form.contact_name}
               onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> E-poçt
             </label>
             <Input
               type="email"
               placeholder="info@supplier.az"
               value={form.email}
               onChange={(e) => setForm({ ...form, email: e.target.value })}
             />
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Telefon
             </label>
             <Input
               placeholder="+994 50 123 45 67"
               value={form.phone}
               onChange={(e) => setForm({ ...form, phone: e.target.value })}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" /> VÖEN
             </label>
             <Input
               placeholder="1234567891"
               value={form.tax_number}
               onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
             />
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Ödəniş müddəti (Gün)
             </label>
             <Input
               type="number"
               min="0"
               value={form.payment_terms_days}
               onChange={(e) => setForm({ ...form, payment_terms_days: parseInt(e.target.value) || 0 })}
             />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-border/40">
           <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-primary" /> Ünvan
              </label>
              <Textarea
                placeholder="Şəhər, küçə, bina..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="resize-none"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Əlavə Qeydlər</label>
              <Textarea
                placeholder="Təchizatçı haqqında qeydlər..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="resize-none"
              />
           </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/40">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background border border-border/50">
                 <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                 <p className="text-xs font-bold text-foreground">Aktiv Status</p>
                 <p className="text-[10px] text-muted-foreground">Sistemdə aktiv təchizatçı</p>
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
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-8 rounded-xl font-bold">
            Ləğv et
          </Button>
          <Button type="submit" disabled={isPending} className="h-11 px-10 rounded-xl font-black shadow-lg shadow-primary/10">
            {isPending ? "Yadda saxlanılır..." : "Təsdiqlə"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
