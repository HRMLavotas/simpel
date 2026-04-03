import { useEffect, useState } from 'react';
import { Search, Shield, UserPlus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useDepartments } from '@/hooks/useDepartments';
import { CreateAdminModal } from '@/components/admins/CreateAdminModal';
import { EditAdminModal } from '@/components/admins/EditAdminModal';
import { DeleteAdminDialog } from '@/components/admins/DeleteAdminDialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  created_at: string;
}

export default function Admins() {
  const { isAdminPusat, user } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isAdminPusat) return;
    fetchAdmins();
  }, [isAdminPusat]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      logger.debug('=== FETCHING ADMINS ===');
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;
      logger.debug('Profiles fetched:', profiles?.length);

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;
      logger.debug('Roles fetched:', roles?.length);

      // Combine data
      const adminsData: AdminUser[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const adminData = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          department: profile.department,
          role: userRole?.role || 'admin_unit',
          created_at: profile.created_at,
        };
        
        logger.debug(`Admin: ${adminData.full_name} | Dept: ${adminData.department} | Role: ${adminData.role}`);
        
        return adminData;
      }) || [];

      logger.debug('Combined admins data:', adminsData);
      setAdmins(adminsData);
    } catch (error) {
      logger.error('Error fetching admins:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data admin',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = 
      admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || admin.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  if (!isAdminPusat) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
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
            <h1 className="page-title">Kelola Admin</h1>
            <p className="page-description">Kelola daftar admin unit kerja</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Admin
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger id="admin-department-filter" className="w-full sm:w-[240px]">
              <SelectValue placeholder="Unit Kerja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit Kerja</SelectItem>
              {dynamicDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Unit Kerja</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden lg:table-cell">Terdaftar</TableHead>
                <TableHead className="w-[70px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {searchQuery || departmentFilter !== 'all'
                      ? 'Tidak ada admin yang sesuai dengan filter'
                      : 'Belum ada data admin'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} className="animate-fade-in">
                    <TableCell className="font-medium">
                      <div>{admin.full_name}</div>
                      <div className="sm:hidden text-xs text-muted-foreground mt-0.5">{admin.email}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{admin.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{admin.department}</TableCell>
                    <TableCell>
                      <Badge variant={
                        admin.role === 'admin_pusat' ? 'default' : 
                        admin.role === 'admin_pimpinan' ? 'secondary' : 
                        'outline'
                      }>
                        {admin.role === 'admin_pusat' ? 'Admin Pusat' : 
                         admin.role === 'admin_pimpinan' ? 'Admin Pimpinan' : 
                         'Admin Unit'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {admin.created_at 
                        ? format(new Date(admin.created_at), 'd MMM yyyy', { locale: id })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setIsDeleteDialogOpen(true);
                            }}
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

        {/* Create Admin Modal */}
        <CreateAdminModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={fetchAdmins}
        />

        {/* Edit Admin Modal */}
        <EditAdminModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          admin={selectedAdmin}
          currentUserId={user?.id || ''}
          onSuccess={fetchAdmins}
        />

        {/* Delete Admin Dialog */}
        <DeleteAdminDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          admin={selectedAdmin}
          currentUserId={user?.id || ''}
          onSuccess={fetchAdmins}
        />
      </div>
    </AppLayout>
  );
}
