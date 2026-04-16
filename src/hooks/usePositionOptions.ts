import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PositionOption {
  position_name: string;
  position_category: string;
  department: string;
}

/**
 * Fetch daftar jabatan dari tabel position_references (Peta Jabatan / ABK).
 * Bisa difilter berdasarkan department.
 */
export function usePositionOptions(department?: string) {
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPositions([]); // reset dulu saat department berubah
    setIsLoading(true);

    const fetch = async () => {
      let query = supabase
        .from('position_references')
        .select('position_name, position_category, department')
        .order('position_name', { ascending: true });

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (!error && data) {
        // Deduplicate by position_name
        const seen = new Set<string>();
        const unique = data.filter((p) => {
          if (seen.has(p.position_name)) return false;
          seen.add(p.position_name);
          return true;
        });
        setPositions(unique);
      }
      setIsLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [department]);

  return { positions, isLoading };
}
