/**
 * Peta Jabatan Selector Component
 * Task 5.2: Display available positions from position_references with formasi info
 * Created: 2026-06-02
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormasi } from '@/hooks/useUsulanUjikom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PositionReference {
  id: string;
  position_name: string;
  position_category: string;
  grade: number | null;
  abk_count: number;
  department: string;
}

interface PetaJabatanSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  departmentId?: string;
  disabled?: boolean;
  error?: string;
}

export function PetaJabatanSelector({
  value,
  onChange,
  departmentId,
  disabled,
  error,
}: PetaJabatanSelectorProps) {
  const { profile } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState<PositionReference | null>(null);

  // Use department from props or user profile
  const effectiveDepartmentId = departmentId || profile?.department_id;

  // Fetch position references (Peta Jabatan)
  const { data: positions, isLoading } = useQuery<PositionReference[]>({
    queryKey: ['position-references', 'functional', effectiveDepartmentId],
    queryFn: async () => {
      let query = supabase
        .from('position_references')
        .select('id, position_name, position_category, grade, abk_count, department')
        .eq('position_category', 'Jabatan Fungsional')
        .order('position_name');

      if (effectiveDepartmentId) {
        query = query.eq('department', effectiveDepartmentId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      return data || [];
    },
    enabled: !!effectiveDepartmentId,
  });

  // Get formasi info for selected position
  const { data: formasiInfo } = useFormasi(
    selectedPosition?.id,
    effectiveDepartmentId
  );

  // Update selected position when value changes
  useEffect(() => {
    if (value && positions) {
      const position = positions.find((p) => p.id === value);
      setSelectedPosition(position || null);
    } else {
      setSelectedPosition(null);
    }
  }, [value, positions]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!positions || positions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tidak ada jabatan fungsional tersedia untuk unit kerja ini.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Pilih jabatan target" />
        </SelectTrigger>
        <SelectContent>
          {positions.map((position) => (
            <SelectItem key={position.id} value={position.id}>
              <div className="flex items-center justify-between gap-2 w-full">
                <span>{position.position_name}</span>
                {position.grade && (
                  <span className="text-xs text-muted-foreground">
                    (Grade {position.grade})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Show formasi availability info */}
      {formasiInfo && (
        <div className="text-sm">
          {formasiInfo.is_available ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Formasi tersedia: {formasiInfo.available_count} dari {formasiInfo.total_quota}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Formasi penuh ({formasiInfo.occupied_count}/{formasiInfo.total_quota}).
                {formasiInfo.waiting_list_count > 0 && (
                  <> {formasiInfo.waiting_list_count} usulan dalam daftar tunggu.</>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
