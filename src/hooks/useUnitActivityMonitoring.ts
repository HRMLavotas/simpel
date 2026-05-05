import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
      logger.log('Fetching unit activity summary', { selectedMonth });
      
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

      logger.log('Unit activity summary fetched', { count: data?.length });
      return data as UnitActivitySummary[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUnitMonthlyDetails(department: string, month: string) {
  return useQuery({
    queryKey: ['unit-monthly-details', department, month],
    queryFn: async () => {
      logger.log('Fetching unit monthly details', { department, month });
      
      const { data, error } = await supabase.rpc('get_unit_monthly_details', {
        p_department: department,
        p_month: month,
      });

      if (error) {
        logger.error('Error fetching unit monthly details', { error });
        throw error;
      }

      logger.log('Unit monthly details fetched', { count: data?.length });
      return data as UnitMonthlyDetail[];
    },
    enabled: !!department && !!month,
    staleTime: 1000 * 60 * 5,
  });
}
