import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient } from '../query-client';

describe('Query Client Configuration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Cache Configuration', () => {
    it('should have staleTime set to 5 minutes', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('should have gcTime (cacheTime) set to 10 minutes', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.gcTime).toBe(10 * 60 * 1000);
    });

    it('should have refetchOnWindowFocus disabled', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('Retry Strategy', () => {
    it('should not retry on 4xx errors', () => {
      const config = queryClient.getDefaultOptions();
      const retryFn = config.queries?.retry as (failureCount: number, error: Error) => boolean;
      
      expect(typeof retryFn).toBe('function');
      
      const error4xx = new Error('Request failed with status code 404');
      expect(retryFn(0, error4xx)).toBe(false);
      expect(retryFn(1, error4xx)).toBe(false);
    });

    it('should retry up to 3 times for network errors', () => {
      const config = queryClient.getDefaultOptions();
      const retryFn = config.queries?.retry as (failureCount: number, error: Error) => boolean;
      
      const networkError = new Error('Network error');
      
      expect(retryFn(0, networkError)).toBe(true);
      expect(retryFn(1, networkError)).toBe(true);
      expect(retryFn(2, networkError)).toBe(true);
      expect(retryFn(3, networkError)).toBe(false);
    });

    it('should use exponential backoff for retry delay', () => {
      const config = queryClient.getDefaultOptions();
      const retryDelayFn = config.queries?.retryDelay as (attemptIndex: number) => number;
      
      expect(typeof retryDelayFn).toBe('function');
      
      // First retry: 1s
      expect(retryDelayFn(0)).toBe(1000);
      
      // Second retry: 2s
      expect(retryDelayFn(1)).toBe(2000);
      
      // Third retry: 4s
      expect(retryDelayFn(2)).toBe(4000);
      
      // Fourth retry: 8s
      expect(retryDelayFn(3)).toBe(8000);
      
      // Should cap at 30s
      expect(retryDelayFn(10)).toBe(30000);
    });
  });

  describe('Requirements Validation', () => {
    it('should meet Requirement 12.1 - Cache freshness of 5 minutes', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('should meet Requirement 12.2 - Cache invalidation with 10 minute retention', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.gcTime).toBe(10 * 60 * 1000);
    });

    it('should meet Task 1.3 - Retry strategy with exponential backoff', () => {
      const config = queryClient.getDefaultOptions();
      
      // Verify retry function exists
      expect(typeof config.queries?.retry).toBe('function');
      
      // Verify retryDelay function exists
      expect(typeof config.queries?.retryDelay).toBe('function');
      
      // Verify exponential backoff pattern
      const retryDelayFn = config.queries?.retryDelay as (attemptIndex: number) => number;
      expect(retryDelayFn(0)).toBe(1000);
      expect(retryDelayFn(1)).toBe(2000);
      expect(retryDelayFn(2)).toBe(4000);
    });

    it('should meet Task 1.3 - refetchOnWindowFocus disabled', () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.refetchOnWindowFocus).toBe(false);
    });
  });
});
