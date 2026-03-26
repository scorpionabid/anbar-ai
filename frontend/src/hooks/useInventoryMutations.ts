import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { InventoryItem } from "@/types/api";

export interface AdjustPayload {
  warehouse_id: string;
  variant_id: string;
  quantity: number;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  note?: string;
}

export interface ReservePayload {
  warehouse_id: string;
  variant_id: string;
  quantity: number;
  reference_id: string;
  note?: string;
}

export interface ReleasePayload {
  inventory_id: string;
  quantity: number;
  reference_id: string;
  note?: string;
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, AdjustPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<InventoryItem>("/inventory/adjust", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useReserveInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, ReservePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<InventoryItem>("/inventory/reserve", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useReleaseInventory() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, ReleasePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<InventoryItem>("/inventory/release", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}
