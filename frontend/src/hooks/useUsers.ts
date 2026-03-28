import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { UserRead } from "@/types/api";

// GET /api/v1/users — returns UserRead[] directly (no wrapper)
export function useUsers() {
  return useQuery<UserRead[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await apiClient.get<UserRead[]>("/users");
      return data;
    },
  });
}
