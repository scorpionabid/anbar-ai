"use client";

import { useState } from "react";
import { 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  User,
  Hash
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Supplier } from "@/types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupplierRowProps {
  supplier: Supplier;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  deletePending: boolean;
}

export function SupplierRow({
  supplier,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  deletePending,
}: SupplierRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={cn(
        "border-b border-border/30 hover:bg-secondary/30 transition-all group",
        isExpanded && "bg-secondary/20 shadow-inner"
      )}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
               <Truck className="h-5 w-5 text-primary" />
             </div>
             <div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  {supplier.name}
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <div className="flex items-center gap-2 mt-1">
                   {supplier.email && (
                     <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-lg border border-border/20">
                        <Mail className="h-2.5 w-2.5" />
                        {supplier.email}
                     </div>
                   )}
                   {supplier.phone && (
                     <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-lg border border-border/20">
                        <Phone className="h-2.5 w-2.5" />
                        {supplier.phone}
                     </div>
                   )}
                </div>
             </div>
          </div>
        </td>
        <td className="px-6 py-4">
           {supplier.contact_name ? (
             <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {supplier.contact_name}
             </p>
           ) : (
             <span className="text-xs text-muted-foreground italic">—</span>
           )}
        </td>
        <td className="px-6 py-4">
           {supplier.tax_number ? (
             <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-foreground font-bold">{supplier.tax_number}</span>
             </div>
           ) : (
             <span className="text-xs text-muted-foreground italic">—</span>
           )}
        </td>
        <td className="px-6 py-4">
          <Badge variant={supplier.is_active ? "success" : "secondary"}>
            {supplier.is_active ? "Aktiv" : "Deaktiv"}
          </Badge>
        </td>
        <td className="px-6 py-4 text-right">
          {deletingId === supplier.id ? (
            <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-1">
              <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">Silinsin?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(supplier.id)}
                disabled={deletePending}
                className="h-7 px-3 text-[11px] rounded-lg"
              >
                Bəli
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeletingId(null)}
                className="h-7 px-3 text-[11px] rounded-lg"
              >
                Xeyr
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(supplier)}
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeletingId(supplier.id)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-border/30 bg-secondary/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <td colSpan={5} className="p-0">
             <div className="px-12 py-6 border-t border-border/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Ünvan Məlumatı
                      </h5>
                      <p className="text-sm font-medium text-foreground bg-background p-3 rounded-2xl border border-border/40 shadow-sm leading-relaxed">
                        {supplier.address || "Ünvan daxil edilməyib."}
                      </p>
                   </div>
                   
                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> Ödəniş Şərtləri
                      </h5>
                      <div className="bg-background p-3 rounded-2xl border border-border/40 shadow-sm flex items-center justify-between">
                         <span className="text-xs text-muted-foreground font-bold">Müddət (Gün):</span>
                         <Badge variant="warning" className="font-mono text-xs">{supplier.payment_terms_days} gün</Badge>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Qeydlər
                      </h5>
                      <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-2xl border border-border/20 italic leading-relaxed min-h-[50px]">
                        {supplier.notes || "Heç bir qeyd yoxdur."}
                      </div>
                   </div>
                </div>
             </div>
          </td>
        </tr>
      )}
    </>
  );
}
