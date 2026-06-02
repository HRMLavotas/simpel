/**
 * Usulan List Component
 * Task 7.2: Display table of usulan with filters
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Edit,
  Eye,
  Trash2,
  Send,
  MoreHorizontal,
  Filter,
  Search,
} from 'lucide-react';
import { useUsulanList } from '@/hooks/useUsulanUjikom';
import { useUsulanUjikomMutations } from '@/hooks/useUsulanUjikomMutations';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface UsulanListProps {
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
}

export function UsulanList({ onViewDetail, onEdit }: UsulanListProps) {
  const [filters, setFilters] = useState<UsulanFilterOptions>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading } = useUsulanList(filters);
  const { deleteUsulan, cancelUsulan, submitUsulan } = useUsulanUjikomMutations();

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

  const handleDelete = async () => {
    if (deleteId) {
      await deleteUsulan.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleCancel = async () => {
    if (cancelId) {
      // Show dialog to get cancellation reason
      // For now, use a simple reason
      await cancelUsulan.mutateAsync({
        id: cancelId,
        reason: 'Dibatalkan oleh Admin Unit',
      });
      setCancelId(null);
    }
  };

  const handleSubmit = async (id: string) => {
    await submitUsulan.mutateAsync(id);
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pegawai atau NIP..."
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
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Waiting_List">Daftar Tunggu</SelectItem>
            <SelectItem value="Diajukan">Diajukan</SelectItem>
            <SelectItem value="Verifikasi_Berkas">Verifikasi Berkas</SelectItem>
            <SelectItem value="Proses_Ujikom">Proses Ujikom</SelectItem>
            <SelectItem value="Lulus_Ujikom">Lulus</SelectItem>
            <SelectItem value="Tidak_Lulus_Ujikom">Tidak Lulus</SelectItem>
            <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pegawai</TableHead>
              <TableHead>Jabatan Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Diajukan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usulanList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Tidak ada usulan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              usulanList.map((usulan) => {
                const canEdit = usulan.status === 'Draft' || usulan.status === 'Waiting_List';
                const canDelete = usulan.status === 'Draft' || usulan.status === 'Waiting_List' || usulan.status === 'Diajukan';
                const canSubmit = usulan.status === 'Draft';

                return (
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
                      <div>
                        <p>{usulan.position_reference.position_name}</p>
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
                        <span className="text-sm text-muted-foreground">Belum diajukan</span>
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

                          {canEdit && (
                            <DropdownMenuItem onClick={() => onEdit(usulan.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {canSubmit && (
                            <DropdownMenuItem onClick={() => handleSubmit(usulan.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Ajukan
                            </DropdownMenuItem>
                          )}

                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(usulan.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {filters.page} dari {totalPages}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Usulan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus usulan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
