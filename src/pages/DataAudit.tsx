import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataAudit } from '@/hooks/useDataAudit';
import { type AuditEmployee, type AuditIssue, type AuditDepartment, type AuditDepartmentIssue } from '@/hooks/useDataAudit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, CheckCircle2, XCircle, Edit, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeFormModal, type EmployeeFormData } from '@/components/employees/EmployeeFormModal';
import { DepartmentFormModal } from '@/components/departments/DepartmentFormModal';
import { supabase } from '@/integrations/supabase/client';
import { fetchEmployeeById } from '@/lib/fetchEmployeeById';
import { saveEmployeeHistoryEntries } from '@/lib/saveEmployeeHistoryEntries';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DataAudit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminPusat } = useAuth();
  const { departments } = useDepartments();
  
  // State
  const [activeTab, setActiveTab] = useState<string>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<AuditDepartment | null>(null);
  const [isDeptEditModalOpen, setIsDeptEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook data
  const { data: auditResult, isLoading, error } = useDataAudit();
  const auditData = auditResult?.auditedData;
  const auditedDepartments = auditResult?.auditedDepartments;
  const totalEmployees = auditResult?.totalEmployees ?? 0;
  const totalDepartments = auditResult?.totalDepartments ?? 0;

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    if (!auditData) return [];
    
    let filtered = [...auditData];

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(d => d.department === departmentFilter);
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.nip && d.nip.includes(searchQuery)) ||
        d.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply issue filter
    if (filterIssue !== 'all') {
      filtered = filtered.filter(d => 
        d.issues.some((issue: AuditIssue) => issue.type === filterIssue)
      );
    }
    
    return filtered;
  }, [auditData, searchQuery, filterIssue, departmentFilter, isAdminPusat]);

  // Filter Departments
  const filteredDepartments = useMemo(() => {
    if (!auditedDepartments) return [];
    
    let filtered = [...auditedDepartments];

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(d => d.name === departmentFilter);
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [auditedDepartments, searchQuery, departmentFilter, isAdminPusat]);

  // Active dataset depending on activeTab
  const activeDataset = activeTab === 'employees' ? filteredEmployees : filteredDepartments;

  // Pagination
  const totalPages = Math.ceil(activeDataset.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDepartments.slice(startIndex, endIndex);
  }, [filteredDepartments, currentPage, itemsPerPage]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterIssue, departmentFilter, activeTab]);

  // Get unique employee issue types for filter
  const issueTypes = useMemo(() => {
    if (!auditData) return [];
    const types = new Set<string>();
    auditData.forEach(d => {
      d.issues.forEach((issue: AuditIssue) => types.add(issue.type));
    });
    return Array.from(types).sort();
  }, [auditData]);

  const getIssueBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'missing_field': 'bg-red-500',
      'invalid_format': 'bg-orange-500',
      'incomplete_data': 'bg-yellow-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };

  const getDeptIssueBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'missing_sarpras': 'bg-red-500',
      'missing_prasarana': 'bg-red-500',
      'missing_sarana': 'bg-orange-500',
      'missing_kejuruan': 'bg-yellow-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };

  const getIssueLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'missing_field': 'Data Kosong',
      'invalid_format': 'Format Salah',
      'incomplete_data': 'Data Tidak Lengkap',
    };
    return labelMap[type] || type;
  };

  const handleEditEmployee = async (employee: AuditEmployee) => {
    setLoadingEmployeeId(employee.id);
    try {
      const fullEmployee = await fetchEmployeeById(employee.id);
      setSelectedEmployee(fullEmployee);
      setIsEditModalOpen(true);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Gagal memuat data pegawai';
      toast({
        title: 'Gagal',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployeeId(null);
    }
  };

  const handleEditDept = (dept: AuditDepartment) => {
    setSelectedDept(dept);
    setIsDeptEditModalOpen(true);
  };

  const handleSubmitEdit = async (data: EmployeeFormData) => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const employeeId = selectedEmployee.id;

      // Simpan riwayat sebelum update pegawai (RLS mutation_history membutuhkan unit asal masih terlihat)
      await Promise.all([
        saveEmployeeHistoryEntries('mutation_history', employeeId, data.mutation_history, [
          'tanggal', 'dari_unit', 'ke_unit', 'jabatan', 'nomor_sk', 'keterangan',
        ]),
        saveEmployeeHistoryEntries('position_history', employeeId, data.position_history, [
          'tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan',
        ]),
        saveEmployeeHistoryEntries('rank_history', employeeId, data.rank_history, [
          'tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan',
        ]),
        saveEmployeeHistoryEntries('competency_test_history', employeeId, data.competency_test_history, [
          'tanggal', 'jenis_uji', 'hasil', 'keterangan',
        ]),
        saveEmployeeHistoryEntries('training_history', employeeId, data.training_history, [
          'tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan',
        ]),
        saveEmployeeHistoryEntries('additional_position_history', employeeId, data.additional_position_history, [
          'tanggal', 'jabatan_tambahan_lama', 'jabatan_tambahan_baru', 'nomor_sk', 'tmt', 'keterangan',
        ]),
      ]);

      const { error } = await supabase
        .from('employees')
        .update({
          nip: data.nip || null,
          name: data.name,
          front_title: data.front_title || null,
          back_title: data.back_title || null,
          birth_place: data.birth_place || null,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          religion: data.religion || null,
          position_type: data.position_type || null,
          position_name: data.position_name || null,
          additional_position: data.additional_position || null,
          kejuruan: data.kejuruan || null,
          asn_status: data.asn_status,
          rank_group: data.rank_group || null,
          department: data.department,
          join_date: data.join_date || null,
          tmt_cpns: data.tmt_cpns || null,
          tmt_pns: data.tmt_pns || null,
          tmt_pensiun: data.tmt_pensiun || null,
          tmt_gol: data.tmt_gol || null,
          phone: data.phone || null,
          mobile_phone: data.mobile_phone || null,
          address: data.address || null,
          satuan_kerja_penugasan: data.satuan_kerja_penugasan || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId);

      if (error) throw error;

      if (data.education_history) {
        await supabase.from('education_history').delete().eq('employee_id', employeeId);
        const eduRows = data.education_history
          .filter((e) => e.level)
          .map((e) => ({
            employee_id: employeeId,
            level: e.level,
            institution_name: e.institution_name || null,
            major: e.major || null,
            graduation_year: e.graduation_year ? parseInt(e.graduation_year, 10) : null,
            front_title: e.front_title || null,
            back_title: e.back_title || null,
          }));
        if (eduRows.length > 0) {
          const { error: eduError } = await supabase.from('education_history').insert(eduRows);
          if (eduError) throw eduError;
        }

        const latestEdu = [...data.education_history]
          .filter((e) => e.level)
          .sort((a, b) => {
            const yearA = a.graduation_year ? parseInt(a.graduation_year, 10) : 0;
            const yearB = b.graduation_year ? parseInt(b.graduation_year, 10) : 0;
            return yearB - yearA;
          })[0];

        if (latestEdu) {
          await supabase
            .from('employees')
            .update({
              education_level: latestEdu.level || null,
              education_major: latestEdu.major || null,
            })
            .eq('id', employeeId);
        }
      }

      if (data.placement_notes) {
        await supabase.from('placement_notes').delete().eq('employee_id', employeeId);
        const rows = data.placement_notes
          .filter((n) => n.note?.trim())
          .map((n) => ({ employee_id: employeeId, note: n.note }));
        if (rows.length > 0) {
          await supabase.from('placement_notes').insert(rows);
        }
      }

      if (data.assignment_notes) {
        await supabase.from('assignment_notes').delete().eq('employee_id', employeeId);
        const rows = data.assignment_notes
          .filter((n) => n.note?.trim())
          .map((n) => ({ employee_id: employeeId, note: n.note }));
        if (rows.length > 0) {
          await supabase.from('assignment_notes').insert(rows);
        }
      }

      if (data.change_notes) {
        await supabase.from('change_notes').delete().eq('employee_id', employeeId);
        const rows = data.change_notes
          .filter((n) => n.note?.trim())
          .map((n) => ({ employee_id: employeeId, note: n.note }));
        if (rows.length > 0) {
          await supabase.from('change_notes').insert(rows);
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Data pegawai berhasil diperbarui',
      });

      queryClient.invalidateQueries({ queryKey: ['data-audit'] });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui data';
      toast({
        title: 'Gagal',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={AlertTriangle}
          title="Audit Kelengkapan Data"
          description="Identifikasi dan perbaiki data pegawai serta profil sarana prasarana unit kerja yang tidak lengkap"
          gradient="orange"
        />

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard
              label="Pegawai Bermasalah"
              value={auditData?.length || 0}
              icon={AlertTriangle}
              color="red"
            />
            
            <StatCard
              label="Unit Bermasalah (Sarpras)"
              value={auditedDepartments?.length || 0}
              icon={Building}
              color="orange"
            />
            
            <StatCard
              label="Total Isu Audit"
              value={
                (auditData?.reduce((sum, d) => sum + d.issues.length, 0) || 0) +
                (auditedDepartments?.reduce((sum, d) => sum + d.issues.length, 0) || 0)
              }
              icon={XCircle}
              color="red"
            />
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              Pegawai ({auditData?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              Unit Kerja ({auditedDepartments?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Audit Data Pegawai */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Daftar Data Pegawai Bermasalah</CardTitle>
                      <CardDescription>
                        Perbaiki profil data, riwayat jabatan, mutasi, pendidikan, atau pangkat pegawai.
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama, NIP/NIK, atau unit kerja..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(isAdminPusat || departments.length > 1) && (
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Semua Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Unit</SelectItem>
                            {departments.filter(d => d !== 'Pusat').map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Select value={filterIssue} onValueChange={setFilterIssue}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Masalah</SelectItem>
                          {issueTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {getIssueLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {!isLoading && filteredEmployees.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} dari {filteredEmployees.length} pegawai bermasalah
                      </p>
                      {totalPages > 1 && (
                        <p className="text-sm text-muted-foreground">
                          Halaman {currentPage} dari {totalPages}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
                    <p className="text-muted-foreground">
                      {error instanceof Error ? error.message : 'Gagal memuat data audit'}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : paginatedEmployees.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{employee.name}</h3>
                            <Badge variant="outline">{employee.department}</Badge>
                            {employee.asn_status ? (
                              <Badge variant="secondary">{employee.asn_status}</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Status ASN kosong</Badge>
                            )}
                          </div>
                          {employee.nip && (
                            <p className="text-sm text-muted-foreground">
                              {employee.asn_status === 'Non ASN' ? 'NIK' : 'NIP'}: {employee.nip}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {employee.issues.map((issue: AuditIssue, idx: number) => (
                              <Badge 
                                key={idx} 
                                className={`${getIssueBadgeColor(issue.type)} text-white`}
                              >
                                {issue.message}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="ml-4"
                          disabled={loadingEmployeeId === employee.id}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {loadingEmployeeId === employee.id ? 'Memuat...' : 'Perbaiki'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-lg font-semibold mb-2">Tidak Ada Data Pegawai Bermasalah</p>
                    <p className="text-muted-foreground">
                      Semua data profil dan riwayat pegawai sudah lengkap dan sesuai format.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Audit Data Unit Kerja */}
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Daftar Profil Unit Kerja Bermasalah (Sarpras & Kejuruan)</CardTitle>
                      <CardDescription>
                        Daftar Balai Latihan, Satuan Pelayanan, atau Workshop yang belum melengkapi data Sarana, Prasarana, atau Kejuruan.
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama unit kerja..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {(isAdminPusat || departments.length > 1) && (
                      <div className="flex gap-2">
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Semua Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Unit</SelectItem>
                            {departments.filter(d => d !== 'Pusat').map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {!isLoading && filteredDepartments.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredDepartments.length)} dari {filteredDepartments.length} unit bermasalah
                      </p>
                      {totalPages > 1 && (
                        <p className="text-sm text-muted-foreground">
                          Halaman {currentPage} dari {totalPages}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
                    <p className="text-muted-foreground">
                      {error instanceof Error ? error.message : 'Gagal memuat data audit'}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : paginatedDepartments.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Building className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{dept.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {dept.issues.map((issue: AuditDepartmentIssue, idx: number) => (
                              <Badge 
                                key={idx} 
                                className={`${getDeptIssueBadgeColor(issue.type)} text-white`}
                              >
                                {issue.message}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditDept(dept)}
                          className="ml-4"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Lengkapi Profil
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-lg font-semibold mb-2">Semua Profil Unit Kerja Lengkap!</p>
                    <p className="text-muted-foreground">
                      Seluruh unit kerja/satuan pelayanan telah mengisi Sarana, Prasarana, dan Kejuruan Pelatihan.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, activeDataset.length)} dari {activeDataset.length} hasil
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === 1 || 
                           page === totalPages || 
                           (page >= currentPage - 1 && page <= currentPage + 1);
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EmployeeFormModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onSubmit={handleSubmitEdit}
          isLoading={isSubmitting}
        />
      )}

      {/* Edit Department Modal */}
      {selectedDept && (
        <DepartmentFormModal
          open={isDeptEditModalOpen}
          onOpenChange={setIsDeptEditModalOpen}
          department={{
            id: selectedDept.id,
            name: selectedDept.name,
            sarpras: selectedDept.sarpras ?? undefined,
            created_at: new Date().toISOString()
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['data-audit'] });
            setIsDeptEditModalOpen(false);
            setSelectedDept(null);
          }}
        />
      )}
    </AppLayout>
  );
}
