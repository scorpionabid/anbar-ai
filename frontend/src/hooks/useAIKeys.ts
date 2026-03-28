import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { AIKeyRead, AIKeyUpsert, AIProvider } from "@/types/api";

// GET /api/v1/settings/ai-keys — returns AIKeyRead[] directly (no wrapper)
export function useAIKeys() {
  return useQuery<AIKeyRead[]>({
    queryKey: ["ai-keys"],
    queryFn: async () => {
      const { data } = await apiClient.get<AIKeyRead[]>("/settings/ai-keys");
      return data;
    },
  });
}

// POST /api/v1/settings/ai-keys — upsert; returns { data: AIKeyRead, message: "ok" }
export function useAIKeyMutation() {
  const qc = useQueryClient();
  return useMutation<AIKeyRead, Error, AIKeyUpsert>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<{ data: AIKeyRead; message: string }>(
        "/settings/ai-keys",
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-keys"] }),
  });
}

// DELETE /api/v1/settings/ai-keys/{provider}
export function useAIKeyDelete() {
  const qc = useQueryClient();
  return useMutation<void, Error, AIProvider>({
    mutationFn: async (provider) => {
      await apiClient.delete(`/settings/ai-keys/${provider}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-keys"] }),
  });
}
