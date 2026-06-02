/**
 * Peta Jabatan Selector Component
 * Task 5.2: Display available positions from position_references with formasi info
 * Created: 2026-06-02
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, CheckCircle2, ChevronsUpDown, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormasi } from '@/hooks/useUsulanUjikom';
import { FUNCTIONAL_POSITION_CATEGORIES, getEffectiveDepartment } from '@/lib/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PositionReference {
  id: string;
  position_name: string;
  position_category: string;
  grade: number | null;
  abk_count: number;
  department: string;
  existing_count?: number;
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
  const [searchText, setSearchText] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveDepartmentId = departmentId || profile?.department;

  const { data: positions, isLoading, error: positionsError } = useQuery<PositionReference[]>({
    queryKey: ['position-references', 'functional', effectiveDepartmentId],
    queryFn: async () => {
      const effectiveDept = getEffectiveDepartment(effectiveDepartmentId || '') || effectiveDepartmentId;

      let positionQuery = supabase
        .from('position_references')
        .select('id, position_name, position_category, grade, abk_count, department')
        .in('position_category', [...FUNCTIONAL_POSITION_CATEGORIES])
        .order('position_name');

      if (effectiveDept) {
        positionQuery = positionQuery.eq('department', effectiveDept);
      }

      const { data: positionsData, error: fetchError } = await positionQuery;
      if (fetchError) {
        console.error('Error fetching position references:', fetchError);
        throw fetchError;
      }

      if (!positionsData || positionsData.length === 0) {
        return [];
      }

      const positionsWithExisting = await Promise.all(
        positionsData.map(async (position) => {
          const { count: employeeCount, error: countError } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('position_name', position.position_name)
            .eq('department', effectiveDepartmentId)
            .eq('is_active', true);

          if (countError) {
            console.error('Error counting employees:', countError);
          }

          const { count: usulanCount, error: usulanError } = await supabase
            .from('usulan_ujikom')
            .select('*', { count: 'exact', head: true })
            .eq('position_reference_id', position.id)
            .eq('department', effectiveDepartmentId)
            .eq('status', 'Lulus_Ujikom');

          if (usulanError) {
            console.error('Error counting usulan:', usulanError);
          }

          return {
            ...position,
            existing_count: (employeeCount || 0) + (usulanCount || 0),
          };
        })
      );

      console.log('Position references with existing count:', {
        departmentId: effectiveDepartmentId,
        count: positionsWithExisting.length,
        positions: positionsWithExisting,
      });

      return positionsWithExisting;
    },
    enabled: !!effectiveDepartmentId,
  });

  const { data: formasiInfo } = useFormasi(selectedPosition?.id, effectiveDepartmentId);

  useEffect(() => {
    if (value && positions) {
      const position = positions.find((p) => p.id === value);
      setSelectedPosition(position || null);
      setSearchText(position?.position_name || '');
      return;
    }

    setSelectedPosition(null);
    setSearchText('');
  }, [value, positions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (selectedPosition) {
          setSearchText(selectedPosition.position_name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPosition]);

  const filteredPositions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return positions || [];

    return (positions || []).filter((position) => {
      return (
        position.position_name.toLowerCase().includes(term) ||
        position.position_category.toLowerCase().includes(term) ||
        position.department.toLowerCase().includes(term) ||
        (position.grade ? String(position.grade).includes(term) : false)
      );
    });
  }, [positions, searchText]);

  const handleSelectPosition = (position: PositionReference) => {
    console.log('Selected position:', position.id, position.position_name);
    onChange(position.id);
    setSelectedPosition(position);
    setSearchText(position.position_name);
    setOpen(false);
  };

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
                <p className="mt-2 text-xs text-muted-foreground">
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

  const showSelectedDetails =
    !!selectedPosition &&
    searchText.trim().length > 0 &&
    searchText.trim() === selectedPosition.position_name;

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Ketik nama jabatan dari Peta Jabatan"
            disabled={disabled}
            className={cn('pl-9 pr-10', error && 'border-red-500')}
            autoComplete="off"
          />
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            <div className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>{filteredPositions.length} hasil ditemukan</span>
            </div>
            <div className="max-h-64 overflow-auto py-1">
              {filteredPositions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Tidak ada jabatan yang cocok dengan pencarian ini.
                </div>
              ) : (
                filteredPositions.map((position) => {
                  const available = position.abk_count - (position.existing_count || 0);
                  const isFull = available <= 0;
                  const isSelected = position.id === value;

                  return (
                    <button
                      key={position.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectPosition(position);
                      }}
                    >
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium">{position.position_name}</span>
                          {position.grade && (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              Grade {position.grade}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Kategori: {position.position_category}</span>
                          <span>ABK: {position.abk_count}</span>
                          <span>Existing: {position.existing_count || 0}</span>
                          <span className={isFull ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                            {isFull ? 'Penuh' : `Tersedia: ${available}`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showSelectedDetails && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="font-medium text-blue-900">{selectedPosition.position_name}</div>
              <div className="text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <span>Kategori: {selectedPosition.position_category}</span>
                  {selectedPosition.grade && <span>• Grade {selectedPosition.grade}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium">ABK: {selectedPosition.abk_count}</span>
                  <span>•</span>
                  <span className="font-medium">Existing: {selectedPosition.existing_count || 0}</span>
                  <span>•</span>
                  <span
                    className={
                      (selectedPosition.abk_count - (selectedPosition.existing_count || 0)) <= 0
                        ? 'font-semibold text-red-700'
                        : 'font-semibold text-green-700'
                    }
                  >
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
