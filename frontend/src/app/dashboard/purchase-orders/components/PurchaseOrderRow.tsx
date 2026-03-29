"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getPOStatusBadge, PO_STATUS_LABELS, NEXT_PO_STATUSES } from "./constants";
import type { PurchaseOrder } from "@/types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PurchaseOrderRowProps {
  po: PurchaseOrder;
  onStatusClick: (po: PurchaseOrder) => void;
}

export function PurchaseOrderRow({ po, onStatusClick }: PurchaseOrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const canChangeStatus = NEXT_PO_STATUSES[po.status].length > 0;

  return (
    <>
      <tr className={cn(
        "border-b border-border/30 hover:bg-secondary/30 transition-all",
        isExpanded && "bg-secondary/20 shadow-inner"
      )}>
        <td className="px-6 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            {po.order_number}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-6 py-4 text-sm font-medium text-foreground">
          {po.supplier.name}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
          {po.warehouse.name}
        </td>
        <td className="px-6 py-4">
          <Badge variant={getPOStatusBadge(po.status)}>
            {PO_STATUS_LABELS[po.status]}
          </Badge>
        </td>
        <td className="px-6 py-4 text-sm font-black text-foreground">
          {po.total_amount.toLocaleString("az-AZ", {
            style: "currency",
            currency: "AZN",
          })}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {new Date(po.created_at).toLocaleDateString("az-AZ")}
        </td>
        <td className="px-6 py-4 text-right">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusClick(po)}
            disabled={!canChangeStatus}
            className="h-8 text-xs font-bold gap-1.5"
          >
            Status
          </Button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-border/30 bg-secondary/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <td colSpan={7} className="p-0">
            <div className="border-t border-border/30 px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                   Sifariş Sətrləri
                   <Badge variant="secondary" className="font-mono">{po.items.length}</Badge>
                </p>
              </div>

              {po.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center bg-background/50 rounded-2xl border border-dashed border-border/40">
                  Səthlər tapılmadı.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/40 bg-background/50 shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/20 border-b border-border/40">
                        {["SKU", "Variant", "Miqdar", "Alınan", "Qiymət", "Cəmi"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {po.items.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {item.variant.sku}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {item.variant.name}
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {item.ordered_quantity}
                          </td>
                          <td className="px-4 py-3">
                             <Badge variant={item.received_quantity >= item.ordered_quantity ? "success" : "warning"} className="px-1.5 h-5 text-[10px]">
                                {item.received_quantity}
                             </Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {item.unit_cost.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
                          </td>
                          <td className="px-4 py-3 font-black text-foreground bg-primary/5">
                            {item.line_total.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(po.notes || po.delivery_date) && (
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {po.notes && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                       <p className="text-[10px] font-black text-primary uppercase mb-1 flex items-center gap-1.5">
                         <FileText className="h-3 w-3" /> Qeydlər
                       </p>
                       <p className="text-xs text-muted-foreground">{po.notes}</p>
                    </div>
                  )}
                  {po.delivery_date && (
                    <div className="p-4 bg-secondary/10 rounded-2xl border border-border/20">
                       <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Gözlənilən Tarix</p>
                       <p className="text-xs font-bold text-foreground">
                         {new Date(po.delivery_date).toLocaleDateString("az-AZ")}
                       </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
