import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Warehouse } from "@/types/api";

export interface CreateWarehousePayload {
  name: string;
  address?: string;
  is_active?: boolean;
}

export interface UpdateWarehousePayload {
  name: string;
  address?: string;
  is_active: boolean;
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation<Warehouse, Error, CreateWarehousePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Warehouse>("/warehouses", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation<Warehouse, Error, { id: string; payload: UpdateWarehousePayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put<Warehouse>(`/warehouses/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/warehouses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}
