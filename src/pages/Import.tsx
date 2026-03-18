import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DEPARTMENTS, ASN_STATUS_OPTIONS, POSITION_TYPES, RANK_GROUPS,
  DEPARTMENT_ALIASES, POSITION_TYPE_ALIASES, RANK_GROUP_ALIASES,
  normalizeImportValue, type Department,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

// ============ SHARED TYPES ============

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

// Normalize Excel header: lowercase, remove newlines, trim
const normalizeHeader = (h: string) => h.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

// Find header by trying multiple aliases
const findCol = (row: Record<string, string>, ...keys: string[]): string => {
  // Direct match first
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  // Normalized match
  const normalizedKeys = keys.map(normalizeHeader);
  for (const [rawKey, val] of Object.entries(row)) {
    const norm = normalizeHeader(rawKey);
    if (normalizedKeys.includes(norm) && val !== undefined) return val;
  }
  return '';
};

// ============ EMPLOYEE IMPORT ============

interface ParsedEmployee {
  name: string;
  nip: string;
  asn_status: string;
  position_name: string;
  position_type: string;
  rank_group: string;
  education_level: string;
  gender: string;
  department: string;
  keterangan_formasi: string;
  keterangan_penempatan: string;
  keterangan_penugasan: string;
  keterangan_perubahan: string;
  error?: string;
}

// ============ POSITION IMPORT ============

interface ParsedPosition {
  position_name: string;
  position_category: string;
  grade: string;
  abk_count: string;
  department: string;
  error?: string;
}

// ============ COMPONENT ============

export default function Import() {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pegawai');

  // ---- Employee state ----
  const empFileRef = useRef<HTMLInputElement>(null);
  const [empFile, setEmpFile] = useState<File | null>(null);
  const [empData, setEmpData] = useState<ParsedEmployee[]>([]);
  const [empProcessing, setEmpProcessing] = useState(false);
  const [empProgress, setEmpProgress] = useState(0);
  const [empResult, setEmpResult] = useState<ImportResult | null>(null);

  // ---- Position state ----
  const posFileRef = useRef<HTMLInputElement>(null);
  const [posFile, setPosFile] = useState<File | null>(null);
  const [posData, setPosData] = useState<ParsedPosition[]>([]);
  const [posProcessing, setPosProcessing] = useState(false);
  const [posProgress, setPosProgress] = useState(0);
  const [posResult, setPosResult] = useState<ImportResult | null>(null);

  const userDept = profile?.department || '';

  // ======== EMPLOYEE PARSING ========

  const parseEmployeeExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' });

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'File kosong', description: 'Tidak ada data ditemukan' });
        return;
      }

      const parsed: ParsedEmployee[] = rows.map((row) => {
        const name = findCol(row, 'Nama Pemangku', 'Nama Lengkap', 'Nama', 'name');
        const rawDept = findCol(row, 'Unit Kerja', 'department');
        const dept = isAdminPusat
          ? normalizeImportValue(rawDept, DEPARTMENT_ALIASES, DEPARTMENTS)
          : userDept;

        const rawRank = findCol(row, 'Pangkat Golongan', 'Pangkat\nGolongan', 'rank_group', 'Golongan');
        const rawPosType = findCol(row, 'Jenis Jabatan', 'position_type');

        const parsed: ParsedEmployee = {
          name,
          nip: findCol(row, 'NIP', 'nip'),
          asn_status: findCol(row, 'Kriteria ASN', 'Status ASN', 'asn_status'),
          position_name: findCol(row, 'Jabatan Sesuai Kepmen 202 Tahun 2024', 'Nama Jabatan', 'Jabatan', 'position_name'),
          position_type: normalizeImportValue(rawPosType, POSITION_TYPE_ALIASES, POSITION_TYPES),
          rank_group: normalizeImportValue(rawRank, RANK_GROUP_ALIASES, RANK_GROUPS),
          education_level: findCol(row, 'Pendidikan Terakhir', 'education_level'),
          gender: findCol(row, 'Jenis Kelamin', 'gender'),
          department: dept,
          keterangan_formasi: findCol(row, 'Keterangan Formasi (ABK-Existing)', 'Keterangan Formasi'),
          keterangan_penempatan: findCol(row, 'Keternangan Penempatan', 'Keterangan Penempatan'),
          keterangan_penugasan: findCol(row, 'Keterangan Penugasan Tambahan', 'Keterangan Penugasan'),
          keterangan_perubahan: findCol(row, 'Keterangan Perubahan'),
        };

        // Validate
        if (!parsed.name) parsed.error = 'Nama wajib diisi';
        else if (!parsed.asn_status) parsed.error = 'Kriteria ASN wajib diisi';
        else if (isAdminPusat && !parsed.department) parsed.error = 'Unit kerja wajib diisi';
        else if (isAdminPusat && !DEPARTMENTS.includes(parsed.department as Department)) parsed.error = `Unit kerja "${rawDept}" tidak valid`;

        return parsed;
      });

      setEmpData(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handleEmpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ variant: 'destructive', title: 'Format tidak valid', description: 'Gunakan format Excel (.xlsx) atau CSV' });
      return;
    }
    setEmpFile(f);
    setEmpResult(null);
    parseEmployeeExcel(f);
  };

  const handleEmpImport = async () => {
    const valid = empData.filter(r => !r.error);
    if (valid.length === 0) return;
    setEmpProcessing(true);
    setEmpProgress(0);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        let gender = row.gender;
        if (gender === 'L') gender = 'Laki-laki';
        if (gender === 'P') gender = 'Perempuan';

        const { data: inserted, error } = await supabase
          .from('employees')
          .insert({
            name: row.name,
            nip: row.nip || null,
            asn_status: row.asn_status,
            position_name: row.position_name || null,
            position_type: row.position_type || null,
            rank_group: row.rank_group || null,
            gender: gender || null,
            department: row.department,
            keterangan_formasi: row.keterangan_formasi || null,
            keterangan_penempatan: row.keterangan_penempatan || null,
            keterangan_penugasan: row.keterangan_penugasan || null,
            keterangan_perubahan: row.keterangan_perubahan || null,
          })
          .select('id')
          .single();

        if (error) {
          result.errors.push({ row: i + 2, error: error.message });
          result.failed++;
        } else {
          if (row.education_level && inserted) {
            await supabase.from('education_history').insert({
              employee_id: inserted.id,
              level: row.education_level,
            });
          }
          result.success++;
        }
      } catch (err: any) {
        result.errors.push({ row: i + 2, error: err.message });
        result.failed++;
      }
      setEmpProgress(Math.round(((i + 1) / valid.length) * 100));
    }

    // Count validation errors
    empData.forEach((row, idx) => {
      if (row.error) {
        result.errors.push({ row: idx + 2, error: row.error });
        result.failed++;
      }
    });

    setEmpResult(result);
    setEmpProcessing(false);
    toast({
      variant: result.success > 0 ? 'default' : 'destructive',
      title: result.success > 0 ? 'Import Selesai' : 'Import Gagal',
      description: `${result.success} pegawai berhasil${result.failed > 0 ? `, ${result.failed} gagal` : ''}`,
    });
  };

  const resetEmp = () => {
    setEmpFile(null); setEmpData([]); setEmpResult(null); setEmpProgress(0);
    if (empFileRef.current) empFileRef.current.value = '';
  };

  const downloadEmpTemplate = () => {
    const wb = XLSX.utils.book_new();
    const dept = isAdminPusat ? 'BBPVP Bekasi' : userDept;
    const sampleData = [
      { 'No': 1, 'Nama Pemangku': 'Budi Santoso', 'NIP': '199001012020121001', 'Kriteria ASN': 'PNS', 'Jabatan': 'Analis Kepegawaian Ahli Muda', 'Jenis Jabatan': 'Fungsional', 'Pangkat Golongan': 'Penata Muda Tk I (III/b)', 'Pendidikan Terakhir': 'S1', 'Jenis Kelamin': 'Laki-laki', 'Unit Kerja': dept, 'Keterangan Formasi': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 2, 'Nama Pemangku': 'Siti Nurhaliza', 'NIP': '199203052021012002', 'Kriteria ASN': 'PNS', 'Jabatan': 'Kepala Sub Bagian', 'Jenis Jabatan': 'Struktural', 'Pangkat Golongan': 'Penata Tk I (III/d)', 'Pendidikan Terakhir': 'S2', 'Jenis Kelamin': 'Perempuan', 'Unit Kerja': isAdminPusat ? 'Setditjen Binalavotas' : dept, 'Keterangan Formasi': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 3, 'Nama Pemangku': 'Ahmad Fauzi', 'NIP': '', 'Kriteria ASN': 'PPPK', 'Jabatan': 'Tenaga Administrasi', 'Jenis Jabatan': 'Pelaksana', 'Pangkat Golongan': 'IX', 'Pendidikan Terakhir': 'SMA/SMK', 'Jenis Kelamin': 'Laki-laki', 'Unit Kerja': dept, 'Keterangan Formasi': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 14 }, { wch: 35 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

    // Reference sheet
    const refData = [];
    const max = Math.max(ASN_STATUS_OPTIONS.length, RANK_GROUPS.length, isAdminPusat ? DEPARTMENTS.length : 1);
    for (let i = 0; i < max; i++) {
      refData.push({
        'Status ASN': ASN_STATUS_OPTIONS[i] || '',
        'Pangkat/Golongan': RANK_GROUPS[i] || '',
        'Unit Kerja': isAdminPusat ? (DEPARTMENTS[i] || '') : (i === 0 ? userDept : ''),
      });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

    XLSX.writeFile(wb, 'template-import-pegawai.xlsx');
  };

  // ======== POSITION PARSING ========

  const parsePositionExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' });

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'File kosong', description: 'Tidak ada data ditemukan' });
        return;
      }

      const parsed: ParsedPosition[] = rows.map((row) => {
        const posName = findCol(row, 'Jabatan Sesuai Kepmen 202 Tahun 2024', 'Nama Jabatan', 'Jabatan', 'position_name');
        const rawCategory = findCol(row, 'Jenis Jabatan', 'Kategori Jabatan', 'position_category');
        const rawDept = findCol(row, 'Unit Kerja', 'department');
        const dept = isAdminPusat
          ? normalizeImportValue(rawDept, DEPARTMENT_ALIASES, DEPARTMENTS)
          : userDept;

        let category = rawCategory.trim();
        if (!['Struktural', 'Fungsional', 'Pelaksana'].includes(category)) {
          category = normalizeImportValue(category, POSITION_TYPE_ALIASES, POSITION_TYPES);
          if (!['Struktural', 'Fungsional', 'Pelaksana'].includes(category)) category = 'Fungsional';
        }

        const p: ParsedPosition = {
          position_name: posName,
          position_category: category,
          grade: findCol(row, 'Grade/Kelas Jabatan', 'Grade/ Kelas Jabatan', 'Grade/\nKelas Jabatan', 'Kelas Jabatan', 'Grade'),
          abk_count: findCol(row, 'Jumlah ABK', 'ABK'),
          department: dept,
        };

        if (!p.position_name) p.error = 'Nama jabatan wajib diisi';
        else if (isAdminPusat && !p.department) p.error = 'Unit kerja wajib diisi';
        else if (isAdminPusat && !DEPARTMENTS.includes(p.department as Department)) p.error = `Unit kerja "${rawDept}" tidak valid`;

        return p;
      });

      setPosData(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handlePosFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ variant: 'destructive', title: 'Format tidak valid', description: 'Gunakan format Excel (.xlsx) atau CSV' });
      return;
    }
    setPosFile(f);
    setPosResult(null);
    parsePositionExcel(f);
  };

  const handlePosImport = async () => {
    const valid = posData.filter(r => !r.error);
    if (valid.length === 0) return;
    setPosProcessing(true);
    setPosProgress(0);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        const { error } = await supabase.from('position_references').insert({
          position_name: row.position_name,
          position_category: row.position_category,
          grade: row.grade ? parseInt(row.grade, 10) : null,
          abk_count: row.abk_count ? parseInt(row.abk_count, 10) : 0,
          department: row.department,
          position_order: 0,
        });
        if (error) {
          result.errors.push({ row: i + 2, error: error.message });
          result.failed++;
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.errors.push({ row: i + 2, error: err.message });
        result.failed++;
      }
      setPosProgress(Math.round(((i + 1) / valid.length) * 100));
    }

    posData.forEach((row, idx) => {
      if (row.error) {
        result.errors.push({ row: idx + 2, error: row.error });
        result.failed++;
      }
    });

    setPosResult(result);
    setPosProcessing(false);
    toast({
      variant: result.success > 0 ? 'default' : 'destructive',
      title: result.success > 0 ? 'Import Selesai' : 'Import Gagal',
      description: `${result.success} jabatan berhasil${result.failed > 0 ? `, ${result.failed} gagal` : ''}`,
    });
  };

  const resetPos = () => {
    setPosFile(null); setPosData([]); setPosResult(null); setPosProgress(0);
    if (posFileRef.current) posFileRef.current.value = '';
  };

  const downloadPosTemplate = () => {
    const wb = XLSX.utils.book_new();
    const dept = isAdminPusat ? 'BBPVP Bekasi' : userDept;
    const sampleData = [
      { 'No': 1, 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Kepala Balai', 'Jenis Jabatan': 'Struktural', 'Grade/Kelas Jabatan': 14, 'Jumlah ABK': 1, 'Unit Kerja': dept },
      { 'No': 2, 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Analis Kepegawaian Ahli Muda', 'Jenis Jabatan': 'Fungsional', 'Grade/Kelas Jabatan': 8, 'Jumlah ABK': 2, 'Unit Kerja': dept },
      { 'No': 3, 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Pengadministrasi Umum', 'Jenis Jabatan': 'Pelaksana', 'Grade/Kelas Jabatan': 5, 'Jumlah ABK': 3, 'Unit Kerja': dept },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Peta Jabatan');

    // Reference sheet
    const refData = [];
    const deptList = isAdminPusat ? DEPARTMENTS : [userDept];
    const max = Math.max(3, deptList.length);
    for (let i = 0; i < max; i++) {
      refData.push({
        'Jenis Jabatan': ['Struktural', 'Fungsional', 'Pelaksana'][i] || '',
        'Unit Kerja': deptList[i] || '',
      });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

    XLSX.writeFile(wb, 'template-import-peta-jabatan.xlsx');
  };

  // ======== SHARED UI HELPERS ========

  const renderFileUpload = (
    file: File | null,
    fileRef: React.RefObject<HTMLInputElement>,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onReset: () => void,
    dataCount: number,
  ) => (
    <>
      {!file ? (
        <div
          className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50")}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Klik untuk upload file</p>
          <p className="mt-1 text-xs text-muted-foreground">Format: Excel (.xlsx) atau CSV</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{dataCount} baris data terdeteksi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onReset}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onChange} className="hidden" />
    </>
  );

  const renderProgress = (processing: boolean, progress: number) =>
    processing && (
      <div className="space-y-2">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground text-center">Mengimport data... {progress}%</p>
      </div>
    );

  const renderResult = (result: ImportResult | null) =>
    result && (
      <Alert variant={result.success > 0 ? 'default' : 'destructive'}>
        {result.success > 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>Hasil Import</AlertTitle>
        <AlertDescription>
          Berhasil: {result.success}, Gagal: {result.failed}
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-xs">
              {result.errors.slice(0, 5).map((err, i) => <li key={i}>Baris {err.row}: {err.error}</li>)}
              {result.errors.length > 5 && <li>...dan {result.errors.length - 5} error lainnya</li>}
            </ul>
          )}
        </AlertDescription>
      </Alert>
    );

  // ======== RENDER ========

  const empValid = empData.filter(r => !r.error).length;
  const empInvalid = empData.filter(r => r.error).length;
  const posValid = posData.filter(r => !r.error).length;
  const posInvalid = posData.filter(r => r.error).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Import Data</h1>
          <p className="page-description">
            Import data pegawai atau peta jabatan dari file Excel
            {!isAdminPusat && ` ke ${userDept}`}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pegawai">Import Data Pegawai</TabsTrigger>
            <TabsTrigger value="jabatan">Import Peta Jabatan</TabsTrigger>
          </TabsList>

          {/* ===== TAB: PEGAWAI ===== */}
          <TabsContent value="pegawai">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Data Pegawai</CardTitle>
                  <CardDescription>
                    {isAdminPusat ? 'Pastikan kolom Unit Kerja terisi' : `Data akan diimport ke ${userDept}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFileUpload(empFile, empFileRef, handleEmpFileChange, resetEmp, empData.length)}
                  {empData.length > 0 && (
                    <>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{empValid} data valid</span>
                        </div>
                        {empInvalid > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span>{empInvalid} error</span>
                          </div>
                        )}
                      </div>
                      {renderProgress(empProcessing, empProgress)}
                      {renderResult(empResult)}
                      <div className="flex gap-2">
                        <Button onClick={handleEmpImport} disabled={empValid === 0 || empProcessing} className="flex-1">
                          <Upload className="mr-2 h-4 w-4" />Import {empValid} Pegawai
                        </Button>
                        <Button variant="outline" onClick={resetEmp}>Reset</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Panduan</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Format kolom:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>No</li>
                      <li>Nama Pemangku (wajib)</li>
                      <li>NIP (opsional)</li>
                      <li>Kriteria ASN (wajib)</li>
                      <li>Jabatan</li>
                      <li>Jenis Jabatan</li>
                      <li>Pangkat Golongan</li>
                      <li>Pendidikan Terakhir</li>
                      <li>Jenis Kelamin</li>
                      <li>Unit Kerja {isAdminPusat ? '(wajib)' : '(otomatis)'}</li>
                      <li>Keterangan Formasi/Penempatan/Penugasan/Perubahan</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full" onClick={downloadEmpTemplate}>
                    <Download className="mr-2 h-4 w-4" />Download Template Pegawai
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Employee Preview */}
            {empData.length > 0 && (
              <Card className="mt-6">
                <CardHeader><CardTitle className="text-lg">Preview Data (5 baris pertama)</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Kriteria ASN</TableHead>
                          <TableHead>Jabatan</TableHead>
                          <TableHead>Pangkat</TableHead>
                          <TableHead>Unit Kerja</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empData.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                            <TableCell className="text-sm">{row.name || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{row.nip || '-'}</TableCell>
                            <TableCell className="text-sm">{row.asn_status || '-'}</TableCell>
                            <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                            <TableCell className="text-sm">{row.rank_group || '-'}</TableCell>
                            <TableCell className="text-sm">{row.department}</TableCell>
                            <TableCell>
                              {row.error
                                ? <span className="text-xs text-destructive">{row.error}</span>
                                : <CheckCircle className="h-4 w-4 text-green-600" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== TAB: PETA JABATAN ===== */}
          <TabsContent value="jabatan">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Peta Jabatan</CardTitle>
                  <CardDescription>
                    Import referensi jabatan ke tabel Peta Jabatan (Struktural/Fungsional/Pelaksana)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFileUpload(posFile, posFileRef, handlePosFileChange, resetPos, posData.length)}
                  {posData.length > 0 && (
                    <>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{posValid} data valid</span>
                        </div>
                        {posInvalid > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span>{posInvalid} error</span>
                          </div>
                        )}
                      </div>
                      {renderProgress(posProcessing, posProgress)}
                      {renderResult(posResult)}
                      <div className="flex gap-2">
                        <Button onClick={handlePosImport} disabled={posValid === 0 || posProcessing} className="flex-1">
                          <Upload className="mr-2 h-4 w-4" />Import {posValid} Jabatan
                        </Button>
                        <Button variant="outline" onClick={resetPos}>Reset</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Panduan</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Format kolom:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>No</li>
                      <li>Jabatan Sesuai Kepmen 202/2024 (wajib)</li>
                      <li>Jenis Jabatan (Struktural/Fungsional/Pelaksana)</li>
                      <li>Grade/Kelas Jabatan</li>
                      <li>Jumlah ABK</li>
                      <li>Unit Kerja {isAdminPusat ? '(wajib)' : '(otomatis)'}</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full" onClick={downloadPosTemplate}>
                    <Download className="mr-2 h-4 w-4" />Download Template Peta Jabatan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Position Preview */}
            {posData.length > 0 && (
              <Card className="mt-6">
                <CardHeader><CardTitle className="text-lg">Preview Data (5 baris pertama)</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Jabatan</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>ABK</TableHead>
                          <TableHead>Unit Kerja</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posData.slice(0, 5).map((row, idx) => (
                          <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                            <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                            <TableCell className="text-sm">{row.position_category}</TableCell>
                            <TableCell className="text-sm">{row.grade || '-'}</TableCell>
                            <TableCell className="text-sm">{row.abk_count || '-'}</TableCell>
                            <TableCell className="text-sm">{row.department}</TableCell>
                            <TableCell>
                              {row.error
                                ? <span className="text-xs text-destructive">{row.error}</span>
                                : <CheckCircle className="h-4 w-4 text-green-600" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
