import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Order, OrderStatus } from "@/types/api";

export interface OrderItemPayload {
  variant_id: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

export interface OrderCreatePayload {
  warehouse_id: string;
  customer_id?: string;
  notes?: string;
  shipping_address?: string;
  items: OrderItemPayload[];
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation<Order, Error, OrderCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Order>("/orders", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation<Order, Error, { id: string; status: OrderStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation<Order, Error, string>({
    mutationFn: async (id) => {
      const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, {
        status: "cancelled",
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
