import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PaginatedResponse, PurchaseOrder } from "@/types/api";

export function usePurchaseOrders(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<PurchaseOrder>>({
    queryKey: ["purchase-orders", page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<PurchaseOrder>>(
        "/purchase-orders",
        { params: { page, per_page: perPage } }
      );
      return data;
    },
  });
}
