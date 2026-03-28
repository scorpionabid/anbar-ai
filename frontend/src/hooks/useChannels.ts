import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { Channel, ChannelType, PaginatedResponse } from "@/types/api";

export function useChannels(params?: { search?: string; is_active?: boolean }) {
  return useQuery<Channel[]>({
    queryKey: ["channels", params],
    queryFn: async () => {
      console.log("[useChannels] Fetching with params:", params);
      const { data } = await apiClient.get<PaginatedResponse<Channel>>("/channels", { params });
      return data.data;
    },
  });
}

export interface ChannelCreatePayload {
  name: string;
  channel_type: ChannelType;
  is_active?: boolean;
}

export interface ChannelUpdatePayload {
  name?: string;
  channel_type?: ChannelType;
  is_active?: boolean;
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation<Channel, Error, ChannelCreatePayload>({
    mutationFn: async (payload) => {
      console.log("[useCreateChannel] Creating channel:", payload);
      const { data } = await apiClient.post<Channel>("/channels", payload);
      return data;
    },
    onSuccess: () => {
      console.log("[useCreateChannel] Success");
      qc.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation<Channel, Error, { id: string; payload: ChannelUpdatePayload }>({
    mutationFn: async ({ id, payload }) => {
      console.log(`[useUpdateChannel] Updating channel ${id}:`, payload);
      const { data } = await apiClient.put<Channel>(`/channels/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useUpdateChannel] Success:", data);
      qc.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      console.log(`[useDeleteChannel] Deleting channel ${id}`);
      await apiClient.delete(`/channels/${id}`);
    },
    onSuccess: () => {
      console.log("[useDeleteChannel] Success");
      qc.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
