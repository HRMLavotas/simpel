/**
 * Tests for EmployeeFormModal component
 * Tests form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/testUtils';
import { EmployeeFormModal } from '../EmployeeFormModal';

// Mock hook dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { id: 'test-user-id', email: 'test@example.com', full_name: 'Test User', department: 'Test Department' },
    role: 'admin_pusat',
    isAdminPusat: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useDepartments', () => ({
  useDepartments: () => ({
    departments: ['IT', 'HR', 'Finance', 'Test Department'],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePositionOptions', () => ({
  usePositionOptions: () => ({
    positionNames: ['Developer', 'Manager', 'Analyst'],
    isLoading: false,
    error: null,
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('EmployeeFormModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/Tambah Pegawai Baru/i)).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    renderWithProviders(
      <EmployeeFormModal
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText(/Tambah Pegawai Baru/i)).not.toBeInTheDocument();
  });

  it('should display edit mode title when employee is provided', () => {
    const mockEmployee = {
      id: 'emp-1',
      nip: '199001012020121001',
      name: 'John Doe',
      front_title: null,
      back_title: null,
      birth_place: null,
      birth_date: null,
      gender: null,
      religion: null,
      position_type: null,
      position_name: 'Developer',
      additional_position: null,
      kejuruan: null,
      asn_status: 'PNS',
      rank_group: null,
      department: 'IT',
      join_date: null,
      tmt_cpns: null,
      tmt_pns: null,
      tmt_pensiun: null,
      phone: null,
      mobile_phone: null,
      address: null,
      satuan_kerja_penugasan: null,
    };

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        employee={mockEmployee}
      />
    );

    expect(screen.getByText(/Edit Data Pegawai/i)).toBeInTheDocument();
  });

  it('should call onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /batal/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // Make sure we are on Data Utama tab
    const mainTabTrigger = screen.getByRole('tab', { name: /Data Utama/i });
    await user.click(mainTabTrigger);

    const submitButton = screen.getByRole('button', { name: /tambah pegawai/i });
    await user.click(submitButton);

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/wajib/i)).toBeInTheDocument();
    });
  });

  it('should validate NIP format (18 digits)', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // Click Data Utama tab
    const mainTabTrigger = screen.getByRole('tab', { name: /Data Utama/i });
    await user.click(mainTabTrigger);

    const nipInput = screen.getByLabelText(/NIP/i);
    // Type 19 digits to trigger max(18) length check
    await user.type(nipInput, '12345678901234567890');

    const submitButton = screen.getByRole('button', { name: /tambah pegawai/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/maksimal 18 digit/i)).toBeInTheDocument();
    });
  });
});
