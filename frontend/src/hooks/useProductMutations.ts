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
      const { data } = await apiClient.post<Product>("/products", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, { id: string; payload: ProductUpdatePayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
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
      const { data } = await apiClient.post<ProductVariant>(
        `/products/${productId}/variants`,
        payload
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
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
      const { data } = await apiClient.put<ProductVariant>(
        `/products/${productId}/variants/${variantId}`,
        payload
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation<void, Error, { productId: string; variantId: string }>({
    mutationFn: async ({ productId, variantId }) => {
      await apiClient.delete(`/products/${productId}/variants/${variantId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
