import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { WebhookRead, WebhookCreate, WebhookUpdate } from "@/types/api";

// GET /api/v1/webhooks — returns WebhookRead[]
export function useWebhooks() {
  return useQuery<WebhookRead[]>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await apiClient.get<WebhookRead[]>("/webhooks");
      return data;
    },
  });
}

// POST /api/v1/webhooks — returns { data: WebhookRead, message: "ok" }
export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation<WebhookRead, Error, WebhookCreate>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<{ data: WebhookRead; message: string }>(
        "/webhooks",
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

// PATCH /api/v1/webhooks/{id} — returns { data: WebhookRead, message: "ok" }
export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation<WebhookRead, Error, { id: string; payload: WebhookUpdate }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.patch<{ data: WebhookRead; message: string }>(
        `/webhooks/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

// DELETE /api/v1/webhooks/{id}
export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/webhooks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}
