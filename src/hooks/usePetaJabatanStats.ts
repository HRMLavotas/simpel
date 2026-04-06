import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface PetaJabatanStat {
  position_name: string;
  position_category?: string;
  department?: string;
  abk: number;
  existing_pns: number;
  existing_pppk: number;
  total_existing: number;
  gap: number;
}

export interface NonAsnStat {
  position_name: string;
  count: number;
}

interface UsePetaJabatanStatsProps {
  isAdminPusat: boolean;
  userDepartment: string | null;
  selectedDepartment: string;
}

export function usePetaJabatanStats({ isAdminPusat, userDepartment, selectedDepartment }: UsePetaJabatanStatsProps) {
  const [asnStats, setAsnStats] = useState<PetaJabatanStat[]>([]);
  const [nonAsnStats, setNonAsnStats] = useState<NonAsnStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDepartmentFilter = useCallback((): string | null => {
    if (!isAdminPusat) {
      return userDepartment;
    }
    return selectedDepartment !== 'all' ? selectedDepartment : null;
  }, [isAdminPusat, userDepartment, selectedDepartment]);

  const fetchData = useCallback(async () => {
    if (!userDepartment && !isAdminPusat) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    logger.debug('[PetaJabatanStats] Starting fetch...', { userDepartment, isAdminPusat, selectedDepartment });

    try {
      const deptFilter = getDepartmentFilter();
      logger.debug('[PetaJabatanStats] Filter used:', { deptFilter });
      
      // Helper for all unlimited queries
      const fetchAllUnlimited = async (buildQuery: () => any) => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData.push(...data);
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return { data: allData, error: null };
      };

      // Query 1: Fetch position references for ABK (Analisis Beban Kerja)
      const { data: positions } = await fetchAllUnlimited(() => {
        let q = supabase.from('position_references').select('position_name, abk_count, position_category, department');
        if (deptFilter) {
          q = q.eq('department', deptFilter);
        }
        return q;
      });

      // Query 2: Fetch ASN employees to count actual existing per position
      const { data: asnEmployees } = await fetchAllUnlimited(() => {
        let q = supabase
          .from('employees')
          .select('position_name, asn_status, department')
          .neq('asn_status', 'Non ASN')
          .not('asn_status', 'is', null);
        if (deptFilter) {
          q = q.eq('department', deptFilter);
        }
        return q;
      });

      // Query 3: Fetch Non-ASN employees
      const { data: nonAsnEmployees } = await fetchAllUnlimited(() => {
        let q = supabase
          .from('employees')
          .select('keterangan_penugasan, position_name')
          .eq('asn_status', 'Non ASN');
        if (deptFilter) {
          q = q.eq('department', deptFilter);
        }
        return q;
      });

// Process ASN Stats
      const positionMap = new Map<string, PetaJabatanStat>();

      // Initialize with ABK
      (positions || []).forEach(pos => {
        const name = pos.position_name || 'Tidak Diketahui';
        if (!positionMap.has(name)) {
          positionMap.set(name, {
            position_name: name,
            position_category: pos.position_category,
            department: pos.department,
            abk: 0,
            existing_pns: 0,
            existing_pppk: 0,
            total_existing: 0,
            gap: 0
          });
        }
        positionMap.get(name)!.abk += (pos.abk_count || 0);
      });

      // Map actual existing employees
      (asnEmployees || []).forEach(emp => {
        const name = emp.position_name || 'Tidak Diketahui';
        
        if (!positionMap.has(name)) {
          positionMap.set(name, {
            position_name: name,
            department: emp.department,
            abk: 0, // No ABK defined
            existing_pns: 0,
            existing_pppk: 0,
            total_existing: 0,
            gap: 0
          });
        }
        
        const stat = positionMap.get(name)!;
        if (emp.asn_status === 'PNS') stat.existing_pns += 1;
        else if (emp.asn_status === 'PPPK') stat.existing_pppk += 1;
        
        stat.total_existing = stat.existing_pns + stat.existing_pppk;
      });

      // Calculate gaps and sort
      const finalAsnStats = Array.from(positionMap.values()).map(stat => ({
        ...stat,
        gap: stat.abk - stat.total_existing
      })).sort((a, b) => b.total_existing - a.total_existing); // Sort by highest existing

      // Process Non-ASN Stats
      // Uses keterangan_penugasan if available, fallback to position_name
      const nonAsnMap = new Map<string, NonAsnStat>();

      (nonAsnEmployees || []).forEach(emp => {
        const name = emp.keterangan_penugasan || emp.position_name || 'Tidak Diketahui';
        if (!nonAsnMap.has(name)) {
          nonAsnMap.set(name, { position_name: name, count: 0 });
        }
        nonAsnMap.get(name)!.count += 1;
      });

      const finalNonAsnStats = Array.from(nonAsnMap.values())
        .sort((a, b) => b.count - a.count);

      setAsnStats(finalAsnStats);
      setNonAsnStats(finalNonAsnStats);
      logger.debug('[PetaJabatanStats] Fetched OK', { asn: finalAsnStats.length, nonAsn: finalNonAsnStats.length });
    } catch (err: any) {
      logger.error('Error fetching PetaJabatanStats:', err);
      setError(err.message || 'Gagal memuat data peta jabatan');
    } finally {
      setIsLoading(false);
    }
  }, [isAdminPusat, userDepartment, getDepartmentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    asnStats,
    nonAsnStats,
    isLoading,
    error,
    refetch: fetchData
  };
}
