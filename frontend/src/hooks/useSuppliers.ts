import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, Supplier } from "@/types/api";

export function useSuppliers(
  page = 1,
  perPage = 20,
  search?: string,
  is_active?: boolean
) {
  return useQuery<PaginatedResponse<Supplier>>({
    queryKey: ["suppliers", { page, perPage, search, is_active }],
    queryFn: async () => {
      console.log(`[useSuppliers] Fetching suppliers (page ${page}, perPage ${perPage}, search "${search || ""}", active ${is_active})`);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", String(perPage));
      if (search) params.append("search", search);
      if (is_active !== undefined) params.append("is_active", String(is_active));

      try {
        const { data } = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers", {
          params,
        });
        console.log(`[useSuppliers] Successfully fetched ${data.data.length} suppliers (total ${data.total})`);
        return data;
      } catch (err) {
        console.error("[useSuppliers] Error fetching suppliers:", err);
        throw err;
      }
    },
  });
}
