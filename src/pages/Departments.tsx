import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, Search, MoreVertical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DepartmentFormModal } from '@/components/departments/DepartmentFormModal';
import { DeleteDepartmentDialog } from '@/components/departments/DeleteDepartmentDialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

export default function Departments() {
  const { isAdminPusat } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      logger.error('Error fetching departments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data unit kerja',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAdminPusat) return;
    fetchDepartments();
  }, [isAdminPusat, fetchDepartments]);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedDepartment(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  if (!isAdminPusat) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Akses Ditolak</h2>
          <p className="text-muted-foreground mt-2">
            Halaman ini hanya dapat diakses oleh Admin Pusat
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Manajemen Unit Kerja
            </h1>
            <p className="page-description">Kelola daftar unit kerja organisasi</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Unit Kerja
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari unit kerja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Unit Kerja</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal Dibuat</TableHead>
                  <TableHead className="w-[60px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {searchQuery
                        ? `Tidak ada unit kerja yang sesuai dengan "${searchQuery}"`
                        : 'Belum ada data unit kerja'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept, index) => (
                    <TableRow key={dept.id} className="animate-fade-in">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(new Date(dept.created_at), 'd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(dept)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(dept)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
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
        </div>

        {/* Form Modal */}
        <DepartmentFormModal
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          department={selectedDepartment}
          onSuccess={fetchDepartments}
        />

        {/* Delete Dialog */}
        <DeleteDepartmentDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          department={selectedDepartment}
          onSuccess={fetchDepartments}
        />
      </div>
    </AppLayout>
  );
}
