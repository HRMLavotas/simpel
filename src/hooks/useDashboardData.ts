import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  total: number;
  pns: number;
  pppk: number;
  nonAsn: number;
}

interface PositionTypeData {
  type: string;
  count: number;
}

interface JoinYearData {
  year: string;
  count: number;
}

interface RankData {
  rank: string;
  count: number;
}

interface DepartmentData {
  department: string;
  count: number;
}

interface UseDashboardDataProps {
  department: string | null;
  isAdminPusat: boolean;
  selectedDepartment: string;
}

export function useDashboardData({ department, isAdminPusat, selectedDepartment }: UseDashboardDataProps) {
  const [stats, setStats] = useState<Stats>({ total: 0, pns: 0, pppk: 0, nonAsn: 0 });
  const [rankData, setRankData] = useState<RankData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [positionTypeData, setPositionTypeData] = useState<PositionTypeData[]>([]);
  const [joinYearData, setJoinYearData] = useState<JoinYearData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDepartmentFilter = useCallback(() => {
    if (!isAdminPusat) {
      return department;
    }
    return selectedDepartment !== 'all' ? selectedDepartment : null;
  }, [isAdminPusat, department, selectedDepartment]);

  const fetchStats = useCallback(async () => {
    const deptFilter = getDepartmentFilter();

    // Fetch total count
    let totalQuery = supabase.from('employees').select('*', { count: 'exact', head: true });
    if (deptFilter) totalQuery = totalQuery.eq('department', deptFilter);
    const { count: total } = await totalQuery;

    // Fetch PNS count
    let pnsQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('asn_status', 'PNS');
    if (deptFilter) pnsQuery = pnsQuery.eq('department', deptFilter);
    const { count: pns } = await pnsQuery;

    // Fetch PPPK count
    let pppkQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('asn_status', 'PPPK');
    if (deptFilter) pppkQuery = pppkQuery.eq('department', deptFilter);
    const { count: pppk } = await pppkQuery;

    // Fetch Non ASN count
    let nonAsnQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('asn_status', 'Non ASN');
    if (deptFilter) nonAsnQuery = nonAsnQuery.eq('department', deptFilter);
    const { count: nonAsn } = await nonAsnQuery;

    return {
      total: total || 0,
      pns: pns || 0,
      pppk: pppk || 0,
      nonAsn: nonAsn || 0,
    };
  }, [getDepartmentFilter]);

  const fetchRankData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const rankCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('rank_group')
        .not('rank_group', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching rank data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.rank_group) {
            rankCounts[e.rank_group] = (rankCounts[e.rank_group] || 0) + 1;
          }
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(rankCounts)
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [getDepartmentFilter]);

  const fetchDepartmentData = useCallback(async () => {
    if (!isAdminPusat || selectedDepartment !== 'all') {
      return [];
    }

    const PAGE_SIZE = 1000;
    const deptCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching department data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(deptCounts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }, [isAdminPusat, selectedDepartment]);

  const fetchPositionTypeData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const positionCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('position_type')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching position type data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          const type = e.position_type || 'Tidak Diketahui';
          positionCounts[type] = (positionCounts[type] || 0) + 1;
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(positionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [getDepartmentFilter]);

  const fetchJoinYearData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const yearCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('join_date')
        .not('join_date', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching join year data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.join_date) {
            const year = new Date(e.join_date).getFullYear().toString();
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year))
      .slice(-10); // Last 10 years
  }, [getDepartmentFilter]);

  const fetchDashboardData = useCallback(async () => {
    if (!department && !isAdminPusat) return;
    
    setIsLoading(true);

    try {
      const [statsResult, rankResult, deptResult, positionResult, joinYearResult] = await Promise.all([
        fetchStats(),
        fetchRankData(),
        fetchDepartmentData(),
        fetchPositionTypeData(),
        fetchJoinYearData(),
      ]);

      setStats(statsResult);
      setRankData(rankResult);
      setDepartmentData(deptResult);
      setPositionTypeData(positionResult);
      setJoinYearData(joinYearResult);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [department, isAdminPusat, fetchStats, fetchRankData, fetchDepartmentData, fetchPositionTypeData, fetchJoinYearData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    rankData,
    departmentData,
    positionTypeData,
    joinYearData,
    isLoading,
    refetch: fetchDashboardData,
  };
}
