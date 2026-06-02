import { supabase } from '@/integrations/supabase/client';
import type { HistoryEntry } from '@/types/employee';
import { logger } from '@/lib/logger';

type HistoryTableName =
  | 'education_history'
  | 'position_history'
  | 'mutation_history'
  | 'rank_history'
  | 'competency_test_history'
  | 'training_history'
  | 'additional_position_history';

export async function saveEmployeeHistoryEntries(
  tableName: HistoryTableName,
  employeeId: string,
  entries: HistoryEntry[] | undefined,
  fieldKeys: string[]
): Promise<void> {
  if (!entries) return;

  const rows = entries
    .filter((e) => fieldKeys.some((k) => e[k]))
    .filter((e) => e.id !== '__current__')
    .map((e) => {
      const row: Record<string, string | number | null> = { employee_id: employeeId };
      fieldKeys.forEach((k) => {
        row[k] = e[k] || null;
      });
      return row;
    });

  if (tableName === 'rank_history') {
    rows.forEach((row, i) => {
      if (!row.pangkat_lama && i > 0) {
        row.pangkat_lama = rows[i - 1].pangkat_baru || null;
      }
    });
  } else if (tableName === 'position_history') {
    rows.forEach((row, i) => {
      if (!row.jabatan_lama && i > 0) {
        row.jabatan_lama = rows[i - 1].jabatan_baru || null;
      }
    });
  } else if (tableName === 'mutation_history') {
    rows.forEach((row, i) => {
      if (!row.dari_unit && i > 0) {
        row.dari_unit = rows[i - 1].ke_unit || null;
      }
    });
  }

  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('employee_id', employeeId);

  if (deleteError) {
    logger.error(`Error deleting ${tableName}:`, deleteError);
    throw deleteError;
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from(tableName).insert(rows);
    if (insertError) {
      logger.error(`Error inserting ${tableName}:`, insertError);
      throw insertError;
    }
  }
}
