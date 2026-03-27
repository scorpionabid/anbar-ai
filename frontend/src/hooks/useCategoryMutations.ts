import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Category } from "@/types/api";

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
}

export interface UpdateCategoryPayload {
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<Category, Error, CreateCategoryPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Category>("/categories", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation<Category, Error, { id: string; payload: UpdateCategoryPayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.put<Category>(`/categories/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
