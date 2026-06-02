/**
 * Employee Selector Component
 * Task 5.3: Display searchable list of eligible employees
 * Created: 2026-06-02
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  nip: string | null;
  name: string;
  position_name: string | null;
  rank: string | null;
  asn_status: string | null;
  is_active: boolean;
}

interface EmployeeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  departmentId?: string;
  positionReferenceId?: string;
  disabled?: boolean;
  error?: string;
}

export function EmployeeSelector({
  value,
  onChange,
  departmentId,
  positionReferenceId,
  disabled,
  error,
}: EmployeeSelectorProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const effectiveDepartmentId = departmentId || profile?.department;

  // Fetch eligible employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', 'eligible', effectiveDepartmentId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, nip, name, position_name, rank, asn_status, is_active')
        .eq('is_active', true)
        .not('asn_status', 'is', null)
        .order('name');

      if (effectiveDepartmentId) {
        query = query.eq('department', effectiveDepartmentId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      return data || [];
    },
    enabled: !!effectiveDepartmentId,
  });

  // Check if employee has active usulan for the same position
  const { data: existingUsulan } = useQuery({
    queryKey: ['usulan-ujikom', 'check', value, positionReferenceId],
    queryFn: async () => {
      if (!value || !positionReferenceId) return null;

      const { data, error } = await supabase
        .from('usulan_ujikom')
        .select('id, status')
        .eq('employee_id', value)
        .eq('position_reference_id', positionReferenceId)
        .in('status', ['Draft', 'Waiting_List', 'Diajukan', 'Verifikasi_Berkas', 'Proses_Ujikom'])
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!value && !!positionReferenceId,
  });

  const selectedEmployee = employees?.find((emp) => emp.id === value);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            {value && selectedEmployee ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedEmployee.name}</span>
                {selectedEmployee.nip && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedEmployee.nip})
                  </span>
                )}
              </div>
            ) : (
              'Pilih pegawai'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Cari nama atau NIP..." />
            <CommandList>
              <CommandEmpty>Tidak ada pegawai ditemukan.</CommandEmpty>
              <CommandGroup>
                {employees?.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.name} ${employee.nip || ''}`}
                    onSelect={() => {
                      onChange(employee.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === employee.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.nip && <span>NIP: {employee.nip} • </span>}
                        {employee.position_name && <span>{employee.position_name} • </span>}
                        {employee.rank && <span>{employee.rank}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Show warning if employee has active usulan */}
      {existingUsulan && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <Badge variant="outline" className="border-orange-500">
            Peringatan
          </Badge>
          <span>
            Pegawai sudah memiliki usulan aktif untuk jabatan ini (Status: {existingUsulan.status})
          </span>
        </div>
      )}

      {/* Show selected employee details */}
      {selectedEmployee && (
        <div className="rounded-md border p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Nama:</span>
              <span className="ml-2 font-medium">{selectedEmployee.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">NIP:</span>
              <span className="ml-2">{selectedEmployee.nip || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Jabatan Saat Ini:</span>
              <span className="ml-2">{selectedEmployee.position_name || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pangkat:</span>
              <span className="ml-2">{selectedEmployee.rank || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
