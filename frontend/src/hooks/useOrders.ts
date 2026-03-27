import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, Order, OrderStatus } from "@/types/api";

export function useOrders(page = 1, perPage = 20, status?: OrderStatus) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", page, perPage, status ?? null],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Order>>("/orders", {
        params: {
          page,
          per_page: perPage,
          ...(status ? { status } : {}),
        },
      });
      return data;
    },
  });
}
