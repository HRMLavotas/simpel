import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Async validation hooks for employee data
 * Implements duplicate checking with debouncing to reduce API calls
 * 
 * Requirements: 1.3, 1.4
 */

interface ValidationResult {
  isValid: boolean;
  error: string | null;
  isLoading: boolean;
}

interface UseEmployeeValidationOptions {
  debounceMs?: number;
}

export function useEmployeeValidation(options: UseEmployeeValidationOptions = {}) {
  const { debounceMs = 300 } = options;
  
  const [nipValidation, setNipValidation] = useState<ValidationResult>({
    isValid: true,
    error: null,
    isLoading: false,
  });
  
  const [nikValidation, setNikValidation] = useState<ValidationResult>({
    isValid: true,
    error: null,
    isLoading: false,
  });

  // Refs for debouncing
  const nipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nikTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (nipTimeoutRef.current) clearTimeout(nipTimeoutRef.current);
      if (nikTimeoutRef.current) clearTimeout(nikTimeoutRef.current);
    };
  }, []);

  /**
   * Check if NIP already exists in database
   * Requirements: 1.3 - Prevent duplicate NIP with employee name in error message
   * 
   * @param nip - NIP to check (18 digits)
   * @param excludeId - Employee ID to exclude from check (for edit mode)
   * @returns Error message with employee name if duplicate found, null otherwise
   */
  const checkDuplicateNIP = useCallback(async (
    nip: string,
    excludeId?: string
  ): Promise<string | null> => {
    // Skip validation if NIP is empty or invalid format
    if (!nip || nip.length !== 18) {
      return null;
    }

    try {
      let query = supabase
        .from('employees')
        .select('id, name')
        .eq('nip', nip)
        .limit(1);

      // Exclude current employee when editing
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking duplicate NIP:', error);
        return 'Gagal memvalidasi NIP. Silakan coba lagi.';
      }

      if (data) {
        return `NIP sudah digunakan oleh ${data.name}`;
      }

      return null;
    } catch (error) {
      console.error('Error checking duplicate NIP:', error);
      return 'Gagal memvalidasi NIP. Silakan coba lagi.';
    }
  }, []);

  /**
   * Check if NIK already exists in database
   * Requirements: 1.4 - Prevent duplicate NIK with employee name in error message
   * 
   * @param nik - NIK to check (16 digits)
   * @param excludeId - Employee ID to exclude from check (for edit mode)
   * @returns Error message with employee name if duplicate found, null otherwise
   */
  const checkDuplicateNIK = useCallback(async (
    nik: string,
    excludeId?: string
  ): Promise<string | null> => {
    // Skip validation if NIK is empty or invalid format
    if (!nik || nik.length !== 16) {
      return null;
    }

    try {
      // For Non-ASN, NIK is stored in the 'nip' field
      // Check for Non-ASN employees only (asn_status = 'Non ASN')
      let query = supabase
        .from('employees')
        .select('id, name')
        .eq('nip', nik)
        .eq('asn_status', 'Non ASN')
        .limit(1);

      // Exclude current employee when editing
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking duplicate NIK:', error);
        return 'Gagal memvalidasi NIK. Silakan coba lagi.';
      }

      if (data) {
        return `NIK sudah digunakan oleh ${data.name}`;
      }

      return null;
    } catch (error) {
      console.error('Error checking duplicate NIK:', error);
      return 'Gagal memvalidasi NIK. Silakan coba lagi.';
    }
  }, []);

  /**
   * Validate NIP with debouncing
   * Debounces API calls to reduce load during typing
   * 
   * @param nip - NIP to validate
   * @param excludeId - Employee ID to exclude from check
   */
  const validateNIP = useCallback((nip: string, excludeId?: string) => {
    // Clear existing timeout
    if (nipTimeoutRef.current) {
      clearTimeout(nipTimeoutRef.current);
    }

    // Skip validation if empty or invalid format
    if (!nip || nip.length !== 18) {
      setNipValidation({ isValid: true, error: null, isLoading: false });
      return;
    }

    // Set loading state
    setNipValidation({ isValid: true, error: null, isLoading: true });

    // Debounce the API call
    nipTimeoutRef.current = setTimeout(async () => {
      const error = await checkDuplicateNIP(nip, excludeId);
      setNipValidation({
        isValid: !error,
        error,
        isLoading: false,
      });
    }, debounceMs);
  }, [checkDuplicateNIP, debounceMs]);

  /**
   * Validate NIK with debouncing
   * Debounces API calls to reduce load during typing
   * 
   * @param nik - NIK to validate
   * @param excludeId - Employee ID to exclude from check
   */
  const validateNIK = useCallback((nik: string, excludeId?: string) => {
    // Clear existing timeout
    if (nikTimeoutRef.current) {
      clearTimeout(nikTimeoutRef.current);
    }

    // Skip validation if empty or invalid format
    if (!nik || nik.length !== 16) {
      setNikValidation({ isValid: true, error: null, isLoading: false });
      return;
    }

    // Set loading state
    setNikValidation({ isValid: true, error: null, isLoading: true });

    // Debounce the API call
    nikTimeoutRef.current = setTimeout(async () => {
      const error = await checkDuplicateNIK(nik, excludeId);
      setNikValidation({
        isValid: !error,
        error,
        isLoading: false,
      });
    }, debounceMs);
  }, [checkDuplicateNIK, debounceMs]);

  /**
   * Reset NIP validation state
   */
  const resetNIPValidation = useCallback(() => {
    if (nipTimeoutRef.current) {
      clearTimeout(nipTimeoutRef.current);
    }
    setNipValidation({ isValid: true, error: null, isLoading: false });
  }, []);

  /**
   * Reset NIK validation state
   */
  const resetNIKValidation = useCallback(() => {
    if (nikTimeoutRef.current) {
      clearTimeout(nikTimeoutRef.current);
    }
    setNikValidation({ isValid: true, error: null, isLoading: false });
  }, []);

  return {
    // Direct check functions (for programmatic use)
    checkDuplicateNIP,
    checkDuplicateNIK,
    
    // Debounced validation functions (for form inputs)
    validateNIP,
    validateNIK,
    
    // Validation states
    nipValidation,
    nikValidation,
    
    // Reset functions
    resetNIPValidation,
    resetNIKValidation,
  };
}
