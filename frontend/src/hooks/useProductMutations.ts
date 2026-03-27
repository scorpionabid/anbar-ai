import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Product, ProductVariant } from "@/types/api";

// ── Product payloads ───────────────────────────────────────────────────────────

export interface ProductCreatePayload {
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  is_active?: boolean;
  unit_of_measure?: string;
}

export interface ProductUpdatePayload {
  name?: string;
  sku?: string;
  description?: string;
  category_id?: string | null;
  is_active?: boolean;
  unit_of_measure?: string;
}

// ── Variant payloads ───────────────────────────────────────────────────────────

export interface VariantCreatePayload {
  name: string;
  sku: string;
  price: number;
  cost_price?: number;
  barcode?: string;
  is_active?: boolean;
}

export interface VariantUpdatePayload {
  name?: string;
  sku?: string;
  price?: number;
  cost_price?: number;
  barcode?: string;
  is_active?: boolean;
}

// ── Product mutations ──────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, ProductCreatePayload>({
    mutationFn: async (payload) => {
      console.log("[useCreateProduct] Creating product with payload:", payload);
      const { data } = await apiClient.post<Product>("/products", payload);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useCreateProduct] Successfully created product:", data);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useCreateProduct] Error creating product:", error);
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, { id: string; payload: ProductUpdatePayload }>({
    mutationFn: async ({ id, payload }) => {
      console.log(`[useUpdateProduct] Updating product ${id} with payload:`, payload);
      const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useUpdateProduct] Successfully updated product:", data);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useUpdateProduct] Error updating product:", error);
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      console.log(`[useDeleteProduct] Deleting product ${id}`);
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: (_, id) => {
      console.log(`[useDeleteProduct] Successfully deleted product ${id}`);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useDeleteProduct] Error deleting product:", error);
    },
  });
}

// ── Variant mutations ──────────────────────────────────────────────────────────

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation<
    ProductVariant,
    Error,
    { productId: string; payload: VariantCreatePayload }
  >({
    mutationFn: async ({ productId, payload }) => {
      console.log(`[useCreateVariant] Creating variant for product ${productId}:`, payload);
      const { data } = await apiClient.post<ProductVariant>(
        `/products/${productId}/variants`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      console.log("[useCreateVariant] Successfully created variant:", data);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useCreateVariant] Error creating variant:", error);
    },
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation<
    ProductVariant,
    Error,
    { productId: string; variantId: string; payload: VariantUpdatePayload }
  >({
    mutationFn: async ({ productId, variantId, payload }) => {
      console.log(`[useUpdateVariant] Updating variant ${variantId} of product ${productId}:`, payload);
      const { data } = await apiClient.put<ProductVariant>(
        `/products/${productId}/variants/${variantId}`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      console.log("[useUpdateVariant] Successfully updated variant:", data);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useUpdateVariant] Error updating variant:", error);
    },
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation<void, Error, { productId: string; variantId: string }>({
    mutationFn: async ({ productId, variantId }) => {
      console.log(`[useDeleteVariant] Deleting variant ${variantId} of product ${productId}`);
      await apiClient.delete(`/products/${productId}/variants/${variantId}`);
    },
    onSuccess: (_, { variantId }) => {
      console.log(`[useDeleteVariant] Successfully deleted variant ${variantId}`);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("[useDeleteVariant] Error deleting variant:", error);
    },
  });
}
