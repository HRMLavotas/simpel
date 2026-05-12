import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getEffectiveDepartment, getSatpelsByPembina } from '@/lib/constants';

export interface UnitActivitySummary {
  department: string;
  month: string;
  employees_updated: number;
  mutations: number;
  position_changes: number;
  rank_changes: number;
  training_records: number;
  education_records: number;
  total_changes: number;
  last_update: string | null;
}

export interface UnitMonthlyDetail {
  change_type: string;
  employee_name: string;
  employee_nip: string;
  change_date: string;
  details: Record<string, any>;
  created_by_email: string | null;
}

export function useUnitActivitySummary(selectedMonth?: string) {
  return useQuery({
    queryKey: ['unit-activity-summary', selectedMonth],
    queryFn: async () => {
      logger.debug('Fetching unit activity summary', { selectedMonth });
      
      let query = supabase
        .from('unit_activity_summary')
        .select('*')
        .order('month', { ascending: false })
        .order('department');

      if (selectedMonth) {
        // selectedMonth sudah dalam format 'yyyy-MM-dd', gunakan langsung
        query = query.eq('month', selectedMonth);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching unit activity summary', { error });
        throw error;
      }

      const rows = (data || []) as UnitActivitySummary[];
      const aggregated = new Map<string, UnitActivitySummary>();

      // Roll up Satpel/Workshop activity into their unit pembina.
      rows.forEach((row) => {
        const effectiveDepartment = getEffectiveDepartment(row.department) || row.department;
        const key = `${row.month}|||${effectiveDepartment}`;
        const existing = aggregated.get(key);

        if (!existing) {
          aggregated.set(key, {
            ...row,
            department: effectiveDepartment,
          });
          return;
        }

        aggregated.set(key, {
          ...existing,
          employees_updated: existing.employees_updated + row.employees_updated,
          mutations: existing.mutations + row.mutations,
          position_changes: existing.position_changes + row.position_changes,
          rank_changes: existing.rank_changes + row.rank_changes,
          training_records: existing.training_records + row.training_records,
          education_records: existing.education_records + row.education_records,
          total_changes: existing.total_changes + row.total_changes,
          last_update: existing.last_update && row.last_update
            ? (new Date(existing.last_update) > new Date(row.last_update) ? existing.last_update : row.last_update)
            : (existing.last_update || row.last_update),
        });
      });

      const rolledUp = Array.from(aggregated.values())
        .sort((a, b) => {
          if (a.month !== b.month) return a.month > b.month ? -1 : 1;
          return a.department.localeCompare(b.department);
        });

      logger.debug('Unit activity summary fetched', {
        rawCount: rows.length,
        rolledUpCount: rolledUp.length,
      });
      return rolledUp;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUnitMonthlyDetails(department: string, month: string) {
  return useQuery({
    queryKey: ['unit-monthly-details', department, month],
    queryFn: async () => {
      logger.debug('Fetching unit monthly details', { department, month });
      
      const supervisedUnits = getSatpelsByPembina(department);
      const departmentsToFetch = [department, ...supervisedUnits];

      const results = await Promise.all(
        departmentsToFetch.map(async (dept) => {
          const { data, error } = await supabase.rpc('get_unit_monthly_details', {
            p_department: dept,
            p_month: month,
          });
          if (error) throw error;
          return data as UnitMonthlyDetail[] | null;
        })
      );

      const merged = results
        .flatMap(rows => rows || [])
        .sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime());

      logger.debug('Unit monthly details fetched', {
        department,
        departmentsFetched: departmentsToFetch.length,
        count: merged.length,
      });
      return merged;
    },
    enabled: !!department && !!month,
    staleTime: 1000 * 60 * 5,
  });
}
