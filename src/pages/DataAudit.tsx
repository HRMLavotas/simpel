import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataAudit } from '@/hooks/useDataAudit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, Filter, CheckCircle2, XCircle, Edit } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function DataAudit() {
  const { isAdminPusat } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: auditData, isLoading, error } = useDataAudit();

  // Filter data berdasarkan pencarian dan filter
  const filteredData = useMemo(() => {
    if (!auditData) return [];
    
    let filtered = [...auditData];
    
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
        d.issues.some((issue: any) => issue.type === filterIssue)
      );
    }
    
    return filtered;
  }, [auditData, searchQuery, filterIssue]);

  // Get unique issue types for filter
  const issueTypes = useMemo(() => {
    if (!auditData) return [];
    const types = new Set<string>();
    auditData.forEach(d => {
      d.issues.forEach((issue: any) => types.add(issue.type));
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

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (data: any) => {
    if (!selectedEmployee) return;
    
    setIsSubmitting(true);
    try {
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
          asn_status: data.asn_status,
          rank_group: data.rank_group || null,
          department: data.department,
          join_date: data.join_date || null,
          tmt_cpns: data.tmt_cpns || null,
          tmt_pns: data.tmt_pns || null,
          tmt_pensiun: data.tmt_pensiun || null,
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
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat memperbarui data',
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
                  {auditData && auditData.length > 0 
                    ? Math.round((1 - auditData.length / 100) * 100) 
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
              
              {/* Results count */}
              {!isLoading && filteredData.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Menampilkan {filteredData.length} dari {auditData?.length || 0} data bermasalah
                </p>
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
            ) : filteredData && filteredData.length > 0 ? (
              <div className="space-y-3">
                {filteredData.map((employee) => (
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
                        {employee.issues.map((issue: any, idx: number) => (
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
