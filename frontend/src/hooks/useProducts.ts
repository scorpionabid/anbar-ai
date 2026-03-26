import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { ProductListResponse } from "@/types/api";

export function useProducts(page = 1, perPage = 20) {
  return useQuery<ProductListResponse>({
    queryKey: ["products", page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductListResponse>("/products", {
        params: { page, per_page: perPage },
      });
      return data;
    },
  });
}
