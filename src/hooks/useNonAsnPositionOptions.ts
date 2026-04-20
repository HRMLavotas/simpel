import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch daftar jabatan Non-ASN unik dari tabel employees
 * berdasarkan department, sebagai referensi autocomplete.
 */
export function useNonAsnPositionOptions(department?: string) {
  const [positions, setPositions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPositions([]);
    setIsLoading(true);

    const fetch = async () => {
      let query = supabase
        .from('employees')
        .select('position_name')
        .eq('asn_status', 'Non ASN')
        .not('position_name', 'is', null);

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (!error && data) {
        const seen = new Set<string>();
        const unique: string[] = [];
        data.forEach((row) => {
          const name = row.position_name?.trim();
          if (name && !seen.has(name)) {
            seen.add(name);
            unique.push(name);
          }
        });
        unique.sort((a, b) => a.localeCompare(b, 'id'));
        setPositions(unique);
      }
      setIsLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [department]);

  return { positions, isLoading };
}
