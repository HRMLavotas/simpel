import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface Stats {
  total: number;
  pns: number;
  cpns: number;
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
  const [stats, setStats] = useState<Stats>({ total: 0, pns: 0, cpns: 0, pppk: 0, nonAsn: 0 });
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
    if (selectedAsnStatus === 'asn') return ['PNS', 'CPNS', 'PPPK'];
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
        logger.error('[Dashboard] RPC Error details:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
        });
        throw rpcError;
      }

      if (!data) {
        throw new Error('Tidak ada data yang dikembalikan dari server');
      }

      logger.debug('[Dashboard] RPC response received successfully');

      // Helper: convert JSONB object { "key": count } to array of objects
      const objToArray = <T extends object>(
        obj: Record<string, number> | null | undefined,
        keyName: string
      ): T[] => {
        if (!obj || typeof obj !== 'object') return [];
        return Object.entries(obj).map(([key, count]) => ({ [keyName]: key, count } as unknown as T));
      };

      // Map all data from RPC response
      // RPC returns keys: stats, byRank, byDepartment, byPositionType, byGender, byReligion,
      //                   byWorkDuration, byGrade, byAge, byRetirementYear
      setStats(data.stats || { total: 0, pns: 0, cpns: 0, pppk: 0, nonAsn: 0 });

      setRankData(objToArray<RankData>(data.byRank, 'rank'));
      setDepartmentData(objToArray<DepartmentData>(data.byDepartment, 'department'));

      // Format position types: Rename "Tidak Diketahui" to "Non ASN"
      const rawPositionTypeData = objToArray<PositionTypeData>(data.byPositionType, 'type');
      const formattedPositionTypeData = rawPositionTypeData.map((item) => ({
        ...item,
        type: item.type === 'Tidak Diketahui' ? 'Non ASN' : item.type,
      }));
      setPositionTypeData(formattedPositionTypeData);

      // joinYearData, positionKepmenData, tmtCpnsData, tmtPnsData not provided by RPC — keep empty
      setJoinYearData([]);
      setGenderData(objToArray<GenderData>(data.byGender, 'gender'));
      setReligionData(objToArray<ReligionData>(data.byReligion, 'religion'));
      setPositionKepmenData([]);
      setTmtCpnsData([]);
      setTmtPnsData([]);

      // workDurationData: RPC returns { "0-5 tahun": N, ... }, map to { category, count, order }
      const workDurationOrder: Record<string, number> = {
        '0-5 tahun': 1,
        '5-10 tahun': 2,
        '10-15 tahun': 3,
        '15-20 tahun': 4,
        '20+ tahun': 5,
      };
      const rawWorkDuration = data.byWorkDuration as Record<string, number> | null;
      const mappedWorkDuration: WorkDurationData[] = rawWorkDuration
        ? Object.entries(rawWorkDuration).map(([category, count]) => ({
            category,
            count: count as number,
            order: workDurationOrder[category] ?? 99,
          })).sort((a, b) => a.order - b.order)
        : [];
      setWorkDurationData(mappedWorkDuration);

      setGradeData(objToArray<GradeData>(data.byGrade, 'grade'));

      // ageData: RPC returns { "<25": N, "25-34": N, ... }, map to { category, count, order }
      const ageOrder: Record<string, number> = { '<25': 1, '25-34': 2, '35-44': 3, '45-54': 4, '55+': 5 };
      const rawAge = data.byAge as Record<string, number> | null;
      const mappedAge: AgeData[] = rawAge
        ? Object.entries(rawAge).map(([category, count]) => ({
            category,
            count: count as number,
            order: ageOrder[category] ?? 99,
          })).sort((a, b) => a.order - b.order)
        : [];
      setAgeData(mappedAge);

      setRetirementYearData(objToArray<RetirementYearData>(data.byRetirementYear, 'year'));

      // educationData not in RPC (removed in migration 005) — keep empty
      setEducationData([]);

      logger.debug('[Dashboard] All data mapped successfully. Total:', data.stats?.total);
    } catch (err) {
      logger.error('[Dashboard] Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data dashboard';
      logger.error('[Dashboard] Error message:', errorMessage);
      if (err && typeof err === 'object') {
        logger.error('[Dashboard] Error object:', JSON.stringify(err, null, 2));
      }
      setError(errorMessage);
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
