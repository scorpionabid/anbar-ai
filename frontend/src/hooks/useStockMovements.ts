import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { StockMovementListResponse, StockMovement } from "@/types/api";

export interface StockMovementFilters {
  warehouse_id?: string;
  movement_type?: StockMovement["movement_type"];
}

export function useStockMovements(
  page = 1,
  perPage = 20,
  filters: StockMovementFilters = {}
) {
  return useQuery<StockMovementListResponse>({
    queryKey: ["stock-movements", page, perPage, filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        per_page: perPage,
      };
      if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
      if (filters.movement_type) params.movement_type = filters.movement_type;
      const { data } = await apiClient.get<StockMovementListResponse>(
        "/inventory/movements",
        { params }
      );
      return data;
    },
  });
}
