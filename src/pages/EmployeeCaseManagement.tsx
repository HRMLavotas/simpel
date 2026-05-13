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
  FileText, Search, Plus, Trash2, Eye, ChevronLeft, ChevronRight, Settings, ShieldAlert,
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

  const loadCases = useCallback(async () => {
    console.log("🔄 Loading cases...");
    setIsLoading(true);
    try {
      const allCases = await getAllCases();
      console.log("📦 Cases loaded:", allCases);
      setCases(allCases);
      console.log("✅ Cases state updated, total:", allCases.length);
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
      const matchesStatus = caseStatusFilter === "all" || c.status === caseStatusFilter;
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 md:p-8 text-white shadow-xl mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Kasus Pegawai</h1>
                <p className="text-white/90 mt-2 text-sm md:text-base">Kelola kasus pegawai dan timeline tindak lanjutnya</p>
              </div>
            </div>
          </div>

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
