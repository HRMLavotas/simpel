/**
 * Integration tests for employee management workflow
 * Tests complete user flows: add, edit, delete employee
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Employees from '@/pages/Employees';

// Mock Supabase with realistic responses
const mockEmployees = [
  {
    id: 'emp-1',
    nip: '199001012020121001',
    name: 'John Doe',
    department: 'IT',
    position: 'Developer',
    asn_status: 'ASN',
    employment_status: 'Aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    nip: '199002022020122002',
    name: 'Jane Smith',
    department: 'HR',
    position: 'Manager',
    asn_status: 'ASN',
    employment_status: 'Aktif',
    created_at: new Date().toISOString(),
  },
];

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: mockEmployees[0], error: null }),
    then: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
          access_token: 'test-token',
        },
      },
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { full_name: 'Test User', department: 'IT' },
    role: 'admin_pusat',
    isAdminPusat: true,
    canEdit: true,
    canViewAll: true,
    isLoading: false,
  }),
}));

describe('Employee Management Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display list of employees', async () => {
    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should open add employee modal when add button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Employees />);

    const addButton = screen.getByRole('button', { name: /tambah pegawai/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Tambah Pegawai/i)).toBeInTheDocument();
    });
  });

  it('should filter employees by search term', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/cari/i);
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Jane Smith should be filtered out
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should open edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Pegawai/i)).toBeInTheDocument();
    });
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /hapus|delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/yakin|konfirmasi/i)).toBeInTheDocument();
    });
  });

  it('should handle empty state when no employees', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText(/tidak ada|kosong/i)).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Failed to fetch') 
      }),
    });

    renderWithProviders(<Employees />);

    await waitFor(() => {
      expect(screen.getByText(/error|gagal/i)).toBeInTheDocument();
    });
  });
});
