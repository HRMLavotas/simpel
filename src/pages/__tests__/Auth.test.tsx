/**
 * Tests for Auth page
 * Tests login form, validation, and authentication flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/testUtils';
import Auth from '../Auth';

// Mock useAuth hook
const mockSignIn = vi.fn();
const mockUseAuth = {
  user: null,
  isLoading: false,
  signIn: mockSignIn,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.user = null;
  });

  it('should render login form', () => {
    renderWithProviders(<Auth />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk|login/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Auth />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /masuk|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email.*valid/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Auth />);

    const submitButton = screen.getByRole('button', { name: /masuk|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|wajib/i)).toBeInTheDocument();
    });
  });

  it('should call signIn with correct credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });

    renderWithProviders(<Auth />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password|kata sandi/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /masuk|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ 
      error: new Error('Invalid credentials') 
    });

    renderWithProviders(<Auth />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password|kata sandi/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /masuk|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid|gagal|salah/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<Auth />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password|kata sandi/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /masuk|login/i });
    await user.click(submitButton);

    expect(screen.getByText(/loading|memuat/i)).toBeInTheDocument();
  });
});
