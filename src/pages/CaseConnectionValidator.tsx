/**
 * Case Connection Validator Page
 * Admin utility to validate and fix employee case connections
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  validateCaseEmployeeConnections,
  fixDisconnectedCases,
  getCaseEmployeeConnectionReport,
  type ConnectionValidationResult,
} from "@/lib/validateCaseEmployeeConnection";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, FileText, Users, Link, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function CaseConnectionValidator() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResult, setValidationResult] = useState<ConnectionValidationResult | null>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const [detailedReport, setDetailedReport] = useState<any>(null);

  const isAdminPusat = role === "admin_pusat";

  // Only admin_pusat can access this page
  if (!isAdminPusat) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Halaman ini hanya dapat diakses oleh Admin Pusat.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleValidate = async () => {
    setIsValidating(true);
    setFixResult(null);
    try {
      const result = await validateCaseEmployeeConnections();
      setValidationResult(result);
      
      if (result.disconnectedCases === 0) {
        toast.success("Semua kasus terhubung dengan benar!");
      } else {
        toast.warning(`Ditemukan ${result.disconnectedCases} kasus yang tidak terhubung`);
      }
    } catch (error) {
      console.error("Error validating:", error);
      toast.error("Gagal memvalidasi koneksi");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFix = async () => {
    if (!validationResult || validationResult.disconnectedCases === 0) {
      toast.info("Tidak ada kasus yang perlu diperbaiki");
      return;
    }

    setIsFixing(true);
    try {
      const result = await fixDisconnectedCases();
      setFixResult(result);
      
      if (result.fixed > 0) {
        toast.success(`Berhasil memperbaiki ${result.fixed} kasus`);
        // Re-validate after fixing
        await handleValidate();
      } else {
        toast.warning("Tidak ada kasus yang dapat diperbaiki secara otomatis");
      }
    } catch (error) {
      console.error("Error fixing:", error);
      toast.error("Gagal memperbaiki koneksi");
    } finally {
      setIsFixing(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const report = await getCaseEmployeeConnectionReport();
      setDetailedReport(report);
      console.log("📊 Detailed Report:", report);
      toast.success("Analisis detail berhasil");
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Gagal menganalisis detail");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Link className="h-8 w-8 text-primary" />
                Validasi Koneksi Kasus Pegawai
              </h1>
              <p className="text-muted-foreground mt-2">
                Periksa dan perbaiki koneksi antara kasus pegawai dengan data pegawai
              </p>
            </div>
            <div className="flex gap-2">
              {isAdminPusat && (
                <Button onClick={() => navigate("/admin/kasus-pegawai-validator")} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Validasi Koneksi
                </Button>
              )}
              <Button onClick={() => navigate("/admin/kasus-pegawai")} variant="outline">
                Kembali ke Kasus Pegawai
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
              <CardDescription>
                Validasi koneksi data dan perbaiki jika ditemukan masalah
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isValidating ? "Memvalidasi..." : "Validasi Koneksi"}
              </Button>
              
              {validationResult && validationResult.disconnectedCases > 0 && (
                <>
                  <Button
                    onClick={handleFix}
                    disabled={isFixing}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    {isFixing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {isFixing ? "Memperbaiki..." : "Perbaiki Otomatis"}
                  </Button>
                  
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {isAnalyzing ? "Menganalisis..." : "Analisis Detail"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Total Kasus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{validationResult.totalCases}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Terhubung
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {validationResult.connectedCases}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.totalCases > 0
                        ? `${((validationResult.connectedCases / validationResult.totalCases) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Tidak Terhubung
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {validationResult.disconnectedCases}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.totalCases > 0
                        ? `${((validationResult.disconnectedCases / validationResult.totalCases) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                {detailedReport && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Entry Manual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {detailedReport.summary.manualEntries || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Perlu dikonversi
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Invalid Cases Table */}
              {validationResult.disconnectedCases > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Kasus yang Tidak Terhubung & Entry Manual
                    </CardTitle>
                    <CardDescription>
                      Daftar kasus yang tidak memiliki koneksi valid dengan data pegawai atau menggunakan entry manual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nomor Kasus</TableHead>
                            <TableHead>Nama Pegawai</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Jenis Kasus</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tipe</TableHead>
                            {detailedReport && <TableHead>Dapat Diperbaiki?</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(detailedReport?.invalidCases || validationResult.invalidCases).map((invalidCase: any, idx: number) => (
                            <TableRow key={`${invalidCase.caseId}-${idx}`}>
                              <TableCell className="font-mono text-sm">
                                {invalidCase.caseNumber || "-"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {invalidCase.employeeName}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {invalidCase.employeeNip || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{invalidCase.caseType}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge>{invalidCase.status}</Badge>
                              </TableCell>
                              <TableCell>
                                {invalidCase.isManualEntry ? (
                                  <Badge className="bg-orange-600">Manual Entry</Badge>
                                ) : (
                                  <Badge variant="secondary">Disconnected</Badge>
                                )}
                              </TableCell>
                              {detailedReport && (
                                <TableCell>
                                  {invalidCase.canMatchByNip ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge className="bg-green-600 w-fit">✓ By NIP</Badge>
                                      <span className="text-xs text-muted-foreground">
                                        → {invalidCase.matchedEmployeeByNip?.name}
                                      </span>
                                    </div>
                                  ) : invalidCase.canMatchByName ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge className="bg-blue-600 w-fit">✓ By Name</Badge>
                                      <span className="text-xs text-muted-foreground">
                                        NIP: {invalidCase.matchedEmployeeByName?.nip}
                                      </span>
                                    </div>
                                  ) : (
                                    <Badge variant="destructive">✗ Tidak</Badge>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Detailed Analysis Report */}
          {detailedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Analisis Detail Kasus yang Gagal</CardTitle>
                <CardDescription>
                  Breakdown kasus berdasarkan kemungkinan perbaikan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Dapat Match by NIP</div>
                    <div className="text-2xl font-bold text-green-600">
                      {detailedReport.invalidCases.filter((c: any) => c.canMatchByNip).length}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Dapat Match by Name</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedReport.invalidCases.filter((c: any) => c.canMatchByName).length}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Entry Manual</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {detailedReport.invalidCases.filter((c: any) => c.isManualEntry).length}
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Tidak Dapat Match</div>
                    <div className="text-2xl font-bold text-red-600">
                      {detailedReport.invalidCases.filter((c: any) => !c.canMatchByNip && !c.canMatchByName).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fix Results */}
          {fixResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Hasil Perbaikan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Berhasil Diperbaiki</div>
                    <div className="text-2xl font-bold text-green-600">{fixResult.fixed}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manual: {fixResult.details.filter((d: any) => d.isManualEntry && d.status === "fixed").length} | 
                      Disconnected: {fixResult.details.filter((d: any) => !d.isManualEntry && d.status === "fixed").length}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Gagal Diperbaiki</div>
                    <div className="text-2xl font-bold text-red-600">{fixResult.failed}</div>
                  </div>
                </div>

                {fixResult.details.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Match Type</TableHead>
                          <TableHead>Old Employee ID</TableHead>
                          <TableHead>New Employee ID</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fixResult.details.map((detail: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {detail.caseId.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {detail.status === "fixed" ? (
                                <Badge className="bg-green-600">Fixed</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {detail.isManualEntry ? (
                                <Badge className="bg-orange-600">Manual</Badge>
                              ) : (
                                <Badge variant="secondary">Disconnected</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {detail.matchType && (
                                <Badge variant="outline">{detail.matchType}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {detail.oldEmployeeId.substring(0, 20)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {detail.newEmployeeId
                                ? `${detail.newEmployeeId.substring(0, 8)}...`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {detail.reason || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
