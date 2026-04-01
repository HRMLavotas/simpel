/**
 * Tests for useAuth hook
 * Tests authentication flow, role-based access control, and session management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mockUser, mockProfile, mockSession } from '@/test/testUtils';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('should handle successful sign in', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const { error } = await result.current.signIn('test@example.com', 'password');

    expect(error).toBe(null);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('should handle sign in error', async () => {
    const mockError = new Error('Invalid credentials');
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const { error } = await result.current.signIn('test@example.com', 'wrong');

    expect(error).toBe(mockError);
  });

  it('should handle sign out', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('should correctly identify admin_pusat role', async () => {
    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    
    // Mock profile fetch
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });
    
    // Mock role fetch
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: { role: 'admin_pusat' },
      error: null,
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminPusat).toBe(true);
    expect(result.current.canViewAll).toBe(true);
    expect(result.current.canEdit).toBe(true);
  });

  it('should correctly identify admin_pimpinan role', async () => {
    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });
    
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: { role: 'admin_pimpinan' },
      error: null,
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminPimpinan).toBe(true);
    expect(result.current.canViewAll).toBe(true);
    expect(result.current.canEdit).toBe(false);
  });

  it('should correctly identify admin_unit role', async () => {
    const mockFromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });
    
    mockFromChain.maybeSingle.mockResolvedValueOnce({
      data: { role: 'admin_unit' },
      error: null,
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminPusat).toBe(false);
    expect(result.current.isAdminPimpinan).toBe(false);
    expect(result.current.canViewAll).toBe(false);
    expect(result.current.canEdit).toBe(true);
  });
});
