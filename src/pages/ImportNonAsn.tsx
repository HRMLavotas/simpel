import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, DEPARTMENT_ALIASES, type Department } from '@/lib/constants';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

interface ParsedNonAsn {
  nik: string;
  name: string;
  position: string;
  education: string | null;
  education_major: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  department: string; // Changed from Department to string to support dynamic departments from database
  type_non_asn: string;
  job_description: string | null;
  notes: string | null;
  error?: string;
  row?: number;
}

const normalizeHeader = (h: string) => {
  if (!h) return '';
  return h
    .replace(/\*/g, '') // Remove asterisks
    .replace(/\n/g, ' ') // Replace newlines with space
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .trim()
    .toLowerCase();
};

const findCol = (row: Record<string, string>, ...keys: string[]): string => {
  // Try direct match first (case-insensitive)
  for (const k of keys) {
    const lowerK = k.toLowerCase();
    for (const [rowKey, val] of Object.entries(row)) {
      if (rowKey.toLowerCase() === lowerK && val !== undefined && val !== '') {
        return val;
      }
    }
  }
  
  // Try normalized match
  const normalizedKeys = keys.map(normalizeHeader);
  for (const [rawKey, val] of Object.entries(row)) {
    const norm = normalizeHeader(rawKey);
    if (normalizedKeys.includes(norm) && val !== undefined && val !== '') {
      return val;
    }
  }
  
  // Try partial match (contains)
  for (const k of keys) {
    const lowerK = k.toLowerCase();
    for (const [rowKey, val] of Object.entries(row)) {
      if (rowKey.toLowerCase().includes(lowerK) && val !== undefined && val !== '') {
        return val;
      }
    }
  }
  
  return '';
};

// Parse education string like "S1 Teknik Informatika" into level and major
const parseEducation = (eduStr: string | null): { level: string; major: string } | null => {
  if (!eduStr || eduStr === '-') return null;
  
  const trimmed = eduStr.trim();
  const levels = ['SD/Sederajat', 'SLTP/SMP Sederajat', 'SLTA/SMA Sederajat', 'D1', 'D2', 'D3', 'DIII', 'D4', 'DIV', 'S1', 'S2', 'S3'];
  
  // Try to extract level from beginning (first word or phrase)
  const words = trimmed.split(/\s+/);
  
  // Check first word
  const firstWord = words[0].toUpperCase();
  for (const level of levels) {
    if (firstWord === level.toUpperCase() || firstWord === level.replace(/\//g, '').toUpperCase()) {
      // First word is the level, rest is major
      const major = words.slice(1).join(' ').trim() || '';
      return { level, major };
    }
  }
  
  // Check first two words (for "SLTA/SMA Sederajat" etc)
  if (words.length >= 2) {
    const firstTwoWords = words.slice(0, 2).join(' ').toUpperCase();
    for (const level of levels) {
      if (firstTwoWords === level.toUpperCase()) {
        const major = words.slice(2).join(' ').trim() || '';
        return { level, major };
      }
    }
  }
  
  // Fallback: check if the entire string is just a level
  for (const level of levels) {
    if (trimmed.toUpperCase() === level.toUpperCase()) {
      return { level, major: '' };
    }
  }
  
  // If no level found, treat entire string as major with empty level
  return { level: '', major: trimmed };
};

function ImportNonAsn() {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<ParsedNonAsn[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  const userDept = profile?.department;

  // Fetch available departments from database
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('name')
          .order('name');
        
        if (error) throw error;
        
        const deptNames = (data || []).map(d => d.name);
        setAvailableDepartments(deptNames);
        console.log('Available departments from database:', deptNames);
      } catch (error: any) {
        console.error('Error fetching departments:', error);
        // Fallback to constants if database fetch fails
        setAvailableDepartments([...DEPARTMENTS]);
      }
    };
    
    fetchDepartments();
  }, []);

  const parseExcelFile = (file: File, deptList: string[]): Promise<ParsedNonAsn[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' });

          if (rows.length === 0) {
            reject(new Error('File Excel kosong'));
            return;
          }

          const parsed: ParsedNonAsn[] = [];

          // Debug: log first row to see headers
          if (rows.length > 0) {
            console.log('First row headers:', Object.keys(rows[0]));
            console.log('First row data:', rows[0]);
          }

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Skip rows where all values are empty or just numbers (like row numbers)
            const values = Object.values(row).filter(v => v && v.trim() !== '');
            if (values.length === 0) continue;
            
            // Skip if first column is just a number (row number column)
            const firstValue = Object.values(row)[0];
            if (firstValue && /^\d+$/.test(firstValue.trim()) && values.length === 1) continue;

            // Try to find NIK and Name with more variations
            const nik = findCol(row, 'NIK', 'nik', 'nomor induk', 'no induk');
            const name = findCol(row, 'Nama', 'nama', 'name', 'nama lengkap');
            
            // Skip if both NIK and name are empty
            if (!nik && !name) continue;

            const position = findCol(row, 'Jabatan', 'jabatan', 'position', 'posisi');
            const education = findCol(row, 'Pendidikan', 'pendidikan', 'education', 'pend');
            const birthPlace = findCol(row, 'Tempat Tanggal Lahir', 'tempat lahir', 'birth_place', 'tempat tgl lahir', 'ttl');
            const birthDate = findCol(row, 'Tanggal Lahir', 'tanggal lahir', 'birth_date', 'tgl lahir');
            const gender = findCol(row, 'Jenis Kelamin', 'jenis kelamin', 'gender', 'kelamin', 'jk');
            const religion = findCol(row, 'Agama', 'agama', 'religion');
            const department = findCol(row, 'Unit Kerja', 'unit kerja', 'department', 'unit', 'dept');
            const typeNonAsn = findCol(row, 'Type Non ASN', 'type non asn', 'type_non_asn', 'tipe non asn', 'tipe', 'type');
            const jobDescription = findCol(row, 'Deskripsi Tugas', 'deskripsi tugas', 'job_description', 'tugas');
            const notes = findCol(row, 'Catatan', 'catatan', 'notes', 'keterangan', 'ket');

            // Parse education to extract level and major
            const parsedEducation = parseEducation(education);

            // Determine department
            let finalDept: string;
            if (isAdminPusat && department) {
              // Step 1: Check DEPARTMENT_ALIASES first (exact mapping)
              if (DEPARTMENT_ALIASES[department]) {
                finalDept = DEPARTMENT_ALIASES[department];
              } else {
                // Step 2: Try exact match with database departments
                let matchedDept = deptList.find(d => 
                  d.toLowerCase() === department.toLowerCase()
                );
                
                // Step 3: If no exact match, try partial match
                if (!matchedDept) {
                  matchedDept = deptList.find(d => 
                    d.toLowerCase().includes(department.toLowerCase()) ||
                    department.toLowerCase().includes(d.toLowerCase())
                  );
                }
                
                // Step 4: If still no match, try matching key words
                if (!matchedDept) {
                  const deptWords = department.toLowerCase().split(/\s+/);
                  matchedDept = deptList.find(d => {
                    const targetWords = d.toLowerCase().split(/\s+/);
                    // Check if at least 2 significant words match
                    const matchCount = deptWords.filter(word => 
                      word.length > 3 && targetWords.some(tw => tw.includes(word) || word.includes(tw))
                    ).length;
                    return matchCount >= 2;
                  });
                }
                
                finalDept = matchedDept || (userDept as string) || 'Setditjen Binalavotas';
              }
            } else {
              finalDept = (userDept as string) || 'Setditjen Binalavotas';
            }

            // Parse birth date if in format "DD/MM/YYYY" or "DD-MM-YYYY"
            let parsedBirthDate: string | null = null;
            if (birthDate) {
              const dateMatch = birthDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
              if (dateMatch) {
                const [, day, month, year] = dateMatch;
                parsedBirthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }

            // Validation
            let error = '';
            if (!nik) error = 'NIK wajib diisi';
            else if (!name) error = 'Nama wajib diisi';
            else if (!position) error = 'Jabatan wajib diisi';
            else if (isAdminPusat && department && !DEPARTMENT_ALIASES[department] && !deptList.find(d => 
              d.toLowerCase() === department.toLowerCase() ||
              d.toLowerCase().includes(department.toLowerCase()) ||
              department.toLowerCase().includes(d.toLowerCase())
            )) {
              error = `Unit kerja "${department}" tidak ditemukan. Gunakan nama unit kerja yang sesuai.`;
            }

            parsed.push({
              nik: nik || '',
              name: name || '',
              position: position || '',
              education: parsedEducation?.level || null,
              education_major: parsedEducation?.major || null,
              birth_place: birthPlace || null,
              birth_date: parsedBirthDate,
              gender: gender || null,
              religion: religion || null,
              department: finalDept,
              type_non_asn: typeNonAsn || 'Tenaga Alih Daya',
              job_description: jobDescription || null,
              notes: notes || null,
              error,
              row: i + 2, // Excel row number (1-indexed + header)
            });
          }

          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        variant: 'destructive',
        title: 'Format tidak valid',
        description: 'Gunakan format Excel (.xlsx atau .xls)',
      });
      return;
    }

    setFile(f);
    setResult(null);
    setProgress(0);

    try {
      const parsed = await parseExcelFile(f, availableDepartments);
      setPreview(parsed);
      
      const validCount = parsed.filter(p => !p.error).length;
      const errorCount = parsed.filter(p => p.error).length;
      
      if (validCount === 0 && errorCount > 0) {
        // Show sample errors for debugging
        const sampleErrors = parsed.slice(0, 3).map(p => `Baris ${p.row}: ${p.error || 'Data tidak lengkap'}`).join('\n');
        toast({
          variant: 'destructive',
          title: 'Semua data error',
          description: `Periksa format Excel Anda. Contoh error:\n${sampleErrors}`,
        });
      } else {
        toast({
          title: 'File berhasil dibaca',
          description: `${validCount} data valid, ${errorCount} error dari ${parsed.length} total`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal membaca file',
        description: error.message,
      });
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const parsed = await parseExcelFile(file, availableDepartments);
      const errors: { row: number; error: string }[] = [];
      let successCount = 0;
      let skippedCount = 0;

      // Get all existing NIKs for Non-ASN employees to avoid duplicates
      const { data: existingEmployees } = await supabase
        .from('employees')
        .select('nip, name, department')
        .eq('asn_status', 'Non ASN');
      
      const existingNIKs = new Map((existingEmployees || []).map(e => [e.nip, { name: e.name, department: e.department }]));

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        setProgress(Math.round(((i + 1) / parsed.length) * 100));

        // Skip items with errors
        if (item.error) {
          errors.push({
            row: item.row || i + 2,
            error: item.error,
          });
          continue;
        }

        // Validation
        if (!item.nik || !item.name || !item.position) {
          errors.push({
            row: item.row || i + 2,
            error: 'NIK, Nama, dan Jabatan wajib diisi',
          });
          continue;
        }

        // Skip if NIK already exists
        if (existingNIKs.has(item.nik)) {
          skippedCount++;
          const existing = existingNIKs.get(item.nik);
          errors.push({
            row: item.row || i + 2,
            error: `NIK ${item.nik} sudah ada di database (${existing?.name || 'Unknown'} - ${existing?.department || 'Unknown'}) - dilewati`,
          });
          continue;
        }

        try {
          const { error } = await supabase.from('employees').insert([{
            nip: item.nik,  // Map NIK to nip field
            name: item.name,
            position_name: item.position,  // Map position to position_name
            birth_place: item.birth_place,
            birth_date: item.birth_date,
            gender: item.gender,
            religion: item.religion,
            department: item.department,
            asn_status: 'Non ASN',
            rank_group: item.type_non_asn,  // Map type_non_asn to rank_group
            keterangan_penugasan: item.job_description,  // Map job_description to keterangan_penugasan
            keterangan_perubahan: item.notes,  // Map notes to keterangan_perubahan
          }]);

          if (error) throw error;
          successCount++;
          existingNIKs.set(item.nik, { name: item.name, department: item.department }); // Add to map to prevent duplicates within the same import
        } catch (error: any) {
          errors.push({
            row: item.row || i + 2,
            error: error.message || 'Gagal menyimpan data',
          });
        }
      }

      setResult({
        success: successCount,
        failed: errors.length,
        errors,
      });

      if (successCount > 0) {
        toast({
          title: 'Import selesai',
          description: `${successCount} data berhasil diimport${skippedCount > 0 ? `, ${skippedCount} duplikat dilewati` : ''}, ${errors.length - skippedCount} error`,
        });
      } else if (skippedCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak ada data baru',
          description: `Semua ${skippedCount} data sudah ada di database`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import gagal',
        description: error.message,
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // For admin pusat, show examples with different departments
    // For regular users, use their department
    const sampleData = isAdminPusat ? [
      {
        'No.': 1,
        'NIK': '3276012302800010',
        'Nama': 'Wachyudi Maulana',
        'Jabatan': 'Pengemudi',
        'Pendidikan': 'SLTA/SMA Sederajat',
        'Jurusan': '',
        'Tempat Tanggal Lahir': 'Jakarta',
        'Jenis Kelamin': 'Laki-laki',
        'Agama': 'Islam',
        'Unit Kerja': 'Setditjen Binalavotas',
        'Type Non ASN': 'Tenaga Alih Daya',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
      {
        'No.': 2,
        'NIK': '3174091103750012',
        'Nama': 'Teguh Prihatin',
        'Jabatan': 'Petugas Kebersihan',
        'Pendidikan': 'SD/Sederajat',
        'Jurusan': '',
        'Tempat Tanggal Lahir': 'Bandung',
        'Jenis Kelamin': 'Laki-laki',
        'Agama': 'Islam',
        'Unit Kerja': 'Direktorat Bina Stankomproglat',
        'Type Non ASN': 'Tenaga Alih Daya',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
      {
        'No.': 3,
        'NIK': '3275034406000021',
        'Nama': 'Jenita Permata Arini',
        'Jabatan': 'Pramubakti',
        'Pendidikan': 'DIII',
        'Jurusan': 'Sistem Informasi',
        'Tempat Tanggal Lahir': 'Surabaya',
        'Jenis Kelamin': 'Perempuan',
        'Agama': 'Islam',
        'Unit Kerja': 'Direktorat Bina Marga',
        'Type Non ASN': 'Tenaga Ahli',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
    ] : [
      {
        'No.': 1,
        'NIK': '3276012302800010',
        'Nama': 'Wachyudi Maulana',
        'Jabatan': 'Pengemudi',
        'Pendidikan': 'SLTA/SMA Sederajat',
        'Jurusan': '',
        'Tempat Tanggal Lahir': 'Jakarta',
        'Jenis Kelamin': 'Laki-laki',
        'Agama': 'Islam',
        'Unit Kerja': userDept,
        'Type Non ASN': 'Tenaga Alih Daya',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
      {
        'No.': 2,
        'NIK': '3174091103750012',
        'Nama': 'Teguh Prihatin',
        'Jabatan': 'Petugas Kebersihan',
        'Pendidikan': 'SD/Sederajat',
        'Jurusan': '',
        'Tempat Tanggal Lahir': 'Bandung',
        'Jenis Kelamin': 'Laki-laki',
        'Agama': 'Islam',
        'Unit Kerja': userDept,
        'Type Non ASN': 'Tenaga Alih Daya',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
      {
        'No.': 3,
        'NIK': '3275034406000021',
        'Nama': 'Jenita Permata Arini',
        'Jabatan': 'Pramubakti',
        'Pendidikan': 'DIII',
        'Jurusan': 'Sistem Informasi',
        'Tempat Tanggal Lahir': 'Surabaya',
        'Jenis Kelamin': 'Perempuan',
        'Agama': 'Islam',
        'Unit Kerja': userDept,
        'Type Non ASN': 'Tenaga Alih Daya',
        'Deskripsi Tugas': '',
        'Catatan': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 18 }, { wch: 30 }, { wch: 25 }, { wch: 25 },
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
      { wch: 20 }, { wch: 30 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Non ASN');

    XLSX.writeFile(wb, 'template-import-non-asn.xlsx');
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setPreview([]);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Import Data Non-ASN</h1>
          <p className="page-description">
            Import data tenaga Non-ASN (Tenaga Alih Daya dan Tenaga Ahli) dari file Excel
            {isAdminPusat && (
              <span className="block mt-1 text-xs text-primary">
                💡 Sebagai Admin Pusat, Anda dapat mengimport data ke berbagai unit kerja sekaligus. 
                Pastikan kolom "Unit Kerja" di Excel diisi dengan nama unit kerja yang sesuai.
              </span>
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload File Excel</CardTitle>
            <CardDescription>
              Download template terlebih dahulu, isi data, lalu upload kembali.
              {isAdminPusat && (
                <span className="block mt-2 text-xs">
                  Template untuk Admin Pusat berisi contoh dengan unit kerja berbeda. 
                  Setiap pegawai akan masuk ke unit kerjanya masing-masing sesuai kolom "Unit Kerja".
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {!file ? (
                <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">Klik untuk upload file</p>
                  <p className="mt-1 text-xs text-muted-foreground">Format: Excel (.xlsx) - Template Non-ASN</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {preview.length > 0 && (
              <div className="space-y-4">
                {/* Debug Info */}
                {preview.filter(p => p.error).length === preview.length && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Semua Data Error</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">Kemungkinan format header Excel tidak sesuai. Pastikan:</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Header ada di baris pertama</li>
                        <li>Kolom wajib: NIK, Nama, Jabatan</li>
                        <li>Tidak ada baris kosong di atas header</li>
                        <li>Gunakan template yang sudah disediakan</li>
                      </ul>
                      <p className="mt-2 text-xs">Buka console browser (F12) untuk melihat detail header yang terdeteksi.</p>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Preview Data Non-ASN
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({preview.filter(p => !p.error).length} valid, {preview.filter(p => p.error).length} error dari {preview.length} total)
                    </span>
                  </h3>
                </div>
                
                {/* Info for Admin Pusat about department distribution */}
                {isAdminPusat && preview.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Distribusi Unit Kerja</AlertTitle>
                    <AlertDescription>
                      <p className="text-xs mb-2">Data akan diimport ke unit kerja masing-masing sesuai kolom "Unit Kerja" di Excel:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(preview.map(p => p.department))).map(dept => {
                          const count = preview.filter(p => p.department === dept && !p.error).length;
                          return (
                            <span key={dept} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                              {dept}: {count} pegawai
                            </span>
                          );
                        })}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="border rounded-lg overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">Baris</TableHead>
                        <TableHead className="w-[140px]">NIK</TableHead>
                        <TableHead className="min-w-[200px]">Nama</TableHead>
                        <TableHead className="min-w-[180px]">Jabatan</TableHead>
                        <TableHead className="min-w-[150px]">Pendidikan</TableHead>
                        <TableHead className="min-w-[150px]">Jurusan</TableHead>
                        <TableHead className="min-w-[120px]">Jenis Kelamin</TableHead>
                        <TableHead className="min-w-[100px]">Agama</TableHead>
                        <TableHead className="min-w-[200px]">Unit Kerja</TableHead>
                        <TableHead className="min-w-[150px]">Type Non ASN</TableHead>
                        <TableHead className="min-w-[200px]">Catatan</TableHead>
                        <TableHead className="min-w-[200px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((item, idx) => (
                        <TableRow key={idx} className={item.error ? 'bg-destructive/10' : ''}>
                          <TableCell className="text-xs text-muted-foreground">{item.row || idx + 2}</TableCell>
                          <TableCell className="font-mono text-xs">{item.nik || '-'}</TableCell>
                          <TableCell className="font-medium">{item.name || '-'}</TableCell>
                          <TableCell>{item.position || '-'}</TableCell>
                          <TableCell className="text-xs">{item.education || '-'}</TableCell>
                          <TableCell className="text-xs">{item.education_major || '-'}</TableCell>
                          <TableCell className="text-xs">{item.gender || '-'}</TableCell>
                          <TableCell className="text-xs">{item.religion || '-'}</TableCell>
                          <TableCell className="text-xs">{item.department}</TableCell>
                          <TableCell className="text-xs">{item.type_non_asn}</TableCell>
                          <TableCell className="text-xs">{item.notes || '-'}</TableCell>
                          <TableCell>
                            {item.error ? (
                              <span className="text-xs text-destructive">{item.error}</span>
                            ) : (
                              <span className="text-xs text-green-600">✓ Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Error Log Section */}
                {preview.filter(p => p.error).length > 0 && (
                  <div className="space-y-3">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ditemukan {preview.filter(p => p.error).length} Error</AlertTitle>
                      <AlertDescription>
                        <p className="text-xs mb-2">Perbaiki error di bawah ini sebelum melakukan import. Data dengan error tidak akan diimport.</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* Error summary by type */}
                          {(() => {
                            const errorTypes: Record<string, number> = {};
                            preview.filter(p => p.error).forEach(p => {
                              const errorKey = p.error?.includes('NIK') ? 'NIK kosong' :
                                              p.error?.includes('Nama') ? 'Nama kosong' :
                                              p.error?.includes('Jabatan') ? 'Jabatan kosong' :
                                              p.error?.includes('Unit kerja') ? 'Unit kerja tidak valid' :
                                              'Lainnya';
                              errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
                            });
                            return Object.entries(errorTypes).map(([type, count]) => (
                              <span key={type} className="inline-block bg-destructive/20 text-destructive px-2 py-1 rounded text-xs font-medium">
                                {type}: {count}
                              </span>
                            ));
                          })()}
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-destructive">
                        Detail Error
                      </h3>
                      <div className="border border-destructive/30 rounded-lg overflow-auto max-h-64 bg-destructive/5">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-20">Baris</TableHead>
                              <TableHead className="w-40">NIK</TableHead>
                              <TableHead className="min-w-[200px]">Nama</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.filter(p => p.error).map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs font-medium">{item.row || '-'}</TableCell>
                                <TableCell className="font-mono text-xs">{item.nik || '-'}</TableCell>
                                <TableCell className="text-sm">{item.name || '-'}</TableCell>
                                <TableCell className="text-xs text-destructive font-medium">{item.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {file && !importing && !result && (
              <Button 
                onClick={handleImport} 
                className="w-full"
                disabled={preview.filter(p => !p.error).length === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import {preview.filter(p => !p.error).length} Data Valid
              </Button>
            )}

            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Mengimport data...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <Alert variant={result.failed === 0 ? 'default' : 'destructive'}>
                  {result.failed === 0 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>Import Selesai</AlertTitle>
                  <AlertDescription>
                    {result.success} data berhasil diimport, {result.failed} gagal
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Error Log</h3>
                    <div className="border rounded-lg overflow-auto max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Baris</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.errors.map((err, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{err.row}</TableCell>
                              <TableCell className="text-xs text-red-600">{err.error}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Button onClick={resetImport} variant="outline" className="w-full">
                  Import File Baru
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default ImportNonAsn;
