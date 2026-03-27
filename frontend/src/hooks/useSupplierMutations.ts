import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Supplier } from "@/types/api";

export interface CreateSupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  address?: string;
  tax_id?: string;
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
      const { data } = await apiClient.post<Supplier>("/suppliers", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation<Supplier, Error, { id: string; payload: UpdateSupplierPayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put<Supplier>(`/suppliers/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/suppliers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
