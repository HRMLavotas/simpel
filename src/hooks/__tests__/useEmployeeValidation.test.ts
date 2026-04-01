import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmployeeValidation } from '../useEmployeeValidation';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useEmployeeValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('checkDuplicateNIP', () => {
    it('should return null when NIP is empty', async () => {
      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIP('');
      expect(error).toBeNull();
    });

    it('should return null when NIP has invalid length', async () => {
      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIP('12345');
      expect(error).toBeNull();
    });

    it('should return null when NIP is unique', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIP('123456789012345678');
      
      expect(error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.select).toHaveBeenCalledWith('id, name');
      expect(mockQuery.eq).toHaveBeenCalledWith('nip', '123456789012345678');
    });

    it('should return error message with employee name when NIP is duplicate', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: '123', name: 'John Doe' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIP('123456789012345678');
      
      expect(error).toBe('NIP sudah digunakan oleh John Doe');
    });

    it('should exclude current employee when excludeId is provided', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      await result.current.checkDuplicateNIP('123456789012345678', 'employee-123');
      
      expect(mockQuery.neq).toHaveBeenCalledWith('id', 'employee-123');
    });

    it('should return error message when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIP('123456789012345678');
      
      expect(error).toBe('Gagal memvalidasi NIP. Silakan coba lagi.');
    });
  });

  describe('checkDuplicateNIK', () => {
    it('should return null when NIK is empty', async () => {
      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIK('');
      expect(error).toBeNull();
    });

    it('should return null when NIK has invalid length', async () => {
      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIK('12345');
      expect(error).toBeNull();
    });

    it('should return null when NIK is unique', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIK('1234567890123456');
      
      expect(error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.select).toHaveBeenCalledWith('id, name');
      expect(mockQuery.eq).toHaveBeenCalledWith('nip', '1234567890123456');
    });

    it('should return error message with employee name when NIK is duplicate', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: '456', name: 'Jane Smith' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      const error = await result.current.checkDuplicateNIK('1234567890123456');
      
      expect(error).toBe('NIK sudah digunakan oleh Jane Smith');
    });
  });

  describe('validateNIP with debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set loading state immediately', () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation());
      
      result.current.validateNIP('123456789012345678');
      
      expect(result.current.nipValidation.isLoading).toBe(true);
    });

    it('should debounce API calls', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation({ debounceMs: 300 }));
      
      // Call multiple times rapidly
      result.current.validateNIP('123456789012345678');
      result.current.validateNIP('123456789012345678');
      result.current.validateNIP('123456789012345678');
      
      // Should not call API yet
      expect(supabase.from).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(300);
      
      // Should call API only once
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledTimes(1);
      });
    });

    it('should update validation state after debounce', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: '123', name: 'John Doe' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation({ debounceMs: 300 }));
      
      result.current.validateNIP('123456789012345678');
      
      vi.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(result.current.nipValidation.isValid).toBe(false);
        expect(result.current.nipValidation.error).toBe('NIP sudah digunakan oleh John Doe');
        expect(result.current.nipValidation.isLoading).toBe(false);
      });
    });
  });

  describe('validateNIK with debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce API calls', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useEmployeeValidation({ debounceMs: 300 }));
      
      // Call multiple times rapidly
      result.current.validateNIK('1234567890123456');
      result.current.validateNIK('1234567890123456');
      result.current.validateNIK('1234567890123456');
      
      // Should not call API yet
      expect(supabase.from).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(300);
      
      // Should call API only once
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('reset functions', () => {
    it('should reset NIP validation state', () => {
      const { result } = renderHook(() => useEmployeeValidation());
      
      // Set some validation state
      result.current.validateNIP('123456789012345678');
      
      // Reset
      result.current.resetNIPValidation();
      
      expect(result.current.nipValidation.isValid).toBe(true);
      expect(result.current.nipValidation.error).toBeNull();
      expect(result.current.nipValidation.isLoading).toBe(false);
    });

    it('should reset NIK validation state', () => {
      const { result } = renderHook(() => useEmployeeValidation());
      
      // Set some validation state
      result.current.validateNIK('1234567890123456');
      
      // Reset
      result.current.resetNIKValidation();
      
      expect(result.current.nikValidation.isValid).toBe(true);
      expect(result.current.nikValidation.error).toBeNull();
      expect(result.current.nikValidation.isLoading).toBe(false);
    });
  });
});
