import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, getAccessibleDepartments } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

/**
 * Hook to fetch departments from the database.
 * Falls back to the static DEPARTMENTS constant if the DB query fails.
 * Filters departments based on user's role and unit pembina access.
 */
export function useDepartments() {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;

      let allDepts: string[];
      if (data && data.length > 0) {
        allDepts = data.map((d) => d.name);
      } else {
        // Fall back to static list if DB is empty
        allDepts = [...DEPARTMENTS];
      }

      // Filter based on user's accessible departments
      // Admin pusat and admin pimpinan can see all departments (no filter)
      if (profile && profile.app_role === 'admin_unit') {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        const filtered = allDepts.filter(dept => accessible.includes(dept));
        setDepartments(filtered);
      } else {
        // Admin pusat, admin pimpinan, or no profile: show all
        setDepartments(allDepts);
      }
    } catch (err) {
      logger.warn('Failed to fetch departments from DB, using static list:', err);
      
      // Apply filter even on fallback
      if (profile && profile.app_role === 'admin_unit') {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        const filtered = [...DEPARTMENTS].filter(dept => accessible.includes(dept));
        setDepartments(filtered);
      } else {
        // Admin pusat, admin pimpinan, or no profile: show all
        setDepartments([...DEPARTMENTS]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, isLoading, refetch: fetchDepartments };
}
