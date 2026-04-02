import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * Hook to fetch departments from the database.
 * Falls back to the static DEPARTMENTS constant if the DB query fails.
 */
export function useDepartments() {
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

      if (data && data.length > 0) {
        setDepartments(data.map((d) => d.name));
      } else {
        // Fall back to static list if DB is empty
        setDepartments([...DEPARTMENTS]);
      }
    } catch (err) {
      logger.warn('Failed to fetch departments from DB, using static list:', err);
      setDepartments([...DEPARTMENTS]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, isLoading, refetch: fetchDepartments };
}
