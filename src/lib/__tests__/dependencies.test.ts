/**
 * Dependency verification tests for Phase 1 requirements
 * 
 * This test file verifies that all required dependencies for Phase 1
 * are properly installed and can be imported without errors.
 */

import { describe, it, expect } from 'vitest';

describe('Phase 1 Dependencies', () => {
  it('should import Zod 3.25 for validation schemas', async () => {
    const zod = await import('zod');
    expect(zod.z).toBeDefined();
    expect(typeof zod.z.string).toBe('function');
    expect(typeof zod.z.object).toBe('function');
  });

  it('should import fast-check for property-based testing', async () => {
    const fc = await import('fast-check');
    expect(fc.default).toBeDefined();
    expect(typeof fc.default.string).toBe('function');
    expect(typeof fc.default.integer).toBe('function');
  });

  it('should import @tanstack/react-virtual for virtual scrolling', async () => {
    const reactVirtual = await import('@tanstack/react-virtual');
    expect(reactVirtual.useVirtualizer).toBeDefined();
    expect(typeof reactVirtual.useVirtualizer).toBe('function');
  });

  it('should import React Query 5.83 with proper configuration', async () => {
    const { queryClient } = await import('../query-client');
    expect(queryClient).toBeDefined();
    
    // Verify default options are configured
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries?.retry).toBe(1);
  });
});
