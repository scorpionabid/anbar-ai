import { OrderStatus, PaymentStatus } from "@/types/api";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Qaralama",
  confirmed: "Təsdiqləndi",
  processing: "Hazırlanır",
  shipped: "Göndərildi",
  delivered: "Çatdırıldı",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
  returned: "Qaytarıldı",
};

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export function getOrderStatusBadge(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "draft": return "secondary";
    case "confirmed": return "default";
    case "processing": return "warning";
    case "shipped": return "default";
    case "delivered": return "success";
    case "completed": return "success";
    case "cancelled": return "destructive";
    case "returned": return "destructive";
    default: return "default";
  }
}

export function getPaymentStatusBadge(status: PaymentStatus): BadgeVariant {
  switch (status) {
    case "unpaid": return "destructive";
    case "partial": return "warning";
    case "paid": return "success";
    case "refunded": return "secondary";
    default: return "default";
  }
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Ödənilməyib",
  partial: "Qismən ödənilib",
  paid: "Ödənilib",
  refunded: "Geri qaytarıldı",
};

// Valid next status transitions
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["completed", "returned"],
  completed: [],
  cancelled: [],
  returned: [],
};

// Status filter tabs
export const STATUS_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Hamısı", value: "all" },
  { label: "Qaralama", value: "draft" },
  { label: "Təsdiqləndi", value: "confirmed" },
  { label: "Hazırlanır", value: "processing" },
  { label: "Göndərildi", value: "shipped" },
  { label: "Tamamlandı", value: "completed" },
  { label: "Ləğv edildi", value: "cancelled" },
];

export interface LineItem {
  variant_id: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
}

export function emptyLineItem(): LineItem {
  return { variant_id: "", quantity: "1", unit_price: "0", discount_amount: "0" };
}
