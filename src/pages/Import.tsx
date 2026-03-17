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
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ParsedRow {
  no: string;
  position_name: string;
  grade_kelas: string;
  jumlah_abk: string;
  jumlah_existing: string;
  name: string;
  asn_status: string;
  nip: string;
  rank_group: string;
  tmt: string;
  education_level: string;
  gender: string;
  keterangan_formasi: string;
  keterangan_penempatan: string;
  keterangan_penugasan: string;
  keterangan_perubahan: string;
  position_type: string;
  department: string;
  row_type: 'employee' | 'position_reference'; // Type of data row
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
      
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { 
        raw: false,
        defval: '' 
      });

      if (jsonData.length === 0) {
        toast({ variant: 'destructive', title: 'File kosong', description: 'File Excel tidak memiliki data' });
        return;
      }

      const parsed: ParsedRow[] = jsonData.map((row) => {
        const rawRankGroup = row['Pangkat\nGolongan'] || row['Pangkat Golongan'] || row['Golongan'] || row['rank_group'] || '';
        const rawDepartment = row['Unit Kerja'] || row['department'] || '';

        const normalizedRankGroup = normalizeImportValue(rawRankGroup, RANK_GROUP_ALIASES, RANK_GROUPS);
        const normalizedDepartment = isAdminPusat
          ? normalizeImportValue(rawDepartment, DEPARTMENT_ALIASES, DEPARTMENTS)
          : (profile?.department || '');

        const positionName = row['Jabatan Sesuai Kepmen 202 Tahun 2024'] || row['Nama Jabatan'] || row['position_name'] || '';
        const gradeKelas = row['Grade/\nKelas Jabatan'] || row['Grade/ Kelas Jabatan'] || row['Grade/Kelas Jabatan'] || '';
        const jumlahAbk = row['Jumlah ABK'] || '';
        const name = row['Nama Pemangku'] || row['Nama Lengkap'] || row['name'] || row['Nama'] || '';
        const nipValue = row['NIP'] || row['nip'] || '';

        // Determine row type based on presence of employee name
        // If no name but has position data (jabatan, grade, abk) → position_reference
        // If has name → employee (NIP is optional for Non ASN)
        let rowType: 'employee' | 'position_reference' = 'employee';

        if (!name && positionName && gradeKelas && jumlahAbk) {
          rowType = 'position_reference';
        }

        const parsedRow: ParsedRow = {
          no: row['No'] || '',
          position_name: positionName,
          grade_kelas: gradeKelas,
          jumlah_abk: jumlahAbk,
          jumlah_existing: row['Jumlah Existing'] || '',
          name: name,
          asn_status: row['Kriteria ASN'] || row['Status ASN'] || row['asn_status'] || '',
          nip: nipValue,
          rank_group: normalizedRankGroup,
          tmt: row['TMT'] || '',
          education_level: row['Pendidikan Terakhir'] || '',
          gender: row['Jenis Kelamin'] || row['gender'] || '',
          department: normalizedDepartment,
          keterangan_formasi: row['Keterangan Formasi (ABK-Existing)'] || row['Keterangan Formasi'] || '',
          keterangan_penempatan: row['Keternangan Penempatan'] || row['Keterangan Penempatan'] || '',
          keterangan_penugasan: row['Keterangan Penugasan Tambahan'] || row['Keterangan Penugasan'] || '',
          keterangan_perubahan: row['Keterangan Perubahan'] || '',
          position_type: row['Jenis Jabatan'] || '',
          row_type: rowType,
        };

        // Validate based on row type
        if (rowType === 'employee') {
          if (!parsedRow.name) {
            parsedRow.error = 'Nama wajib diisi';
          } else if (!parsedRow.asn_status) {
            parsedRow.error = 'Kriteria ASN wajib diisi';
          } else if (isAdminPusat && !parsedRow.department) {
            parsedRow.error = 'Unit kerja wajib diisi';
          } else if (isAdminPusat && !DEPARTMENTS.includes(parsedRow.department as Department)) {
            parsedRow.error = `Unit kerja "${rawDepartment}" tidak valid`;
          }
        } else if (rowType === 'position_reference') {
          if (!parsedRow.position_name) {
            parsedRow.error = 'Jabatan wajib diisi';
          } else if (!parsedRow.grade_kelas) {
            parsedRow.error = 'Grade/Kelas Jabatan wajib diisi';
          } else if (!parsedRow.jumlah_abk) {
            parsedRow.error = 'Jumlah ABK wajib diisi';
          } else if (isAdminPusat && !parsedRow.department) {
            parsedRow.error = 'Unit kerja wajib diisi';
          } else if (isAdminPusat && !DEPARTMENTS.includes(parsedRow.department as Department)) {
            parsedRow.error = `Unit kerja "${rawDepartment}" tidak valid`;
          }
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
        toast({ variant: 'destructive', title: 'File kosong', description: 'File CSV tidak memiliki data' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1);

      const parsed: ParsedRow[] = dataRows.map((line) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        const positionName = values[headers.indexOf('jabatan sesuai kepmen 202 tahun 2024')] || values[headers.indexOf('position_name')] || '';
        const gradeKelas = values[headers.indexOf('grade/\nkelas jabatan')] || values[headers.indexOf('grade/ kelas jabatan')] || values[headers.indexOf('grade/kelas jabatan')] || '';
        const jumlahAbk = values[headers.indexOf('jumlah abk')] || '';
        const name = values[headers.indexOf('nama pemangku')] || values[headers.indexOf('name')] || '';
        const nipValue = values[headers.indexOf('nip')] || '';

        // Determine row type based on presence of employee name
        // If no name but has position data (jabatan, grade, abk) → position_reference
        // If has name → employee (NIP is optional for Non ASN)
        let rowType: 'employee' | 'position_reference' = 'employee';

        if (!name && positionName && gradeKelas && jumlahAbk) {
          rowType = 'position_reference';
        }

        const row: ParsedRow = {
          no: values[headers.indexOf('no')] || '',
          position_name: positionName,
          grade_kelas: gradeKelas,
          jumlah_abk: jumlahAbk,
          jumlah_existing: values[headers.indexOf('jumlah existing')] || '',
          name: name,
          asn_status: values[headers.indexOf('kriteria asn')] || values[headers.indexOf('asn_status')] || '',
          nip: nipValue,
          rank_group: values[headers.indexOf('pangkat\ngolongan')] || values[headers.indexOf('pangkat golongan')] || values[headers.indexOf('rank_group')] || '',
          tmt: values[headers.indexOf('tmt')] || '',
          education_level: values[headers.indexOf('pendidikan terakhir')] || '',
          gender: values[headers.indexOf('jenis kelamin')] || '',
          department: isAdminPusat
            ? values[headers.indexOf('unit kerja')] || values[headers.indexOf('department')] || ''
            : profile?.department || '',
          keterangan_formasi: values[headers.indexOf('keterangan formasi (abk-existing)')] || values[headers.indexOf('keterangan formasi')] || '',
          keterangan_penempatan: values[headers.indexOf('keternangan penempatan')] || values[headers.indexOf('keterangan penempatan')] || '',
          keterangan_penugasan: values[headers.indexOf('keterangan penugasan tambahan')] || '',
          keterangan_perubahan: values[headers.indexOf('keterangan perubahan')] || '',
          position_type: values[headers.indexOf('jenis jabatan')] || '',
          row_type: rowType,
        };

        // Validate based on row type
        if (rowType === 'employee') {
          if (!row.name) {
            row.error = 'Nama wajib diisi';
          } else if (!row.asn_status) {
            row.error = 'Kriteria ASN wajib diisi';
          } else if (isAdminPusat && !row.department) {
            row.error = 'Unit kerja wajib diisi';
          } else if (isAdminPusat && !DEPARTMENTS.includes(row.department as any)) {
            row.error = `Unit kerja "${row.department}" tidak valid`;
          }
        } else if (rowType === 'position_reference') {
          if (!row.position_name) {
            row.error = 'Jabatan wajib diisi';
          } else if (!row.grade_kelas) {
            row.error = 'Grade/Kelas Jabatan wajib diisi';
          } else if (!row.jumlah_abk) {
            row.error = 'Jumlah ABK wajib diisi';
          } else if (isAdminPusat && !row.department) {
            row.error = 'Unit kerja wajib diisi';
          } else if (isAdminPusat && !DEPARTMENTS.includes(row.department as any)) {
            row.error = `Unit kerja "${row.department}" tidak valid`;
          }
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
        if (row.row_type === 'employee') {
          // Normalize gender
          let gender = row.gender;
          if (gender === 'L') gender = 'Laki-laki';
          if (gender === 'P') gender = 'Perempuan';

          const { data: inserted, error } = await supabase
            .from('employees')
            .insert({
              nip: row.nip || null,
              name: row.name,
              position_name: row.position_name || null,
              asn_status: row.asn_status,
              rank_group: row.rank_group || null,
              department: row.department,
              gender: gender || null,
              keterangan_formasi: row.keterangan_formasi || null,
              keterangan_penempatan: row.keterangan_penempatan || null,
              keterangan_penugasan: row.keterangan_penugasan || null,
              keterangan_perubahan: row.keterangan_perubahan || null,
            })
            .select('id')
            .single();

          if (error) {
            if (error.code === '23505') {
              result.errors.push({ row: i + 2, error: `NIP ${row.nip} sudah terdaftar` });
            } else {
              result.errors.push({ row: i + 2, error: error.message });
            }
            result.failed++;
          } else {
            // If education level provided, insert education history
            if (row.education_level && inserted) {
              await supabase.from('education_history').insert({
                employee_id: inserted.id,
                level: row.education_level,
              });
            }
            result.success++;
          }
        } else if (row.row_type === 'position_reference') {
          // Save to position_references table
          const { error } = await supabase
            .from('position_references')
            .insert({
              position_name: row.position_name,
              grade: row.grade_kelas ? parseInt(row.grade_kelas, 10) : null,
              abk_count: row.jumlah_abk ? parseInt(row.jumlah_abk, 10) : 0,
              department: row.department,
              position_category: row.position_type || 'Umum',
              position_order: 0,
            });

          if (error) {
            result.errors.push({ row: i + 2, error: error.message });
            result.failed++;
          } else {
            result.success++;
          }
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
    const wb = XLSX.utils.book_new();
    
    const dept = isAdminPusat ? 'BBPVP Bekasi' : profile?.department;
    const sampleData = [
      {
        'No': 1,
        'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Analis Kepegawaian Ahli Muda',
        'Grade/\nKelas Jabatan': '8',
        'Jumlah ABK': 2,
        'Jumlah Existing': 1,
        'Nama Pemangku': 'Budi Santoso',
        'Kriteria ASN': 'PNS',
        'NIP': '199001012020121001',
        'Pangkat\nGolongan': 'Penata Muda Tk I (III/b)',
        'TMT': '01/03/2020',
        'Pendidikan Terakhir': 'S1',
        'Jenis Kelamin': 'Laki-laki',
        'Keterangan Formasi (ABK-Existing)': '',
        'Keternangan Penempatan': '',
        'Keterangan Penugasan Tambahan': '',
        'Keterangan Perubahan': '',
        'Jenis Jabatan': 'Fungsional',
        'Unit Kerja': dept,
      },
      {
        'No': 2,
        'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Kepala Sub Bagian',
        'Grade/\nKelas Jabatan': '10',
        'Jumlah ABK': 1,
        'Jumlah Existing': 1,
        'Nama Pemangku': 'Siti Nurhaliza',
        'Kriteria ASN': 'PNS',
        'NIP': '199203052021012002',
        'Pangkat\nGolongan': 'Penata Tk I (III/d)',
        'TMT': '01/04/2021',
        'Pendidikan Terakhir': 'S2',
        'Jenis Kelamin': 'Perempuan',
        'Keterangan Formasi (ABK-Existing)': '',
        'Keternangan Penempatan': '',
        'Keterangan Penugasan Tambahan': '',
        'Keterangan Perubahan': '',
        'Jenis Jabatan': 'Struktural',
        'Unit Kerja': isAdminPusat ? 'Setditjen Binalavotas' : dept,
      },
      {
        'No': 3,
        'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Tenaga Administrasi',
        'Grade/\nKelas Jabatan': '6',
        'Jumlah ABK': 3,
        'Jumlah Existing': 2,
        'Nama Pemangku': 'Ahmad Fauzi',
        'Kriteria ASN': 'PPPK',
        'NIP': '',
        'Pangkat\nGolongan': 'IX',
        'TMT': '01/01/2023',
        'Pendidikan Terakhir': 'SMA/SMK',
        'Jenis Kelamin': 'Laki-laki',
        'Keterangan Formasi (ABK-Existing)': '',
        'Keternangan Penempatan': '',
        'Keterangan Penugasan Tambahan': '',
        'Keterangan Perubahan': '',
        'Jenis Jabatan': 'Pelaksana',
        'Unit Kerja': isAdminPusat ? 'BPVP Surakarta' : dept,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 6 },   // No
      { wch: 40 },  // Jabatan
      { wch: 12 },  // Grade/Kelas Jabatan
      { wch: 12 },  // Jumlah ABK
      { wch: 14 },  // Jumlah Existing
      { wch: 25 },  // Nama Pemangku
      { wch: 12 },  // Kriteria ASN
      { wch: 20 },  // NIP
      { wch: 25 },  // Pangkat Golongan
      { wch: 14 },  // TMT
      { wch: 18 },  // Pendidikan Terakhir
      { wch: 14 },  // Jenis Kelamin
      { wch: 25 },  // Ket Formasi
      { wch: 25 },  // Ket Penempatan
      { wch: 28 },  // Ket Penugasan
      { wch: 22 },  // Ket Perubahan
      { wch: 16 },  // Jenis Jabatan
      { wch: 25 },  // Unit Kerja
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

    // Reference sheet
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
        'Golongan (Pilihan)': RANK_GROUPS[i] || '',
        'Unit Kerja (Pilihan)': isAdminPusat ? (DEPARTMENTS[i] || '') : (i === 0 ? profile?.department : ''),
      });
    }

    const wsRef = XLSX.utils.json_to_sheet(refData);
    wsRef['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

    // Instructions
    const instructions = [
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== PETUNJUK PENGGUNAAN ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '1. Isi data pegawai di sheet "Data Pegawai"' },
      { 'Panduan Pengisian Template Import Pegawai': '2. Hapus contoh data yang ada, ganti dengan data Anda' },
      { 'Panduan Pengisian Template Import Pegawai': '3. Lihat sheet "Referensi" untuk pilihan nilai yang valid' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== KETERANGAN KOLOM ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jabatan Sesuai Kepmen 202 Tahun 2024: Nama jabatan pegawai' },
      { 'Panduan Pengisian Template Import Pegawai': 'Grade/Kelas Jabatan: Grade atau kelas jabatan (angka)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jumlah ABK: Jumlah Analisis Beban Kerja' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jumlah Existing: Jumlah pegawai yang ada saat ini' },
      { 'Panduan Pengisian Template Import Pegawai': 'Nama Pemangku: WAJIB diisi (nama lengkap tanpa gelar)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Kriteria ASN: WAJIB (PNS / PPPK / Non ASN)' },
      { 'Panduan Pengisian Template Import Pegawai': 'NIP: 18 digit (opsional untuk Non ASN)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Pangkat Golongan PNS: Format lengkap, contoh "Penata Muda Tk I (III/b)"' },
      { 'Panduan Pengisian Template Import Pegawai': 'Pangkat Golongan PPPK: I sampai XVII' },
      { 'Panduan Pengisian Template Import Pegawai': 'TMT: Tanggal Mulai Tugas (format: DD/MM/YYYY)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Pendidikan Terakhir: SD/SMP/SMA-SMK/D1/D2/D3/D4/S1/S2/S3' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jenis Kelamin: Laki-laki / Perempuan (atau L/P)' },
      { 'Panduan Pengisian Template Import Pegawai': 'Keterangan Formasi (ABK-Existing): Keterangan ABK vs Existing' },
      { 'Panduan Pengisian Template Import Pegawai': 'Keternangan Penempatan: Info penempatan' },
      { 'Panduan Pengisian Template Import Pegawai': 'Keterangan Penugasan Tambahan: Info penugasan tambahan' },
      { 'Panduan Pengisian Template Import Pegawai': 'Keterangan Perubahan: Info perubahan' },
      { 'Panduan Pengisian Template Import Pegawai': 'Jenis Jabatan: Struktural / Fungsional / Pelaksana' },
      { 'Panduan Pengisian Template Import Pegawai': isAdminPusat 
        ? 'Unit Kerja: WAJIB, harus sesuai daftar di sheet Referensi' 
        : `Unit Kerja: Otomatis terisi "${profile?.department}"` },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': '=== KONVERSI OTOMATIS ===' },
      { 'Panduan Pengisian Template Import Pegawai': '' },
      { 'Panduan Pengisian Template Import Pegawai': 'Sistem akan otomatis mengkonversi:' },
      { 'Panduan Pengisian Template Import Pegawai': '- Nama unit kerja panjang → singkatan (BBPVP, BPVP)' },
      { 'Panduan Pengisian Template Import Pegawai': '- "III/b" → "Penata Muda Tk I (III/b)"' },
      { 'Panduan Pengisian Template Import Pegawai': '- "L" → "Laki-laki", "P" → "Perempuan"' },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions, { skipHeader: true });
    wsInstructions['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Panduan');

    XLSX.writeFile(wb, 'template-import-pegawai.xlsx');
  };

  const validEmployeeCount = parsedData.filter(r => !r.error && r.row_type === 'employee').length;
  const validPositionCount = parsedData.filter(r => !r.error && r.row_type === 'position_reference').length;
  const validCount = validEmployeeCount + validPositionCount;
  const invalidCount = parsedData.filter(r => r.error).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Import Data Pegawai</h1>
          <p className="page-description">
            Import data pegawai dari file Excel atau CSV
            {!isAdminPusat && ` ke ${profile?.department}`}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Upload File</CardTitle>
              <CardDescription>
                {isAdminPusat 
                  ? 'Pastikan kolom Unit Kerja terisi dengan unit kerja yang valid'
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
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>{validEmployeeCount} data pegawai</span>
                      </div>
                      {validPositionCount > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span>{validPositionCount} data peta jabatan</span>
                        </div>
                      )}
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
                      Import {validEmployeeCount > 0 ? `${validEmployeeCount} Pegawai` : ''}{validEmployeeCount > 0 && validPositionCount > 0 ? ' + ' : ''}{validPositionCount > 0 ? `${validPositionCount} Peta Jabatan` : ''}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Panduan Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Format kolom Excel:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>No</li>
                  <li>Jabatan Sesuai Kepmen 202 Tahun 2024</li>
                  <li>Grade/Kelas Jabatan</li>
                  <li>Jumlah ABK</li>
                  <li>Jumlah Existing</li>
                  <li>Nama Pemangku (wajib)</li>
                  <li>Kriteria ASN (wajib)</li>
                  <li>NIP (opsional, 18 digit)</li>
                  <li>Pangkat Golongan</li>
                  <li>TMT</li>
                  <li>Pendidikan Terakhir</li>
                  <li>Jenis Kelamin</li>
                  <li>Keterangan Formasi (ABK-Existing)</li>
                  <li>Keternangan Penempatan</li>
                  <li>Keterangan Penugasan Tambahan</li>
                  <li>Keterangan Perubahan</li>
                  <li>Jenis Jabatan</li>
                  <li>Unit Kerja {isAdminPusat ? '(wajib)' : '(diabaikan)'}</li>
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
              <CardDescription>Kolom yang ditampilkan sesuai dengan tipe data (Pegawai atau Peta Jabatan)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>ABK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kriteria ASN</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                        <TableCell className="text-xs font-medium">
                          {row.row_type === 'position_reference' ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Peta Jabatan</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Pegawai</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                        <TableCell className="text-sm">{row.grade_kelas || '-'}</TableCell>
                        <TableCell className="text-sm">{row.jumlah_abk || '-'}</TableCell>
                        <TableCell className="text-sm">{row.name || '-'}</TableCell>
                        <TableCell className="text-sm">{row.asn_status || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{row.nip || '-'}</TableCell>
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
