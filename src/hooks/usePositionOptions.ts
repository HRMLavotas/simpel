import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface PositionOption {
  position_name: string;
  position_category: string;
  department: string;
}

/**
 * Fetch daftar jabatan dari tabel position_references (Peta Jabatan / ABK).
 * Bisa difilter berdasarkan department.
 * 
 * OPTIMIZATIONS:
 * - Uses cancellation token to prevent race conditions
 * - Deduplicates results by position_name
 * - Memoizes results for better performance
 */
export function usePositionOptions(department?: string) {
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetch = async () => {
      try {
        let query = supabase
          .from('position_references')
          .select('position_name, position_category, department')
          .order('position_name', { ascending: true });

        if (department) {
          query = query.eq('department', department);
        }

        const { data, error: fetchError } = await query;
        
        if (cancelled) return;

        if (fetchError) {
          logger.error('Error fetching position options:', fetchError);
          setError(fetchError.message);
          setPositions([]);
          setIsLoading(false);
          return;
        }

        if (data) {
          // Deduplicate by position_name
          const seen = new Set<string>();
          const unique = data.filter((p) => {
            if (seen.has(p.position_name)) return false;
            seen.add(p.position_name);
            return true;
          });
          setPositions(unique);
        } else {
          setPositions([]);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          logger.error('Unexpected error fetching positions:', err);
          setError(errorMessage);
          setPositions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetch();
    return () => { 
      cancelled = true; 
    };
  }, [department]);

  // Memoize position names for autocomplete
  const positionNames = useMemo(() => 
    positions.map(p => p.position_name),
    [positions]
  );

  return { 
    positions, 
    positionNames,
    isLoading, 
    error 
  };
}
