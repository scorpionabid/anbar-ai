import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { InventoryItem } from "@/types/api";

export function useInventory(warehouseId?: string) {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory", warehouseId ?? null],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (warehouseId) params.warehouse_id = warehouseId;
      const { data } = await apiClient.get<InventoryItem[]>("/inventory", { params });
      return data;
    },
  });
}
