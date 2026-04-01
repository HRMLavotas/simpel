import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized React Query client configuration for SIMPEL application
 * 
 * Configuration based on Phase 1 Performance Optimization requirements:
 * - 5 minute stale time for better perceived performance
 * - 10 minute cache time to reduce unnecessary refetches
 * - Disabled refetch on window focus to prevent excessive API calls
 * - Retry strategy with exponential backoff for network errors
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent refetch when user returns to tab
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Retry up to 3 times for network errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, capped at 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
  },
});
