import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Customer } from "@/types/api";

export interface CreateCustomerPayload {
  customer_type: "individual" | "company";
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  credit_limit?: number;
  is_active?: boolean;
}

export interface UpdateCustomerPayload extends CreateCustomerPayload {
  is_active: boolean;
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation<Customer, Error, CreateCustomerPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Customer>("/customers", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation<Customer, Error, { id: string; payload: UpdateCustomerPayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put<Customer>(`/customers/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
