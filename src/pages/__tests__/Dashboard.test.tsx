/**
 * Tests for Dashboard page
 * Tests dashboard rendering, data loading, and chart display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import Dashboard from '../Dashboard';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { full_name: 'Test User', department: 'IT' },
    role: 'admin_pusat',
    isAdminPusat: true,
    canViewAll: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    stats: {
      totalEmployees: 100,
      totalASN: 80,
      totalNonASN: 20,
      totalDepartments: 10,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should display statistics cards', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Total Pegawai/i)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mock('@/hooks/useDashboardData', () => ({
      useDashboardData: () => ({
        stats: null,
        isLoading: true,
        error: null,
      }),
    }));

    renderWithProviders(<Dashboard />);

    expect(screen.getByText(/loading|memuat/i)).toBeInTheDocument();
  });

  it('should display error message when data fetch fails', async () => {
    vi.mock('@/hooks/useDashboardData', () => ({
      useDashboardData: () => ({
        stats: null,
        isLoading: false,
        error: new Error('Failed to fetch data'),
      }),
    }));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error|gagal/i)).toBeInTheDocument();
    });
  });
});
