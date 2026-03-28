import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { NotificationSettings } from "@/types/api";

// GET /api/v1/settings/notifications — returns NotificationSettings directly
export function useNotifications() {
  return useQuery<NotificationSettings>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationSettings>(
        "/settings/notifications",
      );
      return data;
    },
  });
}

// PUT /api/v1/settings/notifications — returns { data: NotificationSettings, message: "ok" }
export function useNotificationsMutation() {
  const qc = useQueryClient();
  return useMutation<NotificationSettings, Error, Partial<NotificationSettings>>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put<{
        data: NotificationSettings;
        message: string;
      }>("/settings/notifications", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
