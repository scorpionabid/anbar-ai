import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, Customer } from "@/types/api";

export function useCustomers(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ["customers", page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Customer>>("/customers", {
        params: { page, per_page: perPage },
      });
      return data;
    },
  });
}
