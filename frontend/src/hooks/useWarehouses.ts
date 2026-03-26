import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Warehouse } from "@/types/api";

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await apiClient.get<Warehouse[]>("/warehouses");
      return data;
    },
  });
}
