import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Supplier } from "@/types/api";

export interface CreateSupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  contact_name?: string;
  address?: string;
  tax_number?: string;
  payment_terms_days?: number;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateSupplierPayload extends CreateSupplierPayload {
  is_active: boolean;
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation<Supplier, Error, CreateSupplierPayload>({
    mutationFn: async (payload) => {
      console.log("[useCreateSupplier] Creating supplier with payload:", payload);
      const { data } = await apiClient.post<Supplier>("/suppliers", payload);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useCreateSupplier] Successfully created supplier:", data);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      console.error("[useCreateSupplier] Error creating supplier:", error);
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation<Supplier, Error, { id: string; payload: UpdateSupplierPayload }>({
    mutationFn: async ({ id, payload }) => {
      console.log(`[useUpdateSupplier] Updating supplier ${id} with payload:`, payload);
      const { data } = await apiClient.put<Supplier>(`/suppliers/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useUpdateSupplier] Successfully updated supplier:", data);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      console.error("[useUpdateSupplier] Error updating supplier:", error);
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      console.log(`[useDeleteSupplier] Deleting supplier ${id}`);
      await apiClient.delete(`/suppliers/${id}`);
    },
    onSuccess: (_, id) => {
      console.log(`[useDeleteSupplier] Successfully deleted supplier ${id}`);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      console.error("[useDeleteSupplier] Error deleting supplier:", error);
    },
  });
}
