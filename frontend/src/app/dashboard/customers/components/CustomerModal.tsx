"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  CheckCircle2,
  FileText
} from "lucide-react";
import type { CustomerForm } from "./types";
import type { Customer } from "@/types/api";

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  target: Customer | null;
  form: CustomerForm;
  setForm: (f: CustomerForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
}

export function CustomerModal({
  open,
  onClose,
  target,
  form,
  setForm,
  onSubmit,
  isPending,
  error,
}: CustomerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target ? "Müştərini Redaktə Et" : "Yeni Müştəri"}
      description="Müştəri tipini və ətraflı məlumatlarını daxil edin."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                {form.customer_type === "company" ? <Building2 className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-primary" />}
                Müştəri Tipi
             </label>
             <Select
               value={form.customer_type}
               onChange={(e) => setForm({ ...form, customer_type: e.target.value as "individual" | "company" })}
               className="bg-secondary/20 border-border/60"
             >
               <option value="individual">Fərdi</option>
               <option value="company">Şirkət</option>
             </Select>
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-3 w-3 text-primary" /> Ad / Şirkət Adı <span className="text-destructive">*</span>
             </label>
             <Input
               placeholder="Məs. Elnur Quliyev və ya Tech Pro LLC"
               value={form.name}
               onChange={(e) => setForm({ ...form, name: e.target.value })}
               required
               className="bg-secondary/20 border-border/60"
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                <Mail className="h-3 w-3 text-primary" /> E-poçt
             </label>
             <Input
               type="email"
               placeholder="email@example.com"
               value={form.email}
               onChange={(e) => setForm({ ...form, email: e.target.value })}
               className="bg-secondary/20 border-border/60"
             />
          </div>
          <div className="col-span-2 sm:col-span-1">
             <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                <Phone className="h-3 w-3 text-primary" /> Telefon
             </label>
             <Input
               placeholder="+994 50 123 45 67"
               value={form.phone}
               onChange={(e) => setForm({ ...form, phone: e.target.value })}
               className="bg-secondary/20 border-border/60"
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
           <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                 <Hash className="h-3 w-3 text-primary" /> VÖEN / Vergi Nömrəsi
              </label>
              <Input
                placeholder="1234567891"
                value={form.tax_number}
                onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                className="bg-secondary/20 border-border/60"
              />
           </div>
           <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight flex items-center gap-2">
                 <MapPin className="h-3 w-3 text-primary" /> Ünvan
              </label>
              <Input
                placeholder="Şəhər, küçə, bina..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-secondary/20 border-border/60"
              />
           </div>
        </div>

        <div>
           <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight">Əlavə Qeydlər</label>
           <Textarea
             placeholder="Müştəri haqqında qeydlər..."
             value={form.notes}
             onChange={(e) => setForm({ ...form, notes: e.target.value })}
             rows={2}
             className="bg-secondary/20 border-border/60 resize-none"
           />
        </div>

        <div className="flex items-center justify-between p-4 rounded-3xl bg-secondary/20 border border-border/40 backdrop-blur-sm shadow-inner">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-background border ${form.is_active ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border/40"}`}>
                 <CheckCircle2 className={`h-4 w-4 ${form.is_active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="space-y-0.5">
                 <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Aktiv Müştəri</p>
                 <p className="text-[10px] text-muted-foreground italic">Müştəri statusu aktivdir</p>
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
