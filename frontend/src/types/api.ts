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
  barcode?: string | null;
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
  barcode?: string | null;
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
  description: string | null;
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
  tax_number: string | null;
  address: string | null;
  notes: string | null;
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
  contact_name: string | null;
  address: string | null;
  tax_number: string | null;
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
  movement_type: "IN" | "OUT" | "ADJUSTMENT" | "RESERVE" | "RELEASE";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  user_id: string | null;
  created_at: string;
  inventory: {
    id: string;
    variant: VariantSummary;
    warehouse: WarehouseSummary;
  } | null;
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
  | "confirmed"
  | "partial_received"
  | "received"
  | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  variant_id: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  line_total: number;
  variant?: VariantSummary;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_id: string | null;
  warehouse_id: string;
  status: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  received_at: string | null;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier: { id: string; name: string } | null;
  warehouse: WarehouseSummary | null;
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
  | "custom"
  | "store"
  | "marketplace"
  | "wholesale"
  | "api";

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
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "online" | "marketplace";
export type PaymentState = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string;
  payment_method: PaymentMethod;
  status: PaymentState;
  state: PaymentState;
  amount: number;
  currency: string;
  external_payment_id: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order: { id: string; order_number: string } | null;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export type WeightUnit = "kg" | "g" | "lb" | "oz";
export type DimensionUnit = "cm" | "m" | "in" | "ft";
export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface TenantSettings {
  currency: string;
  weight_unit: WeightUnit;
  dimension_unit: DimensionUnit;
  timezone: string;
  tax_rate: number;
  low_stock_threshold: number;
  date_format: DateFormat;
}

export type TenantSettingsUpdate = Partial<TenantSettings>;

// ── AI Provider Keys ──────────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic" | "gemini" | "azure_openai" | "mistral";

export interface AIKeyRead {
  provider: AIProvider;
  key_preview: string;
  model_override: string | null;
  is_active: boolean;
}

export interface AIKeyUpsert {
  provider: AIProvider;
  api_key: string;
  model_override?: string | null;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "warehouse_manager"
  | "sales_manager"
  | "operator"
  | "vendor";

export type Permission =
  | "inventory:read"
  | "inventory:write"
  | "inventory:manage"
  | "orders:read"
  | "orders:write"
  | "orders:manage"
  | "customers:read"
  | "customers:write"
  | "customers:manage"
  | "settings:manage"
  | "users:manage"
  | "ai:use"
  | "ai:manage"
  | "channels:manage"
  | "reports:view";

export interface UserRead {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  permissions: Permission[];
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  permissions?: Permission[];
}

export interface UserUpdate {
  full_name?: string;
  role?: UserRole;
  permissions?: Permission[];
  is_active?: boolean;
}

export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}

// ── Notification Settings ─────────────────────────────────────────────────────

export interface NotificationSettings {
  email_low_stock: boolean;
  email_new_order: boolean;
  email_payment: boolean;
  low_stock_email: string | null;
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | "order.created"
  | "order.status_changed"
  | "inventory.low_stock"
  | "payment.received"
  | "purchase_order.created";

export interface WebhookRead {
  id: string;
  url: string;
  events: WebhookEvent[];
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WebhookCreate {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  description?: string;
}

export interface WebhookUpdate {
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
  description?: string;
}

// ── Activity Log ──────────────────────────────────────────────────────────────

export type ActivityType = "stock_movement" | "order" | "purchase_order" | "user";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
