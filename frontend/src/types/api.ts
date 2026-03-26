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
