import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, getAccessibleDepartments } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

export interface UseDepartmentsOptions {
  /**
   * Jika true, admin_unit melihat semua unit kerja (untuk mutasi ke unit lain).
   * Default false: hanya unit yang dapat diakses (pembina + satpel binaan).
   */
  allUnits?: boolean;
}

/**
 * Hook to fetch departments from the database.
 * Falls back to the static DEPARTMENTS constant if the DB query fails.
 * Filters departments based on user's role and unit pembina access.
 */
export function useDepartments(options?: UseDepartmentsOptions) {
  const { profile } = useAuth();
  const allUnits = options?.allUnits ?? false;
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name');

      if (error) throw error;

      let allDepts: string[];
      if (data && data.length > 0) {
        // Get departments from DB but maintain order from DEPARTMENTS constant
        const dbDepts = new Set(data.map((d) => d.name));
        // Filter DEPARTMENTS to only include those that exist in DB, maintaining order
        allDepts = DEPARTMENTS.filter(dept => dbDepts.has(dept));
      } else {
        // Fall back to static list if DB is empty
        allDepts = [...DEPARTMENTS];
      }

      // Filter based on user's accessible departments
      // Admin pusat and admin pimpinan can see all departments (no filter)
      // allUnits: tampilkan semua unit (dropdown mutasi lintas unit)
      if (profile && profile.app_role === 'admin_unit' && !allUnits) {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        // Maintain order from DEPARTMENTS constant
        const filtered = allDepts.filter(dept => accessible.includes(dept));
        setDepartments(filtered);
      } else {
        // Admin pusat, admin pimpinan, mutasi lintas unit, or no profile: show all
        setDepartments(allDepts);
      }
    } catch (err) {
      logger.warn('Failed to fetch departments from DB, using static list:', err);
      
      // Apply filter even on fallback
      if (profile && profile.app_role === 'admin_unit' && !allUnits) {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        const filtered = [...DEPARTMENTS].filter(dept => accessible.includes(dept));
        setDepartments(filtered);
      } else {
        setDepartments([...DEPARTMENTS]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [profile, allUnits]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, isLoading, refetch: fetchDepartments };
}
