import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "../services/api";

interface UseSemanticSearchParams {
  query?: string;
  limit?: number;
  page?: number;
  city?: string;
  categories?: string[];
  startDate?: string;
  endDate?: string;
  status?: string;
  organizerName?: string;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  enabled?: boolean;
}

export const useSemanticSearch = (params: UseSemanticSearchParams) => {
  // Create a stable query key that includes all parameters
  const queryKey = [
    "semanticSearch",
    {
      query: params.query || "",
      limit: params.limit || 20,
      page: params.page || 1,
      categories: params.categories?.sort() || [],
      startDate: params.startDate || "",
      endDate: params.endDate || "",
      status: params.status || "",
      organizerName: params.organizerName || "",
      minLat: params.minLat,
      maxLat: params.maxLat,
      minLon: params.minLon,
      maxLon: params.maxLon,
    },
  ];

  return useQuery({
    queryKey,
    queryFn: () => eventsApi.searchEvents(params),
    enabled: params.enabled !== false,
    staleTime: 0, // Always refetch when parameters change
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
