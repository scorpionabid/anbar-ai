import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, Supplier } from "@/types/api";

export function useSuppliers(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<Supplier>>({
    queryKey: ["suppliers", page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers", {
        params: { page, per_page: perPage },
      });
      return data;
    },
  });
}
