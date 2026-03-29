"use client";

import { useState } from "react";
import { 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Hash
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Customer } from "@/types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomerRowProps {
  customer: Customer;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  deletePending: boolean;
}

export function CustomerRow({
  customer,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  deletePending,
}: CustomerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={cn(
        "border-b border-border/30 hover:bg-secondary/30 transition-all group",
        isExpanded && "bg-secondary/20 shadow-inner"
      )}>
        <td className="px-6 py-4 text-sm font-semibold text-foreground">
          <div className="flex items-center gap-3">
             <div className={cn(
               "h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm",
               customer.customer_type === "company" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600" : "bg-purple-500/10 border-purple-500/20 text-purple-600"
             )}>
                {customer.customer_type === "company" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
             </div>
             <div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  {customer.name}
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <div className="flex items-center gap-2 mt-1">
                   {customer.email && (
                     <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-lg border border-border/20">
                        <Mail className="h-2.5 w-2.5" />
                        {customer.email}
                     </div>
                   )}
                   {customer.phone && (
                     <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-lg border border-border/20">
                        <Phone className="h-2.5 w-2.5" />
                        {customer.phone}
                     </div>
                   )}
                </div>
             </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <Badge
            variant={customer.customer_type === "company" ? "default" : "secondary"}
            className="text-[10px] uppercase font-black px-2 shadow-sm"
          >
            {customer.customer_type === "company" ? "Şirkət" : "Fərdi"}
          </Badge>
        </td>
        <td className="px-6 py-4">
           {customer.tax_number ? (
             <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-foreground font-bold">{customer.tax_number}</span>
             </div>
           ) : (
             <span className="text-xs text-muted-foreground italic opacity-50">—</span>
           )}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground max-w-[150px] truncate">
           <div className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {customer.address ?? "—"}
           </div>
        </td>
        <td className="px-6 py-4">
          <Badge variant={customer.is_active ? "success" : "secondary"}>
            {customer.is_active ? "Aktiv" : "Deaktiv"}
          </Badge>
        </td>
        <td className="px-6 py-4 text-right">
          {deletingId === customer.id ? (
            <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-1">
              <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">Silinsin?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(customer.id)}
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
                onClick={() => onEdit(customer)}
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeletingId(customer.id)}
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
          <td colSpan={6} className="p-0">
             <div className="px-16 py-8 border-t border-border/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Yerləşmə
                      </h5>
                      <p className="text-sm font-medium text-foreground bg-background p-4 rounded-3xl border border-border/40 shadow-sm leading-relaxed">
                        {customer.address || "Ünvan daxil edilməyib."}
                      </p>
                   </div>
                   
                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Əlavə Qeydlər
                      </h5>
                      <div className="text-xs text-muted-foreground bg-secondary/20 p-4 rounded-3xl border border-border/20 italic leading-relaxed min-h-[60px]">
                        {customer.notes || "Heç bir qeyd yoxdur."}
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
