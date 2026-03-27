import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, Payment } from "@/types/api";

export function usePayments(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<Payment>>({
    queryKey: ["payments", page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Payment>>("/payments", {
        params: { page, per_page: perPage },
      });
      return data;
    },
  });
}
