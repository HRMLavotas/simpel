import { supabase } from '@/integrations/supabase/client';
import { enrichEmployeeDates } from '@/lib/enrichEmployeeDates';
import { toDateInputValue } from '@/lib/date-utils';
import type { Employee } from '@/types/employee';

const DATE_FIELDS = [
  'birth_date',
  'join_date',
  'tmt_cpns',
  'tmt_pns',
  'tmt_pensiun',
  'tmt_gol',
  'inactive_date',
] as const;

/** Normalize date columns for HTML date inputs. */
export function normalizeEmployeeDates(employee: Employee): Employee {
  const normalized = { ...employee };
  for (const field of DATE_FIELDS) {
    const value = normalized[field];
    if (value) {
      normalized[field] = toDateInputValue(value) || null;
    }
  }
  return normalized;
}

export async function fetchEmployeeById(employeeId: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error || !data) {
    throw error ?? new Error('Data pegawai tidak ditemukan');
  }

  return enrichEmployeeDates(normalizeEmployeeDates(data as Employee));
}
