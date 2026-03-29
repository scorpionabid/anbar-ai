import { PurchaseOrderStatus } from "@/types/api";

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Qaralama",
  sent: "Göndərildi",
  confirmed: "Təsdiqləndi",
  partial_received: "Qismən alındı",
  received: "Alındı",
  cancelled: "Ləğv edildi",
};

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export function getPOStatusBadge(status: PurchaseOrderStatus): BadgeVariant {
  switch (status) {
    case "draft": return "secondary";
    case "sent": return "default";
    case "confirmed": return "default";
    case "partial_received": return "warning";
    case "received": return "success";
    case "cancelled": return "destructive";
    default: return "secondary";
  }
}

export const ALL_PO_STATUSES: PurchaseOrderStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "partial_received",
  "received",
  "cancelled",
];

export interface POLineItem {
  variant_id: string;
  ordered_quantity: string;
  unit_cost: string;
}

export function emptyPOLineItem(): POLineItem {
  return { variant_id: "", ordered_quantity: "1", unit_cost: "0" };
}

// Next status transitions for PO
export const NEXT_PO_STATUSES: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["confirmed", "cancelled"],
  confirmed: ["partial_received", "received", "cancelled"],
  partial_received: ["received", "cancelled"],
  received: [],
  cancelled: [],
};
