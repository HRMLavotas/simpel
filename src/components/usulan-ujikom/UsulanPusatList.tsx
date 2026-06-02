/**
 * Usulan Pusat List Component (Admin Pusat)
 * Task 8.1: Display all usulan from all departments with advanced filters
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Eye, MoreHorizontal, Filter, Search, RefreshCw } from 'lucide-react';
import { useUsulanList } from '@/hooks/useUsulanUjikom';
import type { UsulanFilterOptions, UsulanStatus } from '@/lib/usulan-ujikom/types';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface UsulanPusatListProps {
  onViewDetail: (id: string) => void;
  onChangeStatus: (id: string, currentStatus: UsulanStatus) => void;
}

export function UsulanPusatList({ onViewDetail, onChangeStatus }: UsulanPusatListProps) {
  const [filters, setFilters] = useState<UsulanFilterOptions>({
    page: 1,
    page_size: 20,
    sort_by: 'submitted_at',
    sort_order: 'desc',
  });
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useUsulanList(filters);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({
      ...prev,
      employee_name: value,
      page: 1,
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === 'all' ? undefined : (status as UsulanStatus),
      page: 1,
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy as any,
      page: 1,
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const usulanList = data?.data || [];
  const totalPages = data?.total_pages || 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pegawai, NIP, atau unit kerja..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status as string || 'all'}
          onValueChange={handleStatusFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Diajukan">Diajukan</SelectItem>
            <SelectItem value="Verifikasi_Berkas">Verifikasi Berkas</SelectItem>
            <SelectItem value="Proses_Ujikom">Proses Ujikom</SelectItem>
            <SelectItem value="Lulus_Ujikom">Lulus</SelectItem>
            <SelectItem value="Tidak_Lulus_Ujikom">Tidak Lulus</SelectItem>
            <SelectItem value="Waiting_List">Daftar Tunggu</SelectItem>
            <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort_by || 'submitted_at'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submitted_at">Tanggal Pengajuan</SelectItem>
            <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
            <SelectItem value="employee_name">Nama Pegawai</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pegawai</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead>Jabatan Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Diajukan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usulanList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Tidak ada usulan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              usulanList.map((usulan) => (
                <TableRow key={usulan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{usulan.employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {usulan.employee.nip || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{usulan.department.name}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{usulan.position_reference.position_name}</p>
                      {usulan.position_reference.grade && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Grade {usulan.position_reference.grade}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={usulan.status} />
                      {usulan.status === 'Waiting_List' && usulan.queue_position && (
                        <p className="text-xs text-muted-foreground">
                          Antrian #{usulan.queue_position}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {usulan.submitted_at ? (
                      <div className="text-sm">
                        <p>
                          {formatDistanceToNow(new Date(usulan.submitted_at), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(usulan.submitted_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => onViewDetail(usulan.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onChangeStatus(usulan.id, usulan.status)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Ubah Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {filters.page} dari {totalPages} • Total: {data?.total || 0} usulan
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              disabled={filters.page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
