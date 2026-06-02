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
  existing_count?: number;  // Will be calculated
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
  const { profile, role } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState<PositionReference | null>(null);

  // Use department from props or user profile
  const effectiveDepartmentId = departmentId || profile?.department;

  // Fetch position references (Peta Jabatan)
  const { data: positions, isLoading, error: positionsError } = useQuery<PositionReference[]>({
    queryKey: ['position-references', 'functional', effectiveDepartmentId],
    queryFn: async () => {
      // First, get position references
      let positionQuery = supabase
        .from('position_references')
        .select('id, position_name, position_category, grade, abk_count, department')
        .eq('position_category', 'Jabatan Fungsional')
        .order('position_name');

      if (effectiveDepartmentId) {
        positionQuery = positionQuery.eq('department', effectiveDepartmentId);
      }

      const { data: positionsData, error: fetchError } = await positionQuery;
      if (fetchError) {
        console.error('Error fetching position references:', fetchError);
        throw fetchError;
      }

      if (!positionsData || positionsData.length === 0) {
        return [];
      }

      // Calculate existing count for each position
      const positionsWithExisting = await Promise.all(
        positionsData.map(async (position) => {
          // Count employees with this position
          const { count: employeeCount, error: countError } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('position_name', position.position_name)
            .eq('department', position.department)
            .eq('is_active', true);

          if (countError) {
            console.error('Error counting employees:', countError);
          }

          // Count usulan ujikom that are Lulus_Ujikom for this position
          const { count: usulanCount, error: usulanError } = await supabase
            .from('usulan_ujikom')
            .select('*', { count: 'exact', head: true })
            .eq('position_reference_id', position.id)
            .eq('status', 'Lulus_Ujikom');

          if (usulanError) {
            console.error('Error counting usulan:', usulanError);
          }

          const existing_count = (employeeCount || 0) + (usulanCount || 0);

          return {
            ...position,
            existing_count,
          };
        })
      );
      
      console.log('Position references with existing count:', {
        departmentId: effectiveDepartmentId,
        count: positionsWithExisting.length,
        positions: positionsWithExisting
      });
      
      return positionsWithExisting;
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

  if (positionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Terjadi kesalahan saat memuat data jabatan: {positionsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!positions || positions.length === 0) {
    const isAdminPusat = role === 'admin_pusat';
    
    return (
      <div className="space-y-2">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Tidak ada jabatan fungsional tersedia untuk unit kerja ini.</p>
              <p className="text-xs">
                {isAdminPusat ? (
                  <>
                    Silakan buka menu <strong>Peta Jabatan</strong> untuk menambahkan jabatan fungsional ke unit kerja ini.
                  </>
                ) : (
                  <>
                    Silakan hubungi Admin Pusat untuk menambahkan jabatan fungsional ke Peta Jabatan unit kerja Anda.
                  </>
                )}
              </p>
              {effectiveDepartmentId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Unit Kerja: <strong>{effectiveDepartmentId}</strong>
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Pilih jabatan target dari Peta Jabatan" />
        </SelectTrigger>
        <SelectContent className="max-w-[500px]">
          {positions.map((position) => {
            const available = position.abk_count - (position.existing_count || 0);
            const isFull = available <= 0;
            
            return (
              <SelectItem key={position.id} value={position.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{position.position_name}</span>
                    {position.grade && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Grade {position.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      ABK: <span className="font-medium">{position.abk_count}</span>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Existing: <span className="font-medium">{position.existing_count || 0}</span>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className={isFull ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {isFull ? 'Penuh' : `Tersedia: ${available}`}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Show selected position details */}
      {selectedPosition && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="font-medium text-blue-900">{selectedPosition.position_name}</div>
              <div className="text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <span>Kategori: {selectedPosition.position_category}</span>
                  {selectedPosition.grade && <span>• Grade {selectedPosition.grade}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">ABK: {selectedPosition.abk_count}</span>
                  <span>•</span>
                  <span className="font-medium">Existing: {selectedPosition.existing_count || 0}</span>
                  <span>•</span>
                  <span className={
                    (selectedPosition.abk_count - (selectedPosition.existing_count || 0)) <= 0
                      ? 'text-red-700 font-semibold'
                      : 'text-green-700 font-semibold'
                  }>
                    {(selectedPosition.abk_count - (selectedPosition.existing_count || 0)) <= 0
                      ? 'Formasi Penuh'
                      : `Tersedia: ${selectedPosition.abk_count - (selectedPosition.existing_count || 0)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
