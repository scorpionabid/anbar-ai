import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { UserRead, UserCreate, UserUpdate, UserProfileUpdate } from "@/types/api";

// POST /api/v1/users
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<UserRead, Error, UserCreate>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<UserRead>("/users", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// PATCH /api/v1/users/{id}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation<UserRead, Error, { id: string; payload: UserUpdate }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.patch<UserRead>(`/users/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// DELETE /api/v1/users/{id} — deactivates the user
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// PATCH /api/v1/auth/me — update the currently authenticated user's own profile
export function useUpdateProfile() {
  const qc = useQueryClient();
  const fetchUser = useAuthStore((s) => s.fetchUser);
  return useMutation<UserRead, Error, UserProfileUpdate>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<UserRead>("/auth/me", payload);
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
      await fetchUser();
    },
  });
}
