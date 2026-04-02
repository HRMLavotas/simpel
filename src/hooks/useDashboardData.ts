import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

interface GenderData {
  gender: string;
  count: number;
}

interface ReligionData {
  religion: string;
  count: number;
}

interface PositionKepmenData {
  position: string;
  count: number;
}

interface RetirementYearData {
  year: string;
  count: number;
}

interface GradeData {
  grade: string;
  count: number;
}

interface AgeData {
  category: string;
  count: number;
  order: number;
}

interface EducationData {
  level: string;
  count: number;
  details?: { major: string; count: number }[];
}

interface TmtYearData {
  year: string;
  count: number;
}

interface WorkDurationData {
  category: string;
  count: number;
  order: number;
}

interface UseDashboardDataProps {
  department: string | null;
  isAdminPusat: boolean;
  selectedDepartment: string;
  selectedAsnStatus: string;
}

export function useDashboardData({ department, isAdminPusat, selectedDepartment, selectedAsnStatus }: UseDashboardDataProps) {
  const [stats, setStats] = useState<Stats>({ total: 0, pns: 0, pppk: 0, nonAsn: 0 });
  const [rankData, setRankData] = useState<RankData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [positionTypeData, setPositionTypeData] = useState<PositionTypeData[]>([]);
  const [joinYearData, setJoinYearData] = useState<JoinYearData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [religionData, setReligionData] = useState<ReligionData[]>([]);
  const [positionKepmenData, setPositionKepmenData] = useState<PositionKepmenData[]>([]);
  const [tmtCpnsData, setTmtCpnsData] = useState<TmtYearData[]>([]);
  const [tmtPnsData, setTmtPnsData] = useState<TmtYearData[]>([]);
  const [workDurationData, setWorkDurationData] = useState<WorkDurationData[]>([]);
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [retirementYearData, setRetirementYearData] = useState<RetirementYearData[]>([]);
  const [educationData, setEducationData] = useState<EducationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDepartmentFilter = useCallback((): string | null => {
    if (!isAdminPusat) {
      return department;
    }
    return selectedDepartment !== 'all' ? selectedDepartment : null;
  }, [isAdminPusat, department, selectedDepartment]);

  const getAsnStatusFilter = useCallback((): string[] | null => {
    if (selectedAsnStatus === 'all') return null;
    if (selectedAsnStatus === 'asn') return ['PNS', 'PPPK'];
    return [selectedAsnStatus];
  }, [selectedAsnStatus]);

  const fetchDashboardData = useCallback(async () => {
    if (!department && !isAdminPusat) return;

    setIsLoading(true);
    setError(null);

    try {
      const deptFilter = getDepartmentFilter();
      const asnFilter = getAsnStatusFilter();

      logger.debug('[Dashboard] Calling RPC get_dashboard_stats with:', { deptFilter, asnFilter });

      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats', {
        p_department: deptFilter,
        p_asn_status: asnFilter,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (!data) {
        throw new Error('Tidak ada data yang dikembalikan dari server');
      }

      logger.debug('[Dashboard] RPC response received successfully');

      // Map all data from RPC response
      setStats(data.stats || { total: 0, pns: 0, pppk: 0, nonAsn: 0 });
      setRankData(data.rankData || []);
      setDepartmentData(data.departmentData || []);
      // Format position types: Rename "Tidak Diketahui" to "Non ASN" since it predominantly represents Non ASN staff without specific jabatan.
      const formattedPositionTypeData = (data.positionTypeData || []).map((item: { type: string; count: number }) => ({
        ...item,
        type: item.type === 'Tidak Diketahui' ? 'Non ASN' : item.type
      }));
      
      setPositionTypeData(formattedPositionTypeData);
      setJoinYearData(data.joinYearData || []);
      setGenderData(data.genderData || []);
      setReligionData(data.religionData || []);
      setPositionKepmenData(data.positionKepmenData || []);
      setTmtCpnsData(data.tmtCpnsData || []);
      setTmtPnsData(data.tmtPnsData || []);
      setWorkDurationData(data.workDurationData || []);
      setGradeData(data.gradeData || []);
      setAgeData(data.ageData || []);
      setRetirementYearData(data.retirementYearData || []);
      setEducationData(data.educationData || []);

      logger.debug('[Dashboard] All data mapped successfully. Total:', data.stats?.total);
    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [department, isAdminPusat, getDepartmentFilter, getAsnStatusFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    rankData,
    departmentData,
    positionTypeData,
    joinYearData,
    genderData,
    religionData,
    positionKepmenData,
    tmtCpnsData,
    tmtPnsData,
    workDurationData,
    gradeData,
    ageData,
    retirementYearData,
    educationData,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}
