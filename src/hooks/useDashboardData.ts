import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
  selectedAsnStatus: string; // New: ASN status filter
}

// Add cache interface for performance optimization
interface DashboardCache {
  data: any;
  timestamp: number;
  filter: string;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Query keys for React Query
const QUERY_KEYS = {
  stats: (dept: string | null, asn: string) => ['dashboard', 'stats', dept, asn],
  rank: (dept: string | null, asn: string) => ['dashboard', 'rank', dept, asn],
  department: (dept: string | null, asn: string) => ['dashboard', 'department', dept, asn],
  positionType: (dept: string | null, asn: string) => ['dashboard', 'positionType', dept, asn],
  joinYear: (dept: string | null, asn: string) => ['dashboard', 'joinYear', dept, asn],
  gender: (dept: string | null, asn: string) => ['dashboard', 'gender', dept, asn],
  religion: (dept: string | null, asn: string) => ['dashboard', 'religion', dept, asn],
  positionKepmen: (dept: string | null, asn: string) => ['dashboard', 'positionKepmen', dept, asn],
  tmtCpns: (dept: string | null, asn: string) => ['dashboard', 'tmtCpns', dept, asn],
  tmtPns: (dept: string | null, asn: string) => ['dashboard', 'tmtPns', dept, asn],
  workDuration: (dept: string | null, asn: string) => ['dashboard', 'workDuration', dept, asn],
  grade: (dept: string | null, asn: string) => ['dashboard', 'grade', dept, asn],
  age: (dept: string | null, asn: string) => ['dashboard', 'age', dept, asn],
  retirement: (dept: string | null, asn: string) => ['dashboard', 'retirement', dept, asn],
  education: (dept: string | null, asn: string) => ['dashboard', 'education', dept, asn],
};

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

  const getDepartmentFilter = useCallback(() => {
    if (!isAdminPusat) {
      return department;
    }
    return selectedDepartment !== 'all' ? selectedDepartment : null;
  }, [isAdminPusat, department, selectedDepartment]);

  // New: Helper to get ASN status filter
  const getAsnStatusFilter = useCallback(() => {
    if (selectedAsnStatus === 'all') return null;
    if (selectedAsnStatus === 'asn') return ['PNS', 'PPPK']; // ASN includes both PNS and PPPK
    return [selectedAsnStatus]; // Single status: PNS, PPPK, or Non ASN
  }, [selectedAsnStatus]);

  // Helper to apply ASN status filter to query
  const applyAsnStatusFilter = useCallback((query: any) => {
    const asnFilter = getAsnStatusFilter();
    if (asnFilter) {
      return query.in('asn_status', asnFilter);
    }
    return query;
  }, [getAsnStatusFilter]);

  // Helper function to get cache key
  const getCacheKey = useCallback((dataType: string) => {
    const filter = getDepartmentFilter() || 'all';
    const asnFilter = selectedAsnStatus || 'all';
    return `${dataType}_${filter}_${asnFilter}`;
  }, [getDepartmentFilter, selectedAsnStatus]);

  const fetchStats = useCallback(async () => {
    const deptFilter = getDepartmentFilter();

    // Fetch total count
    let totalQuery = supabase.from('employees').select('*', { count: 'exact', head: true });
    if (deptFilter) totalQuery = totalQuery.eq('department', deptFilter);
    totalQuery = applyAsnStatusFilter(totalQuery);
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
  }, [getDepartmentFilter, applyAsnStatusFilter]);

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
      query = applyAsnStatusFilter(query);

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
  }, [getDepartmentFilter, applyAsnStatusFilter]);

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
      query = applyAsnStatusFilter(query);

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
  }, [getDepartmentFilter, applyAsnStatusFilter]);

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
      query = applyAsnStatusFilter(query);

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
  }, [getDepartmentFilter, applyAsnStatusFilter]);

  const fetchGenderData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const genderCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('gender')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);
      query = applyAsnStatusFilter(query);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching gender data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          const gender = e.gender || 'Tidak Diketahui';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(genderCounts)
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count);
  }, [getDepartmentFilter, applyAsnStatusFilter]);

  const fetchReligionData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const religionCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('religion')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);
      query = applyAsnStatusFilter(query);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching religion data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          const religion = e.religion || 'Tidak Diketahui';
          religionCounts[religion] = (religionCounts[religion] || 0) + 1;
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(religionCounts)
      .map(([religion, count]) => ({ religion, count }))
      .sort((a, b) => b.count - a.count);
  }, [getDepartmentFilter, applyAsnStatusFilter]);

  const fetchPositionKepmenData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const positionCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    // Ambil dari position_references untuk mendapatkan SEMUA jabatan (termasuk yang kosong)
    while (hasMore) {
      let query = supabase
        .from('position_references')
        .select('position_name, department')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data: positions, error: posError } = await query;

      if (posError) {
        console.error('Error fetching position references:', posError);
        break;
      }

      if (!positions || positions.length === 0) {
        hasMore = false;
      } else {
        // Initialize all positions with count 0
        positions.forEach(pos => {
          if (pos.position_name && !positionCounts[pos.position_name]) {
            positionCounts[pos.position_name] = 0;
          }
        });
        
        if (positions.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    // Now count employees for each position
    offset = 0;
    hasMore = true;
    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('position_name')
        .not('position_name', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data: employees, error: empError } = await query;

      if (empError) {
        console.error('Error fetching employees for position count:', empError);
        break;
      }

      if (!employees || employees.length === 0) {
        hasMore = false;
      } else {
        employees.forEach(e => {
          if (e.position_name && positionCounts[e.position_name] !== undefined) {
            positionCounts[e.position_name]++;
          }
        });
        
        if (employees.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(positionCounts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);
  }, [getDepartmentFilter]);

  const fetchTmtCpnsData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const yearCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('tmt_cpns')
        .not('tmt_cpns', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching TMT CPNS data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.tmt_cpns) {
            const year = new Date(e.tmt_cpns).getFullYear().toString();
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
      .slice(-15); // Last 15 years
  }, [getDepartmentFilter]);

  const fetchTmtPnsData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const yearCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('tmt_pns')
        .not('tmt_pns', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching TMT PNS data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.tmt_pns) {
            const year = new Date(e.tmt_pns).getFullYear().toString();
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
      .slice(-15); // Last 15 years
  }, [getDepartmentFilter]);

  const fetchWorkDurationData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const durationCounts = {
      '< 5 tahun': 0,
      '5-10 tahun': 0,
      '10-20 tahun': 0,
      '20-30 tahun': 0,
      '> 30 tahun': 0,
    };
    let offset = 0;
    let hasMore = true;
    const today = new Date();

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('tmt_cpns, tmt_pns')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching work duration data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          // Use TMT CPNS if available, otherwise TMT PNS
          const tmtDate = e.tmt_cpns || e.tmt_pns;
          if (tmtDate) {
            const tmt = new Date(tmtDate);
            const diffYears = (today.getTime() - tmt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            
            if (diffYears < 5) {
              durationCounts['< 5 tahun']++;
            } else if (diffYears < 10) {
              durationCounts['5-10 tahun']++;
            } else if (diffYears < 20) {
              durationCounts['10-20 tahun']++;
            } else if (diffYears < 30) {
              durationCounts['20-30 tahun']++;
            } else {
              durationCounts['> 30 tahun']++;
            }
          }
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return [
      { category: '< 5 tahun', count: durationCounts['< 5 tahun'], order: 1 },
      { category: '5-10 tahun', count: durationCounts['5-10 tahun'], order: 2 },
      { category: '10-20 tahun', count: durationCounts['10-20 tahun'], order: 3 },
      { category: '20-30 tahun', count: durationCounts['20-30 tahun'], order: 4 },
      { category: '> 30 tahun', count: durationCounts['> 30 tahun'], order: 5 },
    ];
  }, [getDepartmentFilter]);

  const fetchGradeData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const gradeCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Join employees with position_references to get grade
      let query = supabase
        .from('employees')
        .select('position_name')
        .not('position_name', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data: employees, error: empError } = await query;

      if (empError) {
        console.error('Error fetching grade data:', empError);
        break;
      }

      if (!employees || employees.length === 0) {
        hasMore = false;
      } else {
        // Get unique position names
        const positionNames = [...new Set(employees.map(e => e.position_name).filter(Boolean))];
        
        if (positionNames.length > 0) {
          // Fetch grades for these positions
          const { data: positions, error: posError } = await supabase
            .from('position_references')
            .select('position_name, grade')
            .in('position_name', positionNames)
            .not('grade', 'is', null);

          if (!posError && positions) {
            // Create position to grade mapping
            const positionGradeMap: Record<string, number> = {};
            positions.forEach(p => {
              if (p.position_name && p.grade !== null) {
                positionGradeMap[p.position_name] = p.grade;
              }
            });

            // Count employees by grade
            employees.forEach(e => {
              if (e.position_name && positionGradeMap[e.position_name]) {
                const grade = `Grade ${positionGradeMap[e.position_name]}`;
                gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
              }
            });
          }
        }
        
        if (employees.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return Object.entries(gradeCounts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const gradeA = parseInt(a.grade.replace('Grade ', ''));
        const gradeB = parseInt(b.grade.replace('Grade ', ''));
        return gradeA - gradeB;
      });
  }, [getDepartmentFilter]);

  const fetchAgeData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const ageCounts = {
      '< 25 tahun': 0,
      '25-35 tahun': 0,
      '35-45 tahun': 0,
      '45-55 tahun': 0,
      '> 55 tahun': 0,
    };
    let offset = 0;
    let hasMore = true;
    const today = new Date();

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('birth_date')
        .not('birth_date', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching age data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.birth_date) {
            const birthDate = new Date(e.birth_date);
            const ageYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            
            if (ageYears < 25) {
              ageCounts['< 25 tahun']++;
            } else if (ageYears < 35) {
              ageCounts['25-35 tahun']++;
            } else if (ageYears < 45) {
              ageCounts['35-45 tahun']++;
            } else if (ageYears < 55) {
              ageCounts['45-55 tahun']++;
            } else {
              ageCounts['> 55 tahun']++;
            }
          }
        });
        
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }
    }

    return [
      { category: '< 25 tahun', count: ageCounts['< 25 tahun'], order: 1 },
      { category: '25-35 tahun', count: ageCounts['25-35 tahun'], order: 2 },
      { category: '35-45 tahun', count: ageCounts['35-45 tahun'], order: 3 },
      { category: '45-55 tahun', count: ageCounts['45-55 tahun'], order: 4 },
      { category: '> 55 tahun', count: ageCounts['> 55 tahun'], order: 5 },
    ];
  }, [getDepartmentFilter]);

  const fetchRetirementYearData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const yearCounts: Record<string, number> = {};
    let offset = 0;
    let hasMore = true;
    const currentYear = new Date().getFullYear();

    while (hasMore) {
      let query = supabase
        .from('employees')
        .select('tmt_pensiun')
        .not('tmt_pensiun', 'is', null)
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (deptFilter) query = query.eq('department', deptFilter);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching retirement year data:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(e => {
          if (e.tmt_pensiun) {
            const year = new Date(e.tmt_pensiun).getFullYear().toString();
            const yearNum = parseInt(year);
            // Only include next 10 years
            if (yearNum >= currentYear && yearNum <= currentYear + 10) {
              yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
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
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [getDepartmentFilter]);

  const fetchEducationData = useCallback(async () => {
    const deptFilter = getDepartmentFilter();
    const PAGE_SIZE = 1000;
    const educationCounts: Record<string, number> = {};
    const educationDetails: Record<string, Record<string, number>> = {}; // level -> { major -> count }
    let offset = 0;
    let hasMore = true;

    logger.debug('[Dashboard] Fetching education data with filter:', deptFilter, 'ASN status:', selectedAsnStatus);

    // First, get all employee IDs that match the filter
    const allEmployeeIds: string[] = [];
    let empOffset = 0;
    let empHasMore = true;

    while (empHasMore) {
      let employeeQuery = supabase
        .from('employees')
        .select('id')
        .range(empOffset, empOffset + PAGE_SIZE - 1);
      
      if (deptFilter) {
        employeeQuery = employeeQuery.eq('department', deptFilter);
      }
      employeeQuery = applyAsnStatusFilter(employeeQuery);

      const { data: employees, error: empError } = await employeeQuery;

      if (empError) {
        console.error('[Dashboard] Error fetching employees for education:', empError);
        break;
      }

      if (!employees || employees.length === 0) {
        empHasMore = false;
      } else {
        allEmployeeIds.push(...employees.map(e => e.id));
        if (employees.length < PAGE_SIZE) {
          empHasMore = false;
        } else {
          empOffset += PAGE_SIZE;
        }
      }
    }

    logger.debug(`[Dashboard] Found ${allEmployeeIds.length} employees matching filter`);

    if (allEmployeeIds.length === 0) {
      return [];
    }

    // Now fetch education data in batches
    const BATCH_SIZE = 50; // Smaller batch to avoid URL length issues
    const educationOrder: Record<string, number> = {
      'SD': 1, 'SMP': 2, 'SMA': 3, 'SMA/SMK': 3, 'D1': 4, 'D2': 5, 
      'D3': 6, 'D4': 7, 'S1': 8, 'S2': 9, 'S3': 10,
    };
    const employeeEducation: Record<string, { level: string; major: string | null }> = {};

    for (let i = 0; i < allEmployeeIds.length; i += BATCH_SIZE) {
      const batchIds = allEmployeeIds.slice(i, i + BATCH_SIZE);
      
      try {
        const { data: educations, error: eduError } = await supabase
          .from('education_history')
          .select('employee_id, level, major')
          .in('employee_id', batchIds);

        if (eduError) {
          console.error('[Dashboard] Error fetching education history batch:', eduError);
          continue;
        }

        if (educations && educations.length > 0) {
          // Get highest education per employee
          educations.forEach(edu => {
            const current = employeeEducation[edu.employee_id];
            if (!current || 
                (educationOrder[edu.level] || 0) > (educationOrder[current.level] || 0)) {
              employeeEducation[edu.employee_id] = {
                level: edu.level,
                major: edu.major || 'Tidak Ada'
              };
            }
          });
        }
      } catch (err) {
        console.error('[Dashboard] Exception fetching education batch:', err);
      }
    }

    logger.debug(`[Dashboard] Processed ${Object.keys(employeeEducation).length} unique employees with education data`);

    // Count by level and major
    Object.values(employeeEducation).forEach(({ level, major }) => {
      educationCounts[level] = (educationCounts[level] || 0) + 1;
      if (!educationDetails[level]) educationDetails[level] = {};
      educationDetails[level][major] = (educationDetails[level][major] || 0) + 1;
    });

    const result = Object.entries(educationCounts)
      .map(([level, count]) => ({
        level,
        count,
        details: Object.entries(educationDetails[level] || {})
          .map(([major, majorCount]) => ({ major, count: majorCount }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => {
        const orderA = educationOrder[a.level] || 999;
        const orderB = educationOrder[b.level] || 999;
        return orderA - orderB;
      });

    logger.debug('[Dashboard] Education data result:', result);
    logger.debug('[Dashboard] NOTE: Only showing employees with data in education_history table');
    
    return result;
  }, [getDepartmentFilter, selectedAsnStatus, applyAsnStatusFilter]);

  const fetchDashboardData = useCallback(async () => {
    if (!department && !isAdminPusat) return;
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('[Dashboard] Starting data fetch with filter:', getDepartmentFilter());
      
      const [
        statsResult, 
        rankResult, 
        deptResult, 
        positionResult, 
        joinYearResult,
        genderResult,
        religionResult,
        positionKepmenResult,
        tmtCpnsResult,
        tmtPnsResult,
        workDurationResult,
        gradeResult,
        ageResult,
        retirementYearResult,
        educationResult
      ] = await Promise.all([
        fetchStats(),
        fetchRankData(),
        fetchDepartmentData(),
        fetchPositionTypeData(),
        fetchJoinYearData(),
        fetchGenderData(),
        fetchReligionData(),
        fetchPositionKepmenData(),
        fetchTmtCpnsData(),
        fetchTmtPnsData(),
        fetchWorkDurationData(),
        fetchGradeData(),
        fetchAgeData(),
        fetchRetirementYearData(),
        fetchEducationData(),
      ]);

      logger.debug('[Dashboard] All data fetched successfully');

      setStats(statsResult);
      setRankData(rankResult);
      setDepartmentData(deptResult);
      setPositionTypeData(positionResult);
      setJoinYearData(joinYearResult);
      setGenderData(genderResult);
      setReligionData(religionResult);
      setPositionKepmenData(positionKepmenResult);
      setTmtCpnsData(tmtCpnsResult);
      setTmtPnsData(tmtPnsResult);
      setWorkDurationData(workDurationResult);
      setGradeData(gradeResult);
      setAgeData(ageResult);
      setRetirementYearData(retirementYearResult);
      setEducationData(educationResult);
    } catch (error) {
      console.error('[Dashboard] Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [
    department, 
    isAdminPusat, 
    fetchStats, 
    fetchRankData, 
    fetchDepartmentData, 
    fetchPositionTypeData, 
    fetchJoinYearData, 
    fetchGenderData, 
    fetchReligionData, 
    fetchPositionKepmenData,
    fetchTmtCpnsData,
    fetchTmtPnsData,
    fetchWorkDurationData,
    fetchGradeData,
    fetchAgeData,
    fetchRetirementYearData,
    fetchEducationData,
    getDepartmentFilter
  ]);

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
