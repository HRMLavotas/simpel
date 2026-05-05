import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataAudit } from '@/hooks/useDataAudit';
import { type AuditEmployee, type AuditIssue } from '@/hooks/useDataAudit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, CheckCircle2, XCircle, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';

export default function DataAudit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminPusat } = useAuth();
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<AuditEmployee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const itemsPerPage = 10;

  const { data: auditResult, isLoading, error } = useDataAudit();
  const auditData = auditResult?.auditedData;
  const totalEmployees = auditResult?.totalEmployees ?? 0;

  // Filter data berdasarkan pencarian dan filter
  const filteredData = useMemo(() => {
    if (!auditData) return [];
    
    let filtered = [...auditData];

    // Filter by department (admin pusat only)
    if (isAdminPusat && departmentFilter !== 'all') {
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

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterIssue, departmentFilter]);

  // Get unique issue types for filter
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

  const getIssueLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'missing_field': 'Data Kosong',
      'invalid_format': 'Format Salah',
      'incomplete_data': 'Data Tidak Lengkap',
    };
    return labelMap[type] || type;
  };

  const handleEditEmployee = (employee: AuditEmployee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (data: Record<string, unknown>) => {
    if (!selectedEmployee) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          nip: (data.nip as string) || null,
          name: data.name as string,
          front_title: (data.front_title as string) || null,
          back_title: (data.back_title as string) || null,
          birth_place: (data.birth_place as string) || null,
          birth_date: (data.birth_date as string) || null,
          gender: (data.gender as string) || null,
          religion: (data.religion as string) || null,
          position_type: (data.position_type as string) || null,
          position_name: (data.position_name as string) || null,
          additional_position: (data.additional_position as string) || null,
          kejuruan: (data.kejuruan as string) || null,
          asn_status: data.asn_status as string,
          rank_group: (data.rank_group as string) || null,
          department: data.department as string,
          join_date: (data.join_date as string) || null,
          tmt_cpns: (data.tmt_cpns as string) || null,
          tmt_pns: (data.tmt_pns as string) || null,
          tmt_pensiun: (data.tmt_pensiun as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

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
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Data Pegawai</h1>
            <p className="text-muted-foreground">
              Identifikasi dan perbaiki data pegawai yang tidak lengkap atau tidak sesuai format
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Data Bermasalah
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {auditData?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  pegawai perlu diperbaiki
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  Total Masalah
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {auditData?.reduce((sum, d) => sum + d.issues.length, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  masalah terdeteksi
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tingkat Kelengkapan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalEmployees > 0
                    ? Math.round(((totalEmployees - (auditData?.length || 0)) / totalEmployees) * 100)
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">
                  data lengkap
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audit List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daftar Data Bermasalah</CardTitle>
                  <CardDescription>
                    Klik tombol edit untuk memperbaiki data pegawai
                  </CardDescription>
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, NIP, atau unit kerja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {isAdminPusat && (
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[200px]">
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
                  <SelectTrigger className="w-[200px]">
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
              
              {/* Results count and pagination info */}
              {!isLoading && filteredData.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data bermasalah
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
            ) : paginatedData && paginatedData.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedData.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{employee.name}</h3>
                        <Badge variant="outline">{employee.department}</Badge>
                      </div>
                      {employee.nip && (
                        <p className="text-sm text-muted-foreground">NIP: {employee.nip}</p>
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
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Perbaiki
                    </Button>
                  </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} hasil
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
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Tidak Ada Data Bermasalah</p>
                <p className="text-muted-foreground">
                  {searchQuery || filterIssue !== 'all' 
                    ? 'Tidak ada data yang sesuai dengan filter'
                    : 'Semua data pegawai sudah lengkap dan sesuai format'}
                </p>
                {(searchQuery || filterIssue !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterIssue('all');
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {selectedEmployee && (
        <EmployeeFormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          employee={selectedEmployee}
          onSubmit={handleSubmitEdit}
          isLoading={isSubmitting}
        />
      )}
    </AppLayout>
  );
}
