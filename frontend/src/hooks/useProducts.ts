import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { ProductListResponse } from "@/types/api";

export function useProducts(
  page = 1,
  perPage = 20,
  search?: string,
  category_id?: string,
  is_active?: boolean
) {
  return useQuery<ProductListResponse>({
    queryKey: ["products", { page, perPage, search, category_id, is_active }],
    queryFn: async () => {
      console.log(`[useProducts] Fetching products (page ${page}, perPage ${perPage}, search "${search || ""}", category "${category_id || ""}", active ${is_active})`);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", String(perPage));
      if (search) params.append("search", search);
      if (category_id) params.append("category_id", category_id);
      if (is_active !== undefined) params.append("is_active", String(is_active));

      try {
        const { data } = await apiClient.get<ProductListResponse>("/products", {
          params,
        });
        console.log(`[useProducts] Successfully fetched ${data.data.length} products (total ${data.total})`);
        return data;
      } catch (err) {
        console.error("[useProducts] Error fetching products:", err);
        throw err;
      }
    },
  });
}
