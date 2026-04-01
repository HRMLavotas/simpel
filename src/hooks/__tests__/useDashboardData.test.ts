/**
 * Tests for useDashboardData hook
 * Tests dashboard data fetching, statistics calculation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '../useDashboardData';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and calculate statistics correctly', async () => {
    const mockEmployees = [
      { id: '1', asn_status: 'ASN', employment_status: 'Aktif', department: 'IT' },
      { id: '2', asn_status: 'ASN', employment_status: 'Aktif', department: 'HR' },
      { id: '3', asn_status: 'Non ASN', employment_status: 'Aktif', department: 'IT' },
      { id: '4', asn_status: 'ASN', employment_status: 'Pensiun', department: 'Finance' },
    ];

    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify statistics
    expect(result.current.stats).toEqual({
      totalEmployees: 4,
      totalASN: 3,
      totalNonASN: 1,
      totalDepartments: 3,
    });
  });

  it('should handle empty data', async () => {
    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalEmployees: 0,
      totalASN: 0,
      totalNonASN: 0,
      totalDepartments: 0,
    });
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch');
    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.stats).toBeNull();
  });

  it('should filter active employees only', async () => {
    const mockEmployees = [
      { id: '1', asn_status: 'ASN', employment_status: 'Aktif', department: 'IT' },
      { id: '2', asn_status: 'ASN', employment_status: 'Pensiun', department: 'HR' },
      { id: '3', asn_status: 'ASN', employment_status: 'Aktif', department: 'IT' },
    ];

    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only count active employees
    expect(mockFromChain.eq).toHaveBeenCalledWith('employment_status', 'Aktif');
  });

  it('should count unique departments correctly', async () => {
    const mockEmployees = [
      { id: '1', asn_status: 'ASN', employment_status: 'Aktif', department: 'IT' },
      { id: '2', asn_status: 'ASN', employment_status: 'Aktif', department: 'IT' },
      { id: '3', asn_status: 'ASN', employment_status: 'Aktif', department: 'HR' },
      { id: '4', asn_status: 'ASN', employment_status: 'Aktif', department: 'HR' },
      { id: '5', asn_status: 'ASN', employment_status: 'Aktif', department: 'Finance' },
    ];

    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should count 3 unique departments
    expect(result.current.stats?.totalDepartments).toBe(3);
  });
});
