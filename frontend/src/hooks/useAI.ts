import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export interface ReorderSuggestion {
  variant_id: string;
  variant_name: string;
  sku: string;
  warehouse_name: string;
  current_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  avg_daily_consumption: number;
  reason: string;
}

interface GenerateDescriptionPayload {
  product_name: string;
  category?: string;
  attributes?: Record<string, string>;
}

// POST /api/v1/ai/generate-description → { data: { description: string }, message: string }
export function useGenerateDescription() {
  return useMutation<string, Error, GenerateDescriptionPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<{ data: { description: string }; message: string }>(
        "/ai/generate-description",
        payload,
      );
      return data.data.description;
    },
  });
}

// GET /api/v1/ai/reorder-suggestions → { data: ReorderSuggestion[], message: string }
export function useReorderSuggestions() {
  return useQuery<ReorderSuggestion[]>({
    queryKey: ["reorder-suggestions"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ReorderSuggestion[]; message: string }>(
        "/ai/reorder-suggestions",
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
