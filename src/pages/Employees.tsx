import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { ChangeLogDialog, type DetectedChange } from '@/components/employees/ChangeLogDialog';
import { type EducationEntry } from '@/components/employees/EducationHistoryForm';
import { type HistoryEntry } from '@/components/employees/EmployeeHistoryForm';
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
  keterangan_formasi: string | null;
  keterangan_penempatan: string | null;
  keterangan_penugasan: string | null;
  keterangan_perubahan: string | null;
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

/** Detect meaningful field changes between old employee and new form data */
function detectChanges(oldEmp: Employee, newData: EmployeeFormData): DetectedChange[] {
  const changes: DetectedChange[] = [];
  const norm = (v: string | null | undefined) => (v || '').trim();

  if (norm(oldEmp.rank_group) !== norm(newData.rank_group)) {
    changes.push({
      field: 'rank_group', label: 'Pangkat/Golongan',
      oldValue: norm(oldEmp.rank_group), newValue: norm(newData.rank_group),
      historyType: 'rank',
    });
  }
  if (norm(oldEmp.position_name) !== norm(newData.position_name)) {
    changes.push({
      field: 'position_name', label: 'Nama Jabatan',
      oldValue: norm(oldEmp.position_name), newValue: norm(newData.position_name),
      historyType: 'position',
    });
  }
  if (norm(oldEmp.position_type) !== norm(newData.position_type)) {
    changes.push({
      field: 'position_type', label: 'Jenis Jabatan',
      oldValue: norm(oldEmp.position_type), newValue: norm(newData.position_type),
      historyType: 'position',
    });
  }
  if (norm(oldEmp.department) !== norm(newData.department)) {
    changes.push({
      field: 'department', label: 'Unit Kerja (Mutasi)',
      oldValue: norm(oldEmp.department), newValue: norm(newData.department),
      historyType: 'mutation',
    });
  }
  if (norm(oldEmp.front_title) !== norm(newData.front_title)) {
    changes.push({
      field: 'front_title', label: 'Gelar Depan',
      oldValue: norm(oldEmp.front_title), newValue: norm(newData.front_title),
      historyType: 'title',
    });
  }
  if (norm(oldEmp.back_title) !== norm(newData.back_title)) {
    changes.push({
      field: 'back_title', label: 'Gelar Belakang',
      oldValue: norm(oldEmp.back_title), newValue: norm(newData.back_title),
      historyType: 'title',
    });
  }
  if (norm(oldEmp.asn_status) !== norm(newData.asn_status)) {
    changes.push({
      field: 'asn_status', label: 'Status ASN',
      oldValue: norm(oldEmp.asn_status), newValue: norm(newData.asn_status),
      historyType: 'general',
    });
  }

  return changes;
}

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
  const [selectedMutationHistory, setSelectedMutationHistory] = useState<HistoryEntry[]>([]);
  const [selectedPositionHistory, setSelectedPositionHistory] = useState<HistoryEntry[]>([]);
  const [selectedRankHistory, setSelectedRankHistory] = useState<HistoryEntry[]>([]);
  const [selectedCompetencyHistory, setSelectedCompetencyHistory] = useState<HistoryEntry[]>([]);
  const [selectedTrainingHistory, setSelectedTrainingHistory] = useState<HistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change log dialog state
  const [changeLogOpen, setChangeLogOpen] = useState(false);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [pendingFormData, setPendingFormData] = useState<EmployeeFormData | null>(null);

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
    setSelectedMutationHistory([]);
    setSelectedPositionHistory([]);
    setSelectedRankHistory([]);
    setSelectedCompetencyHistory([]);
    setSelectedTrainingHistory([]);
    setFormModalOpen(true);
  };

  const mapHistoryRows = (data: any[], fields: string[]): HistoryEntry[] => {
    return (data || []).map((d: any) => {
      const entry: HistoryEntry = { id: d.id };
      fields.forEach(f => { entry[f] = d[f]?.toString() || ''; });
      return entry;
    });
  };

  const handleEditEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    
    const [eduRes, mutRes, posRes, rankRes, compRes, trainRes] = await Promise.all([
      supabase.from('education_history').select('*').eq('employee_id', employee.id).order('graduation_year', { ascending: true }),
      supabase.from('mutation_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true }),
      supabase.from('position_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true }),
      supabase.from('rank_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true }),
      supabase.from('competency_test_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true }),
      supabase.from('training_history').select('*').eq('employee_id', employee.id).order('tanggal_mulai', { ascending: true }),
    ]);

    setSelectedEducation(
      (eduRes.data || []).map((d: any) => ({
        id: d.id, level: d.level || '', institution_name: d.institution_name || '',
        major: d.major || '', graduation_year: d.graduation_year?.toString() || '',
        front_title: d.front_title || '', back_title: d.back_title || '',
      }))
    );
    setSelectedMutationHistory(mapHistoryRows(mutRes.data || [], ['tanggal', 'dari_unit', 'ke_unit', 'nomor_sk', 'keterangan']));
    setSelectedPositionHistory(mapHistoryRows(posRes.data || [], ['tanggal', 'jabatan_lama', 'jabatan_baru', 'nomor_sk', 'keterangan']));
    setSelectedRankHistory(mapHistoryRows(rankRes.data || [], ['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']));
    setSelectedCompetencyHistory(mapHistoryRows(compRes.data || [], ['tanggal', 'jenis_uji', 'hasil', 'keterangan']));
    setSelectedTrainingHistory(mapHistoryRows(trainRes.data || [], ['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']));
    
    setFormModalOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const saveHistoryEntries = async (
    tableName: string,
    employeeId: string,
    entries: HistoryEntry[] | undefined,
    fieldKeys: string[]
  ) => {
    if (!entries) return;
    await supabase.from(tableName as any).delete().eq('employee_id', employeeId);
    const rows = entries
      .filter(e => fieldKeys.some(k => e[k]))
      .map(e => {
        const row: any = { employee_id: employeeId };
        fieldKeys.forEach(k => {
          row[k] = e[k] || null;
        });
        return row;
      });
    if (rows.length > 0) {
      await supabase.from(tableName as any).insert(rows);
    }
  };

  /** Auto-create history records based on detected changes */
  const createAutoHistoryRecords = async (
    employeeId: string,
    changes: DetectedChange[],
    notes: string,
    link: string,
    effectiveDate: string
  ) => {
    const keterangan = [notes, link].filter(Boolean).join('\nLampiran: ');

    for (const change of changes) {
      switch (change.historyType) {
        case 'rank':
          await supabase.from('rank_history').insert({
            employee_id: employeeId,
            tanggal: effectiveDate,
            pangkat_lama: change.oldValue || null,
            pangkat_baru: change.newValue || null,
            keterangan: keterangan || null,
            tmt: effectiveDate,
          });
          break;

        case 'position':
          if (change.field === 'position_name') {
            await supabase.from('position_history').insert({
              employee_id: employeeId,
              tanggal: effectiveDate,
              jabatan_lama: change.oldValue || null,
              jabatan_baru: change.newValue || null,
              keterangan: keterangan || null,
            });
          }
          break;

        case 'mutation':
          await supabase.from('mutation_history').insert({
            employee_id: employeeId,
            tanggal: effectiveDate,
            dari_unit: change.oldValue || null,
            ke_unit: change.newValue || null,
            keterangan: keterangan || null,
          });
          break;
      }
    }
  };

  /** Core save logic shared by both "with notes" and "without notes" paths */
  const executeSave = async (data: EmployeeFormData, changes: DetectedChange[], notes: string, link: string, effectiveDate: string) => {
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
        keterangan_formasi: data.keterangan_formasi || null,
        keterangan_penempatan: data.keterangan_penempatan || null,
        keterangan_penugasan: data.keterangan_penugasan || null,
        keterangan_perubahan: data.keterangan_perubahan || null,
      };

      let employeeId: string;

      if (selectedEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', selectedEmployee.id);
        if (error) throw error;
        employeeId = selectedEmployee.id;

        // Auto-create history records for detected changes
        if (changes.length > 0) {
          await createAutoHistoryRecords(employeeId, changes, notes, link, effectiveDate);
        }

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
        await supabase.from('education_history').delete().eq('employee_id', employeeId);
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
          await supabase.from('education_history').insert(eduRows);
        }
      }

      // Save all other history types (manual entries from form)
      await Promise.all([
        saveHistoryEntries('mutation_history', employeeId, data.mutation_history, ['tanggal', 'dari_unit', 'ke_unit', 'nomor_sk', 'keterangan']),
        saveHistoryEntries('position_history', employeeId, data.position_history, ['tanggal', 'jabatan_lama', 'jabatan_baru', 'nomor_sk', 'keterangan']),
        saveHistoryEntries('rank_history', employeeId, data.rank_history, ['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']),
        saveHistoryEntries('competency_test_history', employeeId, data.competency_test_history, ['tanggal', 'jenis_uji', 'hasil', 'keterangan']),
        saveHistoryEntries('training_history', employeeId, data.training_history, ['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']),
      ]);

      setFormModalOpen(false);
      setChangeLogOpen(false);
      setPendingFormData(null);
      setDetectedChanges([]);
      fetchEmployees();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Gagal menyimpan data pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: EmployeeFormData) => {
    // If editing, detect changes and show dialog
    if (selectedEmployee) {
      const changes = detectChanges(selectedEmployee, data);
      if (changes.length > 0) {
        setDetectedChanges(changes);
        setPendingFormData(data);
        setFormModalOpen(false);
        setChangeLogOpen(true);
        return;
      }
    }

    // No tracked changes or new employee — save directly
    await executeSave(data, [], '', '', new Date().toISOString().split('T')[0]);
  };

  const handleChangeLogConfirm = async (notes: string, link: string, date: string) => {
    if (!pendingFormData) return;
    await executeSave(pendingFormData, detectedChanges, notes, link, date);
  };

  const handleChangeLogSkip = async () => {
    if (!pendingFormData) return;
    await executeSave(pendingFormData, detectedChanges, '', '', new Date().toISOString().split('T')[0]);
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
    const headers = ['NIP', 'Gelar Depan', 'Nama', 'Gelar Belakang', 'Jenis Jabatan', 'Nama Jabatan', 'Status ASN', 'Golongan', 'Unit Kerja', 'Tanggal Masuk', 'Ket. Formasi', 'Ket. Penempatan', 'Ket. Penugasan', 'Ket. Perubahan'];
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => [
        emp.nip || '', emp.front_title || '', `"${emp.name}"`, emp.back_title || '',
        emp.position_type || '', `"${emp.position_name || ''}"`, emp.asn_status || '',
        emp.rank_group || '', `"${emp.department}"`, emp.join_date || '',
        `"${emp.keterangan_formasi || ''}"`, `"${emp.keterangan_penempatan || ''}"`,
        `"${emp.keterangan_penugasan || ''}"`, `"${emp.keterangan_perubahan || ''}"`,
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
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={handleExport} disabled={filteredEmployees.length === 0} className="text-xs sm:text-sm">
              <Download className="mr-1 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
            </Button>
            <Button onClick={handleAddEmployee} className="text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Tambah Pegawai</span><span className="sm:hidden">Tambah</span>
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

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
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
          </div>

          {!isLoading && filteredEmployees.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t px-4 py-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} dari {filteredEmployees.length} data
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
        initialMutationHistory={selectedMutationHistory}
        initialPositionHistory={selectedPositionHistory}
        initialRankHistory={selectedRankHistory}
        initialCompetencyTestHistory={selectedCompetencyHistory}
        initialTrainingHistory={selectedTrainingHistory}
      />

      <ChangeLogDialog
        open={changeLogOpen}
        onOpenChange={(open) => {
          setChangeLogOpen(open);
          if (!open) {
            // If user closes dialog, reopen form so they don't lose data
            setFormModalOpen(true);
          }
        }}
        changes={detectedChanges}
        employeeName={selectedEmployee ? formatDisplayName(selectedEmployee) : ''}
        onConfirm={handleChangeLogConfirm}
        onSkip={handleChangeLogSkip}
        isLoading={isSubmitting}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
        employeeName={selectedEmployee ? formatDisplayName(selectedEmployee) : ''}
        department={selectedEmployee?.department || ''}
      />
    </AppLayout>
  );
}
