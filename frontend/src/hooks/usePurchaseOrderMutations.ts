import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/api";

export interface POItemPayload {
  variant_id: string;
  ordered_quantity: number;
  unit_cost: number;
}

export interface PurchaseOrderCreatePayload {
  supplier_id: string;
  warehouse_id: string;
  expected_delivery_date?: string;
  notes?: string;
  items: POItemPayload[];
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation<PurchaseOrder, Error, PurchaseOrderCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<PurchaseOrder>("/purchase-orders", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation<PurchaseOrder, Error, { id: string; status: PurchaseOrderStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch<PurchaseOrder>(
        `/purchase-orders/${id}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}
