"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCancelOrder } from "@/hooks/useOrderMutations";
import { cn } from "@/lib/utils";
import { 
  ORDER_STATUS_LABELS, 
  PAYMENT_STATUS_LABELS, 
  getOrderStatusBadge, 
  getPaymentStatusBadge,
  NEXT_STATUSES
} from "./constants";
import type { Order } from "@/types/api";

interface OrderRowProps {
  order: Order;
  onStatusClick: (order: Order) => void;
}

export function OrderRow({ order, onStatusClick }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelOrder = useCancelOrder();

  const canCancel =
    order.status !== "completed" &&
    order.status !== "cancelled" &&
    order.status !== "returned";

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(order.id);
      setIsCancelling(false);
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <tr
        className={cn(
          "border-b border-border/30 hover:bg-secondary/30 transition-colors",
          isExpanded && "bg-secondary/20"
        )}
      >
        <td className="px-6 py-4 text-sm font-semibold text-primary">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 hover:underline"
          >
            {order.order_number}
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </td>
        <td className="px-6 py-4 text-sm text-foreground">
          {order.customer?.name ?? (
            <span className="text-muted-foreground">Pərakəndə</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {order.warehouse.name}
        </td>
        <td className="px-6 py-4">
          <Badge variant={getOrderStatusBadge(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </td>
        <td className="px-6 py-4">
          <Badge variant={getPaymentStatusBadge(order.payment_status)}>
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </Badge>
        </td>
        <td className="px-6 py-4 text-sm font-medium text-foreground">
          {order.total_amount.toLocaleString("az-AZ", {
            style: "currency",
            currency: order.currency || "AZN",
          })}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("az-AZ")}
        </td>
        <td className="px-6 py-4">
          {isCancelling ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Ləğv?
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelOrder.isPending}
                className="h-7 px-2 text-xs"
              >
                Bəli
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCancelling(false)}
                className="h-7 px-2 text-xs"
              >
                Xeyr
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusClick(order)}
                disabled={NEXT_STATUSES[order.status].length === 0}
                className="h-8 text-xs"
              >
                Status
              </Button>
              {canCancel && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsCancelling(true)}
                  aria-label="Ləğv et"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded rows detail section */}
      {isExpanded && (
        <tr className="border-b border-border/30 bg-secondary/5 animate-in fade-in slide-in-from-top-1 duration-200">
          <td colSpan={8} className="p-0">
            <div className="border-t border-border/30 px-8 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                   Sifariş Sətrləri
                   <Badge variant="secondary" className="font-mono">{order.items.length}</Badge>
                </p>
              </div>

              {order.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">Sətir yoxdur.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/40 bg-background/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/20">
                        {["SKU", "Məhsul", "Miqdar", "Qiymət", "Endirim", "Cəmi"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground bg-secondary/5">
                            {item.variant.sku}
                          </td>
                          <td className="px-4 py-3 text-foreground font-medium">
                            {item.variant.name}
                          </td>
                          <td className="px-4 py-3 text-foreground font-semibold">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {item.unit_price.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
                          </td>
                          <td className="px-4 py-3 text-orange-600 font-medium">
                            {item.discount_amount > 0
                              ? `-${item.discount_amount.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {item.line_total.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {order.notes && (
                <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-primary uppercase text-[10px] mr-2">Qeyd:</span> 
                    {order.notes}
                  </p>
                </div>
              )}
              
              {order.shipping_address && (
                <div className="mt-2 p-3 bg-secondary/10 rounded-xl border border-border/20">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold uppercase text-[10px] mr-2">Ünvan:</span> 
                    {order.shipping_address}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
