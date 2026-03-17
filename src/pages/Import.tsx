import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DEPARTMENTS, 
  ASN_STATUS_OPTIONS, 
  POSITION_TYPES, 
  RANK_GROUPS,
  DEPARTMENT_ALIASES,
  POSITION_TYPE_ALIASES,
  RANK_GROUP_ALIASES,
  normalizeImportValue,
  type Department,
  type PositionType,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
interface ParsedRow {
  nip: string;
  name: string;
  position_type: string;
  position_name: string;
  asn_status: string;
  rank_group: string;
  department: string;
  join_date: string;
  error?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export default function Import() {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.endsWith('.csv');
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast({
        variant: 'destructive',
        title: 'Format tidak valid',
        description: 'Silakan upload file dengan format CSV atau Excel (.xlsx)',
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    
    if (isExcel) {
      parseExcel(selectedFile);
    } else {
      parseCSV(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { 
        raw: false,
        defval: '' 
      });

      if (jsonData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'File kosong',
          description: 'File Excel tidak memiliki data',
        });
        return;
      }

      const parsed: ParsedRow[] = jsonData.map((row) => {
        // Get raw values
        const rawPositionType = row['Jenis Jabatan'] || row['position_type'] || '';
        const rawRankGroup = row['Golongan'] || row['rank_group'] || '';
        const rawDepartment = row['Unit Kerja'] || row['department'] || '';
        
        // Normalize values using aliases
        const normalizedPositionType = normalizeImportValue(
          rawPositionType, 
          POSITION_TYPE_ALIASES, 
          POSITION_TYPES
        );
        const normalizedRankGroup = normalizeImportValue(
          rawRankGroup, 
          RANK_GROUP_ALIASES, 
          RANK_GROUPS
        );
        const normalizedDepartment = isAdminPusat 
          ? normalizeImportValue(rawDepartment, DEPARTMENT_ALIASES, DEPARTMENTS)
          : (profile?.department || '');

        const parsedRow: ParsedRow = {
          nip: row['NIP'] || row['nip'] || '',
          name: row['Nama Lengkap'] || row['name'] || row['Nama'] || '',
          position_type: normalizedPositionType,
          position_name: row['Nama Jabatan'] || row['position_name'] || '',
          asn_status: row['Status ASN'] || row['asn_status'] || '',
          rank_group: normalizedRankGroup,
          department: normalizedDepartment,
          join_date: row['Tanggal Masuk'] || row['join_date'] || '',
        };

        // Validate
        if (!parsedRow.name) {
          parsedRow.error = 'Nama wajib diisi';
        } else if (!parsedRow.asn_status) {
          parsedRow.error = 'Status ASN wajib diisi';
        } else if (isAdminPusat && !parsedRow.department) {
          parsedRow.error = 'Unit kerja wajib diisi';
        } else if (isAdminPusat && !DEPARTMENTS.includes(parsedRow.department as Department)) {
          parsedRow.error = `Unit kerja "${rawDepartment}" tidak valid`;
        }

        return parsedRow;
      });

      setParsedData(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          variant: 'destructive',
          title: 'File kosong',
          description: 'File CSV tidak memiliki data',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1);

      const parsed: ParsedRow[] = dataRows.map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        const row: ParsedRow = {
          nip: values[headers.indexOf('nip')] || '',
          name: values[headers.indexOf('name')] || '',
          position_type: values[headers.indexOf('position_type')] || '',
          position_name: values[headers.indexOf('position_name')] || '',
          asn_status: values[headers.indexOf('asn_status')] || '',
          rank_group: values[headers.indexOf('rank_group')] || '',
          department: isAdminPusat 
            ? values[headers.indexOf('department')] || ''
            : profile?.department || '',
          join_date: values[headers.indexOf('join_date')] || '',
        };

        // Validate
        if (!row.name) {
          row.error = 'Nama wajib diisi';
        } else if (!row.asn_status) {
          row.error = 'Status ASN wajib diisi';
        } else if (isAdminPusat && !row.department) {
          row.error = 'Unit kerja wajib diisi';
        } else if (isAdminPusat && !DEPARTMENTS.includes(row.department as any)) {
          row.error = `Unit kerja "${row.department}" tidak valid`;
        }

        return row;
      });

      setParsedData(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);

    const validRows = parsedData.filter(row => !row.error);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        const { error } = await supabase
          .from('employees')
          .insert({
            nip: row.nip || null,
            name: row.name,
            position_type: row.position_type || null,
            position_name: row.position_name || null,
            asn_status: row.asn_status,
            rank_group: row.rank_group || null,
            department: row.department,
            join_date: row.join_date || null,
          });

        if (error) {
          if (error.code === '23505') {
            result.errors.push({ row: i + 2, error: `NIP ${row.nip} sudah terdaftar` });
          } else {
            result.errors.push({ row: i + 2, error: error.message });
          }
          result.failed++;
        } else {
          result.success++;
        }
      } catch (err: any) {
        result.errors.push({ row: i + 2, error: err.message });
        result.failed++;
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    // Add validation errors
    parsedData.forEach((row, idx) => {
      if (row.error) {
        result.errors.push({ row: idx + 2, error: row.error });
        result.failed++;
      }
    });

    setImportResult(result);
    setIsProcessing(false);

    if (result.success > 0) {
      toast({
        title: 'Import Selesai',
        description: `${result.success} data berhasil diimport${result.failed > 0 ? `, ${result.failed} gagal` : ''}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Import Gagal',
        description: 'Tidak ada data yang berhasil diimport',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Sample data with Indonesian headers - using full rank format
    const sampleData = [
      {
        'NIP': '199001012020121001',
        'Nama Lengkap': 'Budi Santoso',
        'Jenis Jabatan': 'Fungsional',
        'Nama Jabatan': 'Analis Kepegawaian Ahli Muda',
        'Status ASN': 'PNS',
        'Golongan': 'Penata Muda Tk I (III/b)',
        'Unit Kerja': isAdminPusat ? 'BBPVP Bekasi' : profile?.department,
        'Tanggal Masuk': '2020-01-15',
      },
      {
        'NIP': '199203052021012002',
        'Nama Lengkap': 'Siti Nurhaliza',
        'Jenis Jabatan': 'Struktural',
        'Nama Jabatan': 'Kepala Sub Bagian',
        'Status ASN': 'PNS',
        'Golongan': 'Penata Tk I (III/d)',
        'Unit Kerja': isAdminPusat ? 'Setditjen Binalavotas' : profile?.department,
        'Tanggal Masuk': '2021-02-01',
      },
      {
        'NIP': '',
        'Nama Lengkap': 'Ahmad Fauzi',
        'Jenis Jabatan': 'Pelaksana',
        'Nama Jabatan': 'Tenaga Administrasi',
        'Status ASN': 'PPPK',
        'Golongan': 'IX',
        'Unit Kerja': isAdminPusat ? 'BPVP Surakarta' : profile?.department,
        'Tanggal Masuk': '2023-03-10',
      },
    ];

    // Create main data worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 20 },  // NIP
      { wch: 25 },  // Nama Lengkap
      { wch: 15 },  // Jenis Jabatan
      { wch: 30 },  // Nama Jabatan
      { wch: 12 },  // Status ASN
      { wch: 10 },  // Golongan
      { wch: 25 },  // Unit Kerja
      { wch: 15 },  // Tanggal Masuk
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

    // Create reference sheet for dropdown values
    const refData = [];
    const maxRows = Math.max(
      ASN_STATUS_OPTIONS.length,
      POSITION_TYPES.length,
      RANK_GROUPS.length,
      isAdminPusat ? DEPARTMENTS.length : 1
    );

    for (let i = 0; i < maxRows; i++) {
      refData.push({
        'Status ASN (Pilihan)': ASN_STATUS_OPTIONS[i] || '',
        'Jenis Jabatan (Pilihan)': POSITION_TYPES[i] || '',
        'Golongan (Pilihan)': RANK_GROUPS[i] || '',
        'Unit Kerja (Pilihan)': isAdminPusat ? (DEPARTMENTS[i] || '') : (i === 0 ? profile?.department : ''),
      });
    }

    const wsRef = XLSX.utils.json_to_sheet(refData);
    wsRef['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

    // Create instructions sheet
    const instructions = [
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== PETUNJUK PENGGUNAAN ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '1. Isi data pegawai di sheet "Data Pegawai"' },
      { 'Panduan Pengisian Template Import Pegawai': '2. Hapus contoh data yang ada, ganti dengan data Anda' },
      { 'Panduan Pengisian Template Import Pegawai': '3. Lihat sheet "Referensi" untuk pilihan nilai yang valid' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== KETERANGAN KOLOM ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': 'NIP: 18 digit (opsional untuk Non ASN)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Nama Lengkap: WAJIB diisi' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jenis Jabatan: Struktural / Fungsional / Pelaksana' },
      { 'Panduan Pengisian Template Import Pegawai': 'Nama Jabatan: Nama jabatan pegawai' },
      { 'Panduan Pengisian Template Import Pegawai': 'Status ASN: WAJIB (PNS / PPPK / Non ASN)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Golongan PNS: Format lengkap, contoh "Penata Muda Tk I (III/b)"' },
      { 'Panduan Pengisian Template Import Pegawai': 'Golongan PPPK: I sampai XVII' },
      { 'Panduan Pengisian Template Import Pegawai': 'Golongan Non ASN: Kosongkan atau isi "Tidak Ada"' },
      { 'Panduan Pengisian Template Import Pegawai': isAdminPusat 
        ? 'Unit Kerja: WAJIB, harus sesuai daftar di sheet Referensi' 
        : `Unit Kerja: Otomatis terisi "${profile?.department}"` },
      { 'Panduan Pengisian Template Import Pegawai': 'Tanggal Masuk: Format YYYY-MM-DD (contoh: 2020-01-15)' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== KONVERSI OTOMATIS ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': 'Sistem akan otomatis mengkonversi:' },
      { 'Panduan Pengisian Template Import Pegawai': '- "Jabatan Fungsional" → "Fungsional"' },
      { 'Panduan Pengisian Template Import Pegawai': '- "Balai Besar Pelatihan Vokasi dan Produktivitas Bandung" → "BBPVP Bandung"' },
      { 'Panduan Pengisian Template Import Pegawai': '- "III/b" → "Penata Muda Tk I (III/b)"' },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions, { skipHeader: true });
    wsInstructions['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Panduan');

    // Generate and download
    XLSX.writeFile(wb, 'template-import-pegawai.xlsx');
  };

  const validCount = parsedData.filter(r => !r.error).length;
  const invalidCount = parsedData.filter(r => r.error).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Import Data Pegawai</h1>
          <p className="page-description">
            Import data pegawai dari file CSV
            {!isAdminPusat && ` ke ${profile?.department}`}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Upload File CSV</CardTitle>
              <CardDescription>
                {isAdminPusat 
                  ? 'Pastikan kolom department terisi dengan unit kerja yang valid'
                  : `Semua data akan diimport ke unit kerja ${profile?.department}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!file ? (
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">
                    Klik untuk upload atau drag & drop file
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Format: Excel (.xlsx) atau CSV
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsedData.length} baris data terdeteksi
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {parsedData.length > 0 && (
                <>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{validCount} data valid</span>
                    </div>
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span>{invalidCount} data error</span>
                      </div>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Mengimport data... {progress}%
                      </p>
                    </div>
                  )}

                  {importResult && (
                    <Alert variant={importResult.success > 0 ? 'default' : 'destructive'}>
                      {importResult.success > 0 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>Hasil Import</AlertTitle>
                      <AlertDescription>
                        Berhasil: {importResult.success} data, Gagal: {importResult.failed} data
                        {importResult.errors.length > 0 && (
                          <ul className="mt-2 list-disc list-inside text-xs">
                            {importResult.errors.slice(0, 5).map((err, i) => (
                              <li key={i}>Baris {err.row}: {err.error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>...dan {importResult.errors.length - 5} error lainnya</li>
                            )}
                          </ul>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleImport} 
                      disabled={validCount === 0 || isProcessing}
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import {validCount} Data
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Panduan Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Format kolom CSV:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>nip (opsional, 18 digit)</li>
                  <li>name (wajib)</li>
                  <li>position_type</li>
                  <li>position_name</li>
                  <li>asn_status (wajib: PNS/PPPK/Non ASN)</li>
                  <li>rank_group</li>
                  <li>department {isAdminPusat ? '(wajib)' : '(diabaikan)'}</li>
                  <li>join_date (format: YYYY-MM-DD)</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview Data (5 baris pertama)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status ASN</TableHead>
                      <TableHead>Golongan</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                        <TableCell className="font-mono text-sm">{row.nip || '-'}</TableCell>
                        <TableCell>{row.name || '-'}</TableCell>
                        <TableCell>{row.asn_status || '-'}</TableCell>
                        <TableCell>{row.rank_group || '-'}</TableCell>
                        <TableCell className="text-sm">{row.department}</TableCell>
                        <TableCell>
                          {row.error ? (
                            <span className="text-xs text-destructive">{row.error}</span>
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
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
      </div>
    </AppLayout>
  );
}
