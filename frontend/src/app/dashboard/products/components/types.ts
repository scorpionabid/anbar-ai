import type { Product, ProductVariant } from "@/types/api";

export interface ProductForm {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  unit_of_measure: string;
  is_active: boolean;
}

export const emptyProductForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  unit_of_measure: "ədəd",
  is_active: true,
};

export interface VariantForm {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  cost_price: string;
  is_active: boolean;
}

export const emptyVariantForm: VariantForm = {
  name: "",
  sku: "",
  barcode: "",
  price: "",
  cost_price: "",
  is_active: true,
};
