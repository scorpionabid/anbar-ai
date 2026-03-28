import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { TenantSettings, TenantSettingsUpdate } from "@/types/api";

// GET /api/v1/settings — returns TenantSettings directly (no wrapper)
export function useSettings() {
  return useQuery<TenantSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await apiClient.get<TenantSettings>("/settings");
      return data;
    },
  });
}

// PUT /api/v1/settings — returns { data: TenantSettings, message: "ok" }
export function useSettingsMutation() {
  const qc = useQueryClient();
  return useMutation<TenantSettings, Error, TenantSettingsUpdate>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put<{ data: TenantSettings; message: string }>(
        "/settings",
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
