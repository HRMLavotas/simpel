/**
 * Manual Entry Converter Page
 * Admin utility to convert manual employee entries to integrated database records
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
  convertManualToIntegrated,
  getManualEntriesReport,
  type ConversionSummary,
} from "@/lib/convertManualToIntegrated";
import { 
  RefreshCw, 
  AlertTriangle, 
  Database, 
  CheckCircle, 
  XCircle, 
  FileText,
  ArrowRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function ManualEntryConverter() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [conversionResult, setConversionResult] = useState<ConversionSummary | null>(null);

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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setConversionResult(null);
    try {
      const result = await getManualEntriesReport();
      setReport(result);
      
      if (result.summary.totalManualEntries === 0) {
        toast.success("Tidak ada entry manual yang ditemukan!");
      } else {
        toast.info(`Ditemukan ${result.summary.totalManualEntries} entry manual`);
      }
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Gagal menganalisis entry manual");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!report || report.summary.totalManualEntries === 0) {
      toast.info("Tidak ada entry manual untuk dikonversi");
      return;
    }

    const canConvert = report.summary.canMatchByNip + report.summary.canMatchByName;
    
    if (canConvert === 0) {
      toast.warning("Tidak ada entry yang dapat dikonversi secara otomatis");
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertManualToIntegrated();
      setConversionResult(result);
      
      if (result.converted > 0) {
        toast.success(`Berhasil mengkonversi ${result.converted} entry!`);
        // Re-analyze after conversion
        await handleAnalyze();
      } else {
        toast.warning("Tidak ada entry yang dapat dikonversi");
      }
    } catch (error) {
      console.error("Error converting:", error);
      toast.error("Gagal mengkonversi entry manual");
    } finally {
      setIsConverting(false);
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
                <Database className="h-8 w-8 text-primary" />
                Konversi Entry Manual ke Database
              </h1>
              <p className="text-muted-foreground mt-2">
                Konversi data pegawai manual menjadi data terintegrasi dari database
              </p>
            </div>
            <Button onClick={() => navigate("/admin/kasus-pegawai")} variant="outline">
              Kembali ke Kasus Pegawai
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Apa itu Entry Manual?</strong>
              <br />
              Entry manual adalah data kasus yang dibuat dengan employee_id dimulai dengan "MANUAL_". 
              Data ini tidak terhubung dengan database pegawai yang sebenarnya. Tool ini akan mencari 
              pegawai yang cocok berdasarkan NIP atau nama, lalu mengkonversi ke data terintegrasi.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
              <CardDescription>
                Analisis entry manual dan konversi ke data terintegrasi
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isAnalyzing ? "Menganalisis..." : "Analisis Entry Manual"}
              </Button>
              
              {report && report.summary.totalManualEntries > 0 && (
                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  {isConverting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isConverting ? "Mengkonversi..." : "Konversi ke Database"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Analysis Report */}
          {report && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Total Entry Manual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{report.summary.totalManualEntries}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Match by NIP
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {report.summary.canMatchByNip}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.summary.totalManualEntries > 0
                        ? `${((report.summary.canMatchByNip / report.summary.totalManualEntries) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Match by Name
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {report.summary.canMatchByName}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.summary.totalManualEntries > 0
                        ? `${((report.summary.canMatchByName / report.summary.totalManualEntries) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Tidak Dapat Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {report.summary.cannotMatch}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.summary.totalManualEntries > 0
                        ? `${((report.summary.cannotMatch / report.summary.totalManualEntries) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Manual Entries Table */}
              {report.entries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Daftar Entry Manual
                    </CardTitle>
                    <CardDescription>
                      Entry manual yang ditemukan dan status matching-nya
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nomor Kasus</TableHead>
                            <TableHead>Nama Pegawai (Manual)</TableHead>
                            <TableHead>NIP (Manual)</TableHead>
                            <TableHead>Jenis Kasus</TableHead>
                            <TableHead>Status Match</TableHead>
                            <TableHead>Pegawai di Database</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.entries.map((entry: any) => (
                            <TableRow key={entry.caseId}>
                              <TableCell className="font-mono text-sm">
                                {entry.caseNumber || "-"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {entry.employeeName}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {entry.employeeNip || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{entry.caseType}</Badge>
                              </TableCell>
                              <TableCell>
                                {entry.canMatchByNip ? (
                                  <Badge className="bg-green-600">✓ By NIP</Badge>
                                ) : entry.canMatchByName ? (
                                  <Badge className="bg-blue-600">✓ By Name</Badge>
                                ) : (
                                  <Badge variant="destructive">✗ No Match</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {entry.canMatchByNip && entry.matchedEmployeeByNip ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">
                                      {entry.matchedEmployeeByNip.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      NIP: {entry.matchedEmployeeByNip.nip}
                                    </span>
                                  </div>
                                ) : entry.canMatchByName && entry.matchedEmployeeByName ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">
                                      {entry.matchedEmployeeByName.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      NIP: {entry.matchedEmployeeByName.nip}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
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

          {/* Conversion Results */}
          {conversionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Hasil Konversi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Berhasil Dikonversi</div>
                    <div className="text-2xl font-bold text-green-600">
                      {conversionResult.converted}
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Gagal Dikonversi</div>
                    <div className="text-2xl font-bold text-red-600">
                      {conversionResult.failed}
                    </div>
                  </div>
                </div>

                {conversionResult.details.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nomor Kasus</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Match Type</TableHead>
                          <TableHead>Old ID</TableHead>
                          <TableHead>New ID</TableHead>
                          <TableHead>Pegawai</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversionResult.details.map((detail, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">
                              {detail.caseNumber || "-"}
                            </TableCell>
                            <TableCell>
                              {detail.status === "converted" ? (
                                <Badge className="bg-green-600">✓ Converted</Badge>
                              ) : (
                                <Badge variant="destructive">✗ Failed</Badge>
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
                              {detail.newEmployeeId !== detail.oldEmployeeId
                                ? `${detail.newEmployeeId.substring(0, 8)}...`
                                : "unchanged"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-sm">
                                  {detail.matchedEmployee.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {detail.matchedEmployee.nip}
                                </span>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
