import { formatDateID, formatDateShortID } from "@/lib/date-utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText, Search, Plus, Trash2, Eye, ChevronLeft, ChevronRight, Settings, ShieldAlert, Clock, CheckCircle, BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCaseAccess } from "@/hooks/useCaseAccess";
import { useCaseMenuAccess } from "@/hooks/useCaseMenuAccess";
import { TableSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";
import { getAllCases, deleteCase } from "@/lib/employeeCaseStorage";
import {
  CASE_TYPE_LABELS, CASE_STATUS_LABELS, EmployeeCase, CaseStatus, getCaseTypeLabel,
} from "@/lib/employeeCaseTypes";
import CaseFormDialog from "@/components/cases/CaseFormDialog";
import CaseAccessManagement from "@/components/cases/CaseAccessManagement";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

const PAGE_SIZE = 20;

export default function EmployeeCaseManagement() {
  const { user, role } = useAuth();
  const { canEdit } = useCaseAccess();
  const { hasAccess: hasCaseMenuAccess, isLoading: isCheckingAccess } = useCaseMenuAccess();
  const navigate = useNavigate();
  
  // All hooks must be called before any conditional returns
  const [cases, setCases] = useState<EmployeeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<EmployeeCase | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("cases");
  const [accessChanged, setAccessChanged] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    diproses: 0,
    selesai: 0,
    byType: {} as Record<string, number>,
  });

  const loadCases = useCallback(async () => {
    console.log("🔄 Loading cases...");
    setIsLoading(true);
    try {
      const allCases = await getAllCases();
      console.log("📦 Cases loaded:", allCases);
      setCases(allCases);
      console.log("✅ Cases state updated, total:", allCases.length);
      
      // Calculate statistics
      const stats = {
        total: allCases.length,
        diproses: allCases.filter(c => c.status === 'diproses').length,
        selesai: allCases.filter(c => c.status === 'selesai').length,
        byType: {} as Record<string, number>,
      };
      
      // Count by case type
      allCases.forEach(c => {
        stats.byType[c.caseType] = (stats.byType[c.caseType] || 0) + 1;
      });
      
      setStatistics(stats);
    } catch (error) {
      console.error("❌ Error loading cases:", error);
      toast.error("Gagal memuat data kasus");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      // Load from employees table (ASN)
      const { data: asnData, error: asnError } = await supabase
        .from("employees")
        .select("id, nip, name, position_name, department")
        .order("name");
      
      if (asnError) throw asnError;
      
      // Map to consistent format
      const mappedEmployees = (asnData || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        nip: emp.nip || '-',
        jabatan: emp.position_name || '-',
        department: emp.department || '-',
      }));
      
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }, []);

  const debouncedSearch = useDebounce(searchQuery, 250);
  
  const filteredCases = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return cases.filter((c) => {
      const matchesSearch =
        !q ||
        c.employeeName.toLowerCase().includes(q) ||
        c.employeeNip.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      const matchesType = caseTypeFilter === "all" || c.caseType === caseTypeFilter;
      
      // Handle special "dengan_hukuman" filter
      let matchesStatus = true;
      if (caseStatusFilter === "dengan_hukuman") {
        // Only show cases that have disciplinary actions
        matchesStatus = c.hasDisciplinaryAction === true;
      } else {
        matchesStatus = caseStatusFilter === "all" || c.status === caseStatusFilter;
      }
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [cases, debouncedSearch, caseTypeFilter, caseStatusFilter]);

  const totalPages = Math.ceil(filteredCases.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedCases = filteredCases.slice(start, end);

  const handleDeleteCase = useCallback(async () => {
    if (!caseToDelete) return;
    await deleteCase(caseToDelete.id);
    toast.success("Kasus berhasil dihapus");
    setCaseToDelete(null);
    loadCases();
  }, [caseToDelete, loadCases]);

  const handleNewCaseCreated = useCallback(() => {
    loadCases();
    setShowNewCaseDialog(false);
  }, [loadCases]);

  const getStatusColor = useCallback((status: CaseStatus) => {
    const colors: Record<CaseStatus, string> = {
      baru: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      diproses: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      tertunda: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      selesai: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      ditutup: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[status];
  }, []);

  const isAdminPusat = role === "admin_pusat";

  useEffect(() => {
    if (hasCaseMenuAccess) {
      loadCases();
      loadEmployees();
    }
  }, [hasCaseMenuAccess, loadCases, loadEmployees]);

  // Check access and redirect if no access
  useEffect(() => {
    if (!isCheckingAccess && !hasCaseMenuAccess) {
      toast.error("Anda tidak memiliki akses ke menu Kasus Pegawai");
      navigate("/dashboard");
    }
  }, [hasCaseMenuAccess, isCheckingAccess, navigate]);

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <TableSkeleton rows={5} />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show access denied if no access
  if (!hasCaseMenuAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="border-destructive/50">
              <CardContent className="p-8 text-center">
                <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
                <p className="text-muted-foreground mb-6">
                  Anda tidak memiliki akses ke menu Kasus Pegawai. Silakan hubungi administrator untuk mendapatkan akses.
                </p>
                <Button onClick={() => navigate("/dashboard")}>
                  Kembali ke Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon={FileText}
            title="Kasus Pegawai"
            description="Kelola kasus pegawai dan timeline tindak lanjutnya"
            gradient="blue"
          />

          {/* Statistics Cards - Above Tabs */}
          <div className="space-y-4 mb-6">
            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Kasus"
                value={statistics.total}
                icon={FileText}
                color="blue"
              />
              
              <StatCard
                label="Diproses"
                value={statistics.diproses}
                icon={Clock}
                color="yellow"
              />
              
              <StatCard
                label="Selesai"
                value={statistics.selesai}
                icon={CheckCircle}
                color="green"
              />
              
              <StatCard
                label="Dengan Hukuman"
                value={cases.filter(c => c.hasDisciplinaryAction).length}
                icon={ShieldAlert}
                color="red"
              />
            </div>

              {/* Statistics by Case Type - Compact 2 Column Layout */}
              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Statistik Berdasarkan Jenis Kasus
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(CASE_TYPE_LABELS).map(([type, label]) => {
                      const count = statistics.byType[type] || 0;
                      const percentage = statistics.total > 0 ? ((count / statistics.total) * 100) : 0;
                      
                      // Color scheme for each type
                      const colors: Record<string, { bg: string; bar: string; text: string }> = {
                        perceraian: { bg: 'bg-purple-50 dark:bg-purple-950/30', bar: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
                        hutang: { bg: 'bg-orange-50 dark:bg-orange-950/30', bar: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
                        pinjaman_online: { bg: 'bg-pink-50 dark:bg-pink-950/30', bar: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300' },
                        presensi: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', bar: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
                        pengunduran_diri: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', bar: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
                        temuan: { bg: 'bg-amber-50 dark:bg-amber-950/30', bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
                        lainnya: { bg: 'bg-gray-50 dark:bg-gray-950/30', bar: 'bg-gray-500', text: 'text-gray-700 dark:text-gray-300' },
                      };
                      
                      const color = colors[type] || colors.lainnya;
                      
                      return (
                        <div key={type} className={`p-3 rounded-lg ${color.bg} transition-all hover:shadow-sm`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-xs">{label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-lg font-bold ${color.text}`}>{count}</span>
                              <span className="text-xs text-muted-foreground">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full ${color.bar} transition-all duration-500 ease-out rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className={`grid w-full ${isAdminPusat ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="cases" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Daftar Kasus
                </TabsTrigger>
                {isAdminPusat && (
                  <TabsTrigger value="access" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Pengaturan Akses
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="cases" className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama, NIP, atau deskripsi..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10" />
                </div>
                <Select value={caseTypeFilter} onValueChange={(val) => { setCaseTypeFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Semua Jenis Kasus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis Kasus</SelectItem>
                    {Object.entries(CASE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={caseStatusFilter} onValueChange={(val) => { setCaseStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {Object.entries(CASE_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                    <SelectItem value="dengan_hukuman">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                        Dengan Hukuman Disiplin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button onClick={() => setShowNewCaseDialog(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kasus
                  </Button>
                )}
              </div>

              <Card className="border-primary/10 shadow-lg">
                <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle>Daftar Kasus</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <TableSkeleton rows={10} />
                  ) : filteredCases.length === 0 ? (
                    <div className="p-8">
                      {searchQuery || caseTypeFilter !== "all" || caseStatusFilter !== "all" ? (
                        <SearchState />
                      ) : (
                        <NoDataState message="Tidak ada kasus. Mulai dengan menambahkan kasus baru." />
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Nama Pegawai</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Jenis Kasus</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal Laporan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCases.map((employeeCase) => (
                            <TableRow key={employeeCase.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{employeeCase.employeeName}</TableCell>
                              <TableCell>{employeeCase.employeeNip}</TableCell>
                              <TableCell><Badge variant="outline">{getCaseTypeLabel(employeeCase.caseType)}</Badge></TableCell>
                              <TableCell><Badge className={getStatusColor(employeeCase.status)}>{CASE_STATUS_LABELS[employeeCase.status]}</Badge></TableCell>
                              <TableCell>{formatDateShortID(employeeCase.reportDate)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/kasus-pegawai/${employeeCase.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                    {canEdit && (
                                      <Button variant="ghost" size="sm" onClick={() => setCaseToDelete(employeeCase)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {start + 1} hingga {Math.min(end, filteredCases.length)} dari {filteredCases.length} kasus
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>{page}</Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {isAdminPusat && (
              <TabsContent value="access" className="space-y-6">
                <CaseAccessManagement onAccessChange={() => setAccessChanged(!accessChanged)} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <AlertDialog open={!!caseToDelete} onOpenChange={(open) => !open && setCaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kasus?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus kasus untuk {caseToDelete?.employeeName}. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCase} className="bg-destructive">Hapus</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {showNewCaseDialog && (
        <CaseFormDialog employees={employees} onClose={() => setShowNewCaseDialog(false)} onCaseCreated={handleNewCaseCreated} />
      )}
    </DashboardLayout>
  );
}
