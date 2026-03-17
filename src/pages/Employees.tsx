import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeFormModal, type EmployeeFormData } from '@/components/employees/EmployeeFormModal';
import { DeleteConfirmDialog } from '@/components/employees/DeleteConfirmDialog';
import { type EducationEntry } from '@/components/employees/EducationHistoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, ASN_STATUS_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Employee {
  id: string;
  nip: string | null;
  name: string;
  front_title: string | null;
  back_title: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  old_position: string | null;
  position_type: string | null;
  position_name: string | null;
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 20;

const formatDisplayName = (emp: Employee) => {
  const parts: string[] = [];
  if (emp.front_title) parts.push(emp.front_title);
  parts.push(emp.name);
  if (emp.back_title) parts.push(emp.back_title);
  return parts.join(' ');
};

export default function Employees() {
  const { profile, isAdminPusat, user } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<EducationEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [profile, isAdminPusat]);

  const fetchEmployees = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data pegawai' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const displayName = formatDisplayName(emp).toLowerCase();
      const matchesSearch = 
        displayName.includes(searchQuery.toLowerCase()) ||
        (emp.nip && emp.nip.includes(searchQuery)) ||
        (emp.position_name && emp.position_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || emp.asn_status === statusFilter;
      const matchesDepartment = !isAdminPusat || departmentFilter === 'all' || emp.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter, isAdminPusat]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, departmentFilter]);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setSelectedEducation([]);
    setFormModalOpen(true);
  };

  const handleEditEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    // Fetch education history
    const { data } = await supabase
      .from('education_history')
      .select('*')
      .eq('employee_id', employee.id)
      .order('graduation_year', { ascending: true });
    
    setSelectedEducation(
      (data || []).map((d: any) => ({
        id: d.id,
        level: d.level || '',
        institution_name: d.institution_name || '',
        major: d.major || '',
        graduation_year: d.graduation_year?.toString() || '',
        front_title: d.front_title || '',
        back_title: d.back_title || '',
      }))
    );
    setFormModalOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: EmployeeFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const employeeData = {
        nip: data.nip || null,
        name: data.name,
        front_title: data.front_title || null,
        back_title: data.back_title || null,
        birth_place: data.birth_place || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        religion: data.religion || null,
        old_position: data.old_position || null,
        position_type: data.position_type || null,
        position_name: data.position_name || null,
        asn_status: data.asn_status,
        rank_group: data.rank_group || null,
        department: data.department,
        join_date: data.join_date || null,
        tmt_cpns: data.tmt_cpns || null,
        tmt_pns: data.tmt_pns || null,
        tmt_pensiun: data.tmt_pensiun || null,
      };

      let employeeId: string;

      if (selectedEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', selectedEmployee.id);
        if (error) throw error;
        employeeId = selectedEmployee.id;
        toast({ title: 'Berhasil', description: 'Data pegawai berhasil diperbarui' });
      } else {
        const { data: inserted, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select('id')
          .single();
        if (error) {
          if (error.code === '23505') throw new Error('NIP sudah terdaftar dalam database');
          throw error;
        }
        employeeId = inserted.id;
        toast({ title: 'Berhasil', description: 'Pegawai baru berhasil ditambahkan' });
      }

      // Handle education history
      if (data.education_history) {
        // Delete existing education for this employee
        await supabase.from('education_history').delete().eq('employee_id', employeeId);
        
        // Insert new entries
        if (data.education_history.length > 0) {
          const eduRows = data.education_history
            .filter(e => e.level)
            .map(e => ({
              employee_id: employeeId,
              level: e.level,
              institution_name: e.institution_name || null,
              major: e.major || null,
              graduation_year: e.graduation_year ? parseInt(e.graduation_year) : null,
              front_title: e.front_title || null,
              back_title: e.back_title || null,
            }));
          
          if (eduRows.length > 0) {
            const { error: eduError } = await supabase
              .from('education_history')
              .insert(eduRows);
            if (eduError) console.error('Error saving education:', eduError);
          }
        }
      }

      setFormModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Gagal menyimpan data pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('id', selectedEmployee.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data pegawai berhasil dihapus' });
      setDeleteDialogOpen(false);
      fetchEmployees();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Gagal menghapus data pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ['NIP', 'Gelar Depan', 'Nama', 'Gelar Belakang', 'Jenis Jabatan', 'Nama Jabatan', 'Status ASN', 'Golongan', 'Unit Kerja', 'Tanggal Masuk'];
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => [
        emp.nip || '', emp.front_title || '', `"${emp.name}"`, emp.back_title || '',
        emp.position_type || '', `"${emp.position_name || ''}"`, emp.asn_status || '',
        emp.rank_group || '', `"${emp.department}"`, emp.join_date || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data-pegawai-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PNS': return <Badge className="badge-pns">PNS</Badge>;
      case 'PPPK': return <Badge className="badge-pppk">PPPK</Badge>;
      case 'Non ASN': return <Badge className="badge-nonasn">Non ASN</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Data Pegawai</h1>
            <p className="page-description">
              Kelola data nominatif pegawai {!isAdminPusat && profile?.department}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={filteredEmployees.length === 0}>
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
            <Button onClick={handleAddEmployee}>
              <Plus className="mr-2 h-4 w-4" />Tambah Pegawai
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama, NIP, atau jabatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status ASN" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {ASN_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdminPusat && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Unit Kerja" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {DEPARTMENTS.filter(d => d !== 'Pusat').map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                <TableHead>Status ASN</TableHead>
                <TableHead className="hidden lg:table-cell">Golongan</TableHead>
                {isAdminPusat && <TableHead className="hidden xl:table-cell">Unit Kerja</TableHead>}
                <TableHead className="hidden lg:table-cell">Tanggal Masuk</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    {isAdminPusat && <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>}
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminPusat ? 8 : 7} className="h-32 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Tidak ada data yang sesuai dengan filter'
                      : 'Belum ada data pegawai'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} className="animate-fade-in">
                    <TableCell className="font-mono text-sm">{employee.nip || '-'}</TableCell>
                    <TableCell className="font-medium">{formatDisplayName(employee)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{employee.position_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(employee.asn_status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{employee.rank_group || '-'}</TableCell>
                    {isAdminPusat && <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{employee.department}</TableCell>}
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {employee.join_date ? format(new Date(employee.join_date), 'd MMM yyyy', { locale: id }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditEmployee(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(employee)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && filteredEmployees.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} dari {filteredEmployees.length} data
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        initialEducation={selectedEducation}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employeeName={selectedEmployee?.name || ''}
        department={selectedEmployee?.department || ''}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </AppLayout>
  );
}
