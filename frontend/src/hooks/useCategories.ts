import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Category } from "@/types/api";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>("/categories");
      return data;
    },
  });
}
