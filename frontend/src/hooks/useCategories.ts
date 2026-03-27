import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { CategoryListResponse } from "@/types/api";

interface UseCategoriesProps {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export function useCategories({
  search,
  is_active,
  page,
  per_page,
}: UseCategoriesProps = {}) {
  return useQuery<CategoryListResponse>({
    queryKey: ["categories", { search, is_active, page, per_page }],
    queryFn: async () => {
      console.log("Fetching categories with params:", { search, is_active, page, per_page });
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (is_active !== undefined) params.append("is_active", String(is_active));
      if (page) params.append("page", String(page));
      if (per_page) params.append("per_page", String(per_page));

      const { data } = await apiClient.get<CategoryListResponse>(
        `/categories?${params.toString()}`
      );
      return data;
    },
  });
}
