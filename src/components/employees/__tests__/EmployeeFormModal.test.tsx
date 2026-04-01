/**
 * Tests for EmployeeFormModal component
 * Tests form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/testUtils';
import { EmployeeFormModal } from '../EmployeeFormModal';

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
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Tambah Pegawai/i)).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    renderWithProviders(
      <EmployeeFormModal
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText(/Tambah Pegawai/i)).not.toBeInTheDocument();
  });

  it('should display edit mode title when employee is provided', () => {
    const mockEmployee = {
      id: 'emp-1',
      nip: '199001012020121001',
      name: 'John Doe',
      department: 'IT',
      position: 'Developer',
      asn_status: 'ASN',
      employment_status: 'Aktif',
    };

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        employee={mockEmployee}
      />
    );

    expect(screen.getByText(/Edit Pegawai/i)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /batal/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /simpan/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Form should show validation errors
      expect(screen.getByText(/required|wajib/i)).toBeInTheDocument();
    });
  });

  it('should validate NIP format (18 digits)', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeFormModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nipInput = screen.getByLabelText(/NIP/i);
    await user.type(nipInput, '123'); // Invalid NIP (too short)

    const submitButton = screen.getByRole('button', { name: /simpan/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/18 digit/i)).toBeInTheDocument();
    });
  });
});
