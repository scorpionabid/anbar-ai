import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { ActivityItem } from "@/types/api";

// GET /api/v1/activity?limit=50 — returns { data: ActivityItem[], message: "ok" }
export function useActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ActivityItem[]; message: string }>(
        "/activity?limit=50",
      );
      return data.data;
    },
    staleTime: 30 * 1000,
  });
}
