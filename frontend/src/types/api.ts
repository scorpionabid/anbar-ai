// Matches backend Pydantic schemas exactly

export interface WarehouseSummary {
  id: string;
  name: string;
}

export interface VariantSummary {
  id: string;
  sku: string;
  name: string;
  price: number;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
  available: number;
  warehouse: WarehouseSummary;
  variant: VariantSummary;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  tenant_id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  attributes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  per_page: number;
}

export interface Warehouse {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Category
export interface Category {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  page: number | null;
  per_page: number | null;
}

// Customer
export interface Customer {
  id: string;
  tenant_id: string;
  customer_type: "individual" | "company";
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  tax_id: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  notes: string | null;
  credit_limit: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier
export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms_days: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// StockMovement
export interface StockMovement {
  id: string;
  tenant_id: string;
  inventory_id: string;
  movement_type:
    | "IN"
    | "OUT"
    | "ADJUSTMENT"
    | "RESERVE"
    | "RELEASE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "INITIAL";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  inventory: {
    id: string;
    variant: VariantSummary;
    warehouse: WarehouseSummary;
  };
}

// StockMovementListResponse
export interface StockMovementListResponse {
  data: StockMovement[];
  total: number;
  page: number;
  per_page: number;
}

// Paginated generic
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// Order
export type OrderStatus =
  | "draft"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  cost_price: number | null;
  discount_amount: number;
  line_total: number;
  variant: VariantSummary;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string | null;
  warehouse_id: string;
  channel_id: string | null;
  external_order_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  shipping_address: string | null;
  notes: string | null;
  created_by: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { id: string; name: string } | null;
  warehouse: WarehouseSummary;
  items: OrderItem[];
}

// PurchaseOrder
export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  variant_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  variant: VariantSummary;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_id: string;
  warehouse_id: string;
  status: PurchaseOrderStatus;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier: { id: string; name: string };
  warehouse: WarehouseSummary;
  items: PurchaseOrderItem[];
}

// Channel
export type ChannelType =
  | "manual"
  | "shopify"
  | "woocommerce"
  | "trendyol"
  | "amazon"
  | "ebay"
  | "custom";

export interface Channel {
  id: string;
  tenant_id: string;
  name: string;
  channel_type: ChannelType;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Payment
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "online" | "other";
export type PaymentState = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string;
  payment_method: PaymentMethod;
  state: PaymentState;
  amount: number;
  currency: string;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order: { id: string; order_number: string };
}
