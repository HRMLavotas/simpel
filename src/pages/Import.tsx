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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  employees: { success: number; failed: number; errors: { row: number; error: string }[] };
  positions: { success: number; failed: number; errors: { row: number; error: string }[] };
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

// Parse education string like "S3 Ilmu Administrasi" into level and major
const parseEducation = (eduStr: string | null): { level: string; major: string } | null => {
  if (!eduStr || eduStr === '-') return null;
  
  const trimmed = eduStr.trim();
  const levels = ['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
  
  // Try to extract level from beginning (first word)
  const words = trimmed.split(/\s+/);
  const firstWord = words[0].toUpperCase();
  
  if (levels.includes(firstWord)) {
    // First word is the level, rest is major
    const major = words.slice(1).join(' ').trim() || 'Tidak Ada';
    return { level: firstWord, major };
  }
  
  // Fallback: check if the entire string is just a level
  if (levels.includes(trimmed.toUpperCase())) {
    return { level: trimmed.toUpperCase(), major: 'Tidak Ada' };
  }
  
  return null;
};

// Parse NIP (18 digit) to extract birth date, TMT CPNS, and gender
// Format: YYYYMMDD YYYYMM G NNN
// Example: 19770601 200312 1 002
const parseNIP = (nip: string | null): {
  birth_date: string | null;
  tmt_cpns: string | null;
  gender: string | null;
} | null => {
  if (!nip) return null;
  
  // Remove spaces and validate length
  const cleanNIP = nip.replace(/\s/g, '');
  if (cleanNIP.length !== 18) return null;
  
  try {
    // Extract parts
    const birthDateStr = cleanNIP.substring(0, 8); // YYYYMMDD
    const tmtCpnsStr = cleanNIP.substring(8, 14);  // YYYYMM
    const genderCode = cleanNIP.substring(14, 15); // 1 or 2
    
    // Parse birth date: YYYYMMDD -> YYYY-MM-DD
    const birthYear = birthDateStr.substring(0, 4);
    const birthMonth = birthDateStr.substring(4, 6);
    const birthDay = birthDateStr.substring(6, 8);
    const birth_date = `${birthYear}-${birthMonth}-${birthDay}`;
    
    // Parse TMT CPNS: YYYYMM -> YYYY-MM-01 (assume first day of month)
    const tmtYear = tmtCpnsStr.substring(0, 4);
    const tmtMonth = tmtCpnsStr.substring(4, 6);
    const tmt_cpns = `${tmtYear}-${tmtMonth}-01`;
    
    // Parse gender: 1 = Laki-laki, 2 = Perempuan
    const gender = genderCode === '1' ? 'Laki-laki' : genderCode === '2' ? 'Perempuan' : null;
    
    // Validate dates
    const birthDateObj = new Date(birth_date);
    const tmtCpnsObj = new Date(tmt_cpns);
    
    if (isNaN(birthDateObj.getTime()) || isNaN(tmtCpnsObj.getTime())) {
      return null;
    }
    
    return { birth_date, tmt_cpns, gender };
  } catch (error) {
    console.error('Error parsing NIP:', error);
    return null;
  }
};

// Parse nama lengkap untuk ekstrak gelar depan dan belakang
// Example: "Dr. Ir. Abdullah Qiqi Asmara, S.T., M.Si., IPU"
// Result: { front_title: "Dr. Ir.", name: "Abdullah Qiqi Asmara", back_title: "S.T., M.Si., IPU" }
const parseName = (fullName: string | null): {
  front_title: string;
  name: string;
  back_title: string;
} => {
  if (!fullName) return { front_title: '', name: '', back_title: '' };
  
  const trimmed = fullName.trim();
  
  // Daftar gelar depan yang umum
  const frontTitles = [
    'Dr\\.?', 'dr\\.?', 'Prof\\.?', 'Ir\\.?', 'Drs\\.?', 'Dra\\.?', 
    'H\\.?', 'Hj\\.?', 'KH\\.?', 'Tn\\.?', 'Ny\\.?', 'Sdr\\.?', 'Sdri\\.?'
  ];
  
  // Regex untuk mendeteksi gelar depan (di awal string)
  const frontTitleRegex = new RegExp(`^((?:${frontTitles.join('|')})\\s*)+`, 'i');
  const frontMatch = trimmed.match(frontTitleRegex);
  
  let front_title = '';
  let remaining = trimmed;
  
  if (frontMatch) {
    front_title = frontMatch[0].trim();
    remaining = trimmed.substring(frontMatch[0].length).trim();
  }
  
  // Regex untuk mendeteksi gelar belakang (setelah koma atau di akhir)
  // Gelar belakang biasanya dipisah dengan koma: S.T., M.Si., IPU
  const backTitleRegex = /,\s*(.+)$/;
  const backMatch = remaining.match(backTitleRegex);
  
  let back_title = '';
  let name = remaining;
  
  if (backMatch) {
    back_title = backMatch[1].trim();
    name = remaining.substring(0, backMatch.index).trim();
  }
  
  return { front_title, name, back_title };
};

// ============ EMPLOYEE IMPORT ============

interface ParsedEmployee {
  name: string;
  front_title: string;
  back_title: string;
  nip: string;
  asn_status: string;
  position_sk: string; // Jabatan Sesuai SK
  position_name: string; // Jabatan Sesuai Kepmen
  position_type: string;
  rank_group: string;
  education_level: string;
  gender: string;
  birth_date: string;
  tmt_cpns: string;
  religion: string;
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
  position_order?: number; // Optional, untuk urutan tampilan
  error?: string;
}

// ============ COMPONENT ============

export default function Import() {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('preview');

  // ---- Unified state ----
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [empData, setEmpData] = useState<ParsedEmployee[]>([]);
  const [posData, setPosData] = useState<ParsedPosition[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Department selection
  const userDept = profile?.department || '';
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    isAdminPusat ? '' : userDept
  );

  // ======== UNIFIED PARSING ========

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' });

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'File kosong', description: 'Tidak ada data ditemukan' });
        return;
      }

      const parsedEmployees: ParsedEmployee[] = [];
      const parsedPositions: ParsedPosition[] = [];
      const positionSet = new Set<string>(); // Track unique positions
      
      let lastCategory = '';
      let lastPosition = '';
      let lastPositionKepmen = ''; // Track merged Kepmen position
      let skippedRows = 0;
      let processedEmployees = 0;
      
      // Daftar jabatan struktural dan pelaksana untuk auto-detect
      const strukturalKeywords = ['direktur', 'kepala', 'sekretaris', 'kasubag', 'kabag'];
      const pelaksanaKeywords = ['penelaah', 'penata', 'pengadministrasi', 'pengolah', 'pengumpul', 'penyusun', 'pengelola', 'petugas', 'dokumentalis'];
      
      console.log('Starting parse, total rows:', rows.length);
      
      // Debug: log first 10 rows to see structure
      console.log('First 10 rows structure:');
      rows.slice(0, 10).forEach((row, i) => {
        const no = findCol(row, 'No', 'no', '__EMPTY');
        const jabatanSK = findCol(row, 'Jabatan Sesuai SK', 'Jabatan SK');
        const jabatanKepmen = findCol(row, 'Jabatan Sesuai Kepmen 202 Tahun 2024', 'Nama Jabatan', 'Jabatan', 'position_name');
        const nama = findCol(row, 'Nama Pemangku', 'Nama Lengkap', 'Nama', 'name');
        console.log(`Row ${i}:`, { no, jabatanSK, jabatanKepmen, nama });
      });

      for (const row of rows) {
        // Skip baris summary/referensi di bagian bawah
        const allValues = Object.values(row).join(' ').toUpperCase().trim();
        
        // Skip jika baris kosong atau hanya whitespace
        if (!allValues || allValues.length < 3) {
          skippedRows++;
          continue;
        }
        
        // Skip baris summary/referensi - harus sangat spesifik
        if (allValues.startsWith('KETERANGAN:') || 
            allValues.includes('JUMLAH PEGAWAI (PNS') ||
            allValues.includes('NAIK PANGKAT :') ||
            allValues.includes('NAIK JENJANG:') ||
            allValues.includes('PINDAH KE UNIT KERJA') ||
            allValues.includes('MASUK KE STANKOM =') ||
            allValues.includes('PENDIDIKAN ASN') && allValues.includes('JML') ||
            allValues.includes('JENIS KELAMIN') && allValues.includes('JML PEG')) {
          console.log('⏭️ Skipping summary/reference row:', allValues.substring(0, 50));
          skippedRows++;
          continue;
        }
        
        // Skip baris yang HANYA berisi tingkat pendidikan, golongan, atau gender (tanpa data lain)
        const trimmedValues = allValues.replace(/\s+/g, ' ');
        if (trimmedValues.match(/^(SD|SMP|SMA|D1|D2|D3|D4|S1|S2|S3)$/i) ||
            trimmedValues.match(/^(II|III|IV|V|VI|VII|VIII|IX) \d+$/i) ||
            trimmedValues.match(/^(L|P) \d+ \d+$/i) || // L 28 26 atau P 26 28
            trimmedValues.match(/^\d+ \d+$/)) { // Hanya 2 angka
          console.log('⏭️ Skipping summary row:', trimmedValues.substring(0, 30));
          skippedRows++;
          continue;
        }
        
        // Cek kolom No untuk kategori (karena merged cells)
        const noCol = findCol(row, 'No', 'no', '__EMPTY').toUpperCase().trim();
        
        // Deteksi kategori dari kolom No atau semua kolom
        // PENTING: Hanya deteksi kategori jika TIDAK ada nama pegawai
        const hasEmployeeName = findCol(row, 'Nama Pemangku', 'Nama Lengkap', 'Nama', 'name').trim();
        
        if (!hasEmployeeName) {
          // Hanya cek kategori jika tidak ada nama pegawai
          if (noCol.includes('STRUKTURAL') || noCol === 'STRUKTURAL') {
            lastCategory = 'STRUKTURAL';
            console.log('✓ Category detected: STRUKTURAL from No column');
            continue;
          } else if (noCol.includes('FUNGSIONAL') || noCol === 'FUNGSIONAL') {
            lastCategory = 'FUNGSIONAL';
            console.log('✓ Category detected: FUNGSIONAL from No column');
            continue;
          } else if (noCol.includes('PELAKSANA') || noCol === 'PELAKSANA') {
            lastCategory = 'PELAKSANA';
            console.log('✓ Category detected: PELAKSANA from No column');
            continue;
          }
          
          // Fallback: cek semua kolom (reuse allValues from above)
          if (allValues.includes('STRUKTURAL') && !allValues.includes('DIREKTUR') && !allValues.includes('KEPALA')) {
            lastCategory = 'STRUKTURAL';
            console.log('✓ Category detected: STRUKTURAL from all columns');
            continue;
          } else if (allValues.includes('FUNGSIONAL')) {
            lastCategory = 'FUNGSIONAL';
            console.log('✓ Category detected: FUNGSIONAL from all columns');
            continue;
          } else if (allValues.includes('PELAKSANA')) {
            lastCategory = 'PELAKSANA';
            console.log('✓ Category detected: PELAKSANA from all columns');
            continue;
          }
        }
        
        const name = findCol(row, 'Nama Pemangku', 'Nama Lengkap', 'Nama', 'name').trim();
        const jabatanSK = findCol(row, 'Jabatan Sesuai SK', 'Jabatan SK').trim();
        const jabatanKepmen = findCol(row, 'Jabatan Sesuai Kepmen 202 Tahun 2024', 'Nama Jabatan', 'Jabatan', 'position_name').trim();

        // Parse nama untuk ekstrak gelar depan dan belakang
        const parsedName = parseName(name);
        const cleanName = parsedName.name || name; // Fallback ke nama asli jika parsing gagal
        const frontTitle = parsedName.front_title;
        const backTitle = parsedName.back_title;

        // Get position info - prioritas Kepmen untuk lastPosition, fallback ke SK
        // Ini untuk tracking multi-row employees dan position reference
        const currentPosition = jabatanKepmen || jabatanSK;
        
        // Auto-detect category dari nama jabatan jika tidak ada baris kategori
        if (currentPosition && !lastCategory) {
          const posLower = currentPosition.toLowerCase();
          if (strukturalKeywords.some(kw => posLower.includes(kw))) {
            lastCategory = 'STRUKTURAL';
            console.log('🔍 Auto-detected category: STRUKTURAL from position:', currentPosition);
          } else if (pelaksanaKeywords.some(kw => posLower.includes(kw))) {
            lastCategory = 'PELAKSANA';
            console.log('🔍 Auto-detected category: PELAKSANA from position:', currentPosition);
          } else {
            // Default ke Fungsional jika tidak cocok dengan struktural atau pelaksana
            if (!lastCategory) {
              lastCategory = 'FUNGSIONAL';
              console.log('🔍 Auto-detected category: FUNGSIONAL (default) from position:', currentPosition);
            }
          }
        }
        
        // Track last position untuk multi-row employees dan merged cells
        // Simpan jabatan SK dan Kepmen terpisah
        
        // Update lastPositionKepmen jika ada nilai baru (untuk merged cells)
        if (jabatanKepmen && jabatanKepmen !== '-' && !['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(jabatanKepmen.toUpperCase())) {
          lastPositionKepmen = jabatanKepmen;
        }
        
        // Update lastPosition untuk position reference (gunakan yang ada)
        if (currentPosition && currentPosition !== '-' && !['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(currentPosition.toUpperCase())) {
          lastPosition = currentPosition;
        }
        
        // Simpan jabatan apa adanya dari Excel
        let positionSK = jabatanSK || ''; // Jabatan Sesuai SK
        let positionKepmen = jabatanKepmen || ''; // Jabatan Sesuai Kepmen
        
        // Jika Kepmen kosong tapi ada lastPositionKepmen (merged cells), gunakan lastPositionKepmen
        if (!positionKepmen && lastPositionKepmen) {
          positionKepmen = lastPositionKepmen;
        }
        
        // Untuk position reference, gunakan Kepmen (standar) atau fallback ke SK
        const positionNameForRef = positionKepmen || positionSK;
        
        // Determine position type from category
        let positionType = '';
        const rawPosType = findCol(row, 'Jenis Jabatan', 'position_type');
        if (rawPosType) {
          positionType = normalizeImportValue(rawPosType, POSITION_TYPE_ALIASES, POSITION_TYPES);
        } else if (lastCategory) {
          // Map kategori ke position type
          if (lastCategory === 'STRUKTURAL') positionType = 'Struktural';
          else if (lastCategory === 'FUNGSIONAL') positionType = 'Fungsional';
          else if (lastCategory === 'PELAKSANA') positionType = 'Pelaksana';
        }
        
        // Debug: log jika position type masih kosong
        if (!positionType && (currentPosition || name)) {
          console.warn('⚠️ Position type empty for:', { 
            name, 
            position: currentPosition, 
            lastCategory,
            jabatanSK,
            jabatanKepmen 
          });
        }

        const rawDept = findCol(row, 'Unit Kerja', 'department');
        // Gunakan selectedDepartment sebagai target import
        // Jika ada kolom Unit Kerja di template, validasi harus sama dengan selectedDepartment
        let dept = selectedDepartment;
        
        if (rawDept) {
          const normalizedRawDept = normalizeImportValue(rawDept, DEPARTMENT_ALIASES, DEPARTMENTS);
          // Jika template punya kolom unit kerja, harus sama dengan yang dipilih
          if (normalizedRawDept !== selectedDepartment) {
            console.warn(`Unit kerja di template (${rawDept}) berbeda dengan yang dipilih (${selectedDepartment})`);
          }
        }

        // Extract position reference data when we encounter a new position (Kepmen)
        if (positionNameForRef && positionNameForRef !== '-') {
          const grade = findCol(row, 'Kelas Jabatan', 'Grade', 'Grade/Kelas Jabatan');
          const abkCount = findCol(row, 'Jumlah ABK', 'ABK');
          
          const posKey = `${positionNameForRef}-${dept}-${positionType}`;
          if (!positionSet.has(posKey)) {
            positionSet.add(posKey);
            
            const position: ParsedPosition = {
              position_name: positionNameForRef,
              position_category: positionType,
              grade: grade,
              abk_count: abkCount,
              department: dept,
            };

            // Validate position
            if (!position.position_name) position.error = 'Nama jabatan wajib diisi';
            else if (!position.department) position.error = 'Unit kerja wajib diisi';
            else if (!DEPARTMENTS.includes(position.department as Department)) {
              position.error = `Unit kerja tidak valid`;
            }

            parsedPositions.push(position);
          }
        }

        // Skip baris kosong, dengan nama "-", atau nama yang hanya angka
        if (!name || name === '-') {
          // Log all columns to see if name is in a different column
          console.log('⏭️ Skipping empty name row, ALL COLUMNS:', row);
          skippedRows++;
          continue;
        }
        if (/^\d+$/.test(name)) {
          console.log('⏭️ Skipping numeric name:', name);
          skippedRows++;
          continue;
        }
        
        // Log jika ada nama tapi tidak ada position
        if (name && !positionKepmen) {
          console.warn('⚠️ Employee without position:', name, 'lastPosition:', lastPosition);
        }
        
        processedEmployees++;
        console.log(`✓ Processing employee ${processedEmployees}:`, name, '| SK:', positionSK || 'EMPTY', '| Kepmen:', positionKepmen || 'EMPTY', '| Category:', lastCategory);

        const rawRank = findCol(row, 'Pangkat Golongan', 'Pangkat\nGolongan', 'Pangkat\n Golongan', 'rank_group', 'Golongan');
        const nip = findCol(row, 'NIP', 'nip').replace(/\s/g, '').trim();
        
        // Parse NIP to get birth_date, tmt_cpns, and gender
        const nipData = parseNIP(nip || null);
        
        // Get data from Excel columns
        const excelGender = findCol(row, 'Jenis Kelamin', 'gender');
        const excelBirthDate = findCol(row, 'Tanggal Lahir', 'birth_date');
        const excelTmtCpns = findCol(row, 'TMT CPNS', 'tmt_cpns');
        const excelReligion = findCol(row, 'Agama', 'religion');
        
        // Normalize gender (handle case variations)
        let genderValue = excelGender || nipData?.gender || '';
        if (genderValue) {
          const genderLower = genderValue.toLowerCase().trim();
          if (genderLower === 'l' || genderLower === 'laki-laki' || genderLower === 'laki laki') {
            genderValue = 'Laki-laki';
          } else if (genderLower === 'p' || genderLower === 'perempuan') {
            genderValue = 'Perempuan';
          }
        }
        
        // Use NIP data as fallback if Excel columns are empty
        const gender = genderValue;
        const birth_date = excelBirthDate || nipData?.birth_date || '';
        const tmt_cpns = excelTmtCpns || nipData?.tmt_cpns || '';
        const religion = excelReligion || '';

        const employee: ParsedEmployee = {
          name: cleanName,
          front_title: frontTitle,
          back_title: backTitle,
          nip: nip && nip !== '-' ? nip : '',
          asn_status: findCol(row, 'Kriteria ASN', 'Status ASN', 'asn_status'),
          position_sk: positionSK, // Jabatan Sesuai SK
          position_name: positionKepmen, // Jabatan Sesuai Kepmen
          position_type: positionType,
          rank_group: normalizeImportValue(rawRank, RANK_GROUP_ALIASES, RANK_GROUPS),
          education_level: findCol(row, 'Pendidikan Terakhir', 'education_level'),
          gender: gender,
          birth_date: birth_date,
          tmt_cpns: tmt_cpns,
          religion: religion,
          department: dept,
          keterangan_formasi: findCol(row, 'Keterangan Formasi (ABK-Existing)', 'Keterangan Formasi'),
          keterangan_penempatan: findCol(row, 'Keterangan Penempatan', 'Keternangan Penempatan'),
          keterangan_penugasan: findCol(row, 'Keterangan Penugasan Tambahan', 'Keterangan Penugasan'),
          keterangan_perubahan: findCol(row, 'Keterangan Perubahan'),
        };

        // Validate employee
        if (!employee.name) employee.error = 'Nama wajib diisi';
        else if (!employee.asn_status) employee.error = 'Kriteria ASN wajib diisi';
        else if (!employee.department) employee.error = 'Unit kerja wajib diisi';
        else if (!DEPARTMENTS.includes(employee.department as Department)) {
          employee.error = `Unit kerja tidak valid`;
        }

        parsedEmployees.push(employee);
      }

      console.log('=== PARSING SUMMARY ===');
      console.log('Total rows processed:', rows.length);
      console.log('Rows skipped:', skippedRows);
      console.log('Employees processed:', processedEmployees);
      console.log('Parsed employees:', parsedEmployees.length, 'Parsed positions:', parsedPositions.length);
      console.log('Sample employee:', parsedEmployees[0]);
      console.log('Sample position:', parsedPositions[0]);
      console.log('Last category detected:', lastCategory);
      
      // Log all employee names for verification
      console.log('=== ALL PROCESSED EMPLOYEE NAMES ===');
      parsedEmployees.forEach((emp, idx) => {
        console.log(`${idx + 1}. ${emp.name} | ${emp.position_name || 'NO POSITION'} | ${emp.position_type || 'NO TYPE'}`);
      });
      
      // Log errors with details
      const empErrors = parsedEmployees.filter(e => e.error);
      const posErrors = parsedPositions.filter(p => p.error);
      console.log('Employee errors:', empErrors.length);
      if (empErrors.length > 0) {
        empErrors.forEach((e, i) => {
          console.log(`Employee error ${i + 1}:`, {
            name: e.name,
            error: e.error,
            asn_status: e.asn_status,
            department: e.department
          });
        });
      }
      console.log('Position errors:', posErrors.length);
      if (posErrors.length > 0) {
        posErrors.forEach((p, i) => {
          console.log(`Position error ${i + 1}:`, p);
        });
      }

      setEmpData(parsedEmployees);
      setPosData(parsedPositions);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    // Validasi unit kerja harus dipilih dulu
    if (!selectedDepartment) {
      toast({ 
        variant: 'destructive', 
        title: 'Unit Kerja Belum Dipilih', 
        description: 'Silakan pilih unit kerja target import terlebih dahulu' 
      });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ variant: 'destructive', title: 'Format tidak valid', description: 'Gunakan format Excel (.xlsx) atau CSV' });
      return;
    }
    setFile(f);
    setResult(null);
    parseExcel(f);
  };

  const handleImport = async () => {
    const validEmp = empData.filter(r => !r.error);
    const validPos = posData.filter(r => !r.error);
    
    if (validEmp.length === 0 && validPos.length === 0) {
      toast({ variant: 'destructive', title: 'Tidak ada data valid', description: 'Perbaiki error terlebih dahulu' });
      return;
    }

    setProcessing(true);
    setProgress(0);
    
    const result: ImportResult = {
      employees: { success: 0, failed: 0, errors: [] },
      positions: { success: 0, failed: 0, errors: [] },
    };

    const totalItems = validPos.length + validEmp.length;
    let processedItems = 0;

    // Import positions first - group by category to assign order
    const positionsByCategory: Record<string, typeof validPos> = {
      'Struktural': [],
      'Fungsional': [],
      'Pelaksana': [],
    };
    
    validPos.forEach(pos => {
      if (positionsByCategory[pos.position_category]) {
        positionsByCategory[pos.position_category].push(pos);
      }
    });

    // Import with proper ordering
    for (const [category, positions] of Object.entries(positionsByCategory)) {
      for (let i = 0; i < positions.length; i++) {
        const row = positions[i];
        try {
          // Check if position already exists
          const { data: existing } = await supabase
            .from('position_references')
            .select('id')
            .eq('department', row.department)
            .eq('position_name', row.position_name)
            .eq('position_category', row.position_category)
            .maybeSingle();

          if (existing) {
            // Update existing position
            const { error } = await supabase
              .from('position_references')
              .update({
                grade: row.grade ? parseInt(row.grade, 10) : null,
                abk_count: row.abk_count ? parseInt(row.abk_count, 10) : 0,
                position_order: i,
              })
              .eq('id', existing.id);
            
            if (error) {
              result.positions.errors.push({ row: i + 2, error: error.message });
              result.positions.failed++;
            } else {
              result.positions.success++;
            }
          } else {
            // Insert new position
            const { error } = await supabase.from('position_references').insert({
              position_name: row.position_name,
              position_category: row.position_category,
              grade: row.grade ? parseInt(row.grade, 10) : null,
              abk_count: row.abk_count ? parseInt(row.abk_count, 10) : 0,
              department: row.department,
              position_order: i,
            });
            
            if (error) {
              result.positions.errors.push({ row: i + 2, error: error.message });
              result.positions.failed++;
            } else {
              result.positions.success++;
            }
          }
        } catch (err: any) {
          result.positions.errors.push({ row: i + 2, error: err.message });
          result.positions.failed++;
        }
        
        processedItems++;
        setProgress(Math.round((processedItems / totalItems) * 100));
      }
    }

    // Import employees
    for (let i = 0; i < validEmp.length; i++) {
      const row = validEmp[i];
      try {
        let gender = row.gender;
        if (gender === 'L') gender = 'Laki-laki';
        if (gender === 'P') gender = 'Perempuan';

        // Check if employee already exists (by NIP if available, otherwise by name + department)
        let existing = null;
        if (row.nip) {
          const { data } = await supabase
            .from('employees')
            .select('id')
            .eq('nip', row.nip)
            .maybeSingle();
          existing = data;
        } else {
          const { data } = await supabase
            .from('employees')
            .select('id')
            .eq('name', row.name)
            .eq('department', row.department)
            .maybeSingle();
          existing = data;
        }

        let employeeId: string | null = null;

        if (existing) {
          // Update existing employee
          const { error } = await supabase
            .from('employees')
            .update({
              name: row.name,
              front_title: row.front_title || null,
              back_title: row.back_title || null,
              nip: row.nip || null,
              asn_status: row.asn_status,
              position_sk: row.position_sk || null,
              position_name: row.position_name || null,
              position_type: row.position_type || null,
              rank_group: row.rank_group || null,
              gender: gender || null,
              birth_date: row.birth_date || null,
              tmt_cpns: row.tmt_cpns || null,
              religion: row.religion || null,
              department: row.department,
              import_order: i + 1, // Save import order
              keterangan_formasi: row.keterangan_formasi || null,
              keterangan_penempatan: row.keterangan_penempatan || null,
              keterangan_penugasan: row.keterangan_penugasan || null,
              keterangan_perubahan: row.keterangan_perubahan || null,
            })
            .eq('id', existing.id);

          if (error) {
            result.employees.errors.push({ row: i + 2, error: error.message });
            result.employees.failed++;
          } else {
            employeeId = existing.id;
            result.employees.success++;
          }
        } else {
          // Insert new employee
          const { data: inserted, error } = await supabase
            .from('employees')
            .insert({
              name: row.name,
              front_title: row.front_title || null,
              back_title: row.back_title || null,
              nip: row.nip || null,
              asn_status: row.asn_status,
              position_sk: row.position_sk || null,
              position_name: row.position_name || null,
              position_type: row.position_type || null,
              rank_group: row.rank_group || null,
              gender: gender || null,
              birth_date: row.birth_date || null,
              tmt_cpns: row.tmt_cpns || null,
              religion: row.religion || null,
              department: row.department,
              import_order: i + 1, // Save import order
              keterangan_formasi: row.keterangan_formasi || null,
              keterangan_penempatan: row.keterangan_penempatan || null,
              keterangan_penugasan: row.keterangan_penugasan || null,
              keterangan_perubahan: row.keterangan_perubahan || null,
            })
            .select('id')
            .single();

          if (error) {
            result.employees.errors.push({ row: i + 2, error: error.message });
            result.employees.failed++;
          } else {
            employeeId = inserted?.id || null;
            result.employees.success++;
          }
        }

        // Parse and save education data
        if (row.education_level && employeeId) {
          const parsedEducation = parseEducation(row.education_level);
          if (parsedEducation) {
            // Delete existing education history for this employee to avoid duplicates
            await supabase
              .from('education_history')
              .delete()
              .eq('employee_id', employeeId);
            
            // Insert new education record
            await supabase.from('education_history').insert({
              employee_id: employeeId,
              level: parsedEducation.level,
              major: parsedEducation.major !== 'Tidak Ada' ? parsedEducation.major : null,
            });
          }
        }

        // Auto-create history records if they don't exist
        if (employeeId && !existing) {
          // Only create for new employees, not updates
          const importDate = row.tmt_cpns || row.birth_date || new Date().toISOString().split('T')[0];

          // Create mutation history (unit kerja saat ini)
          if (row.department) {
            await supabase.from('mutation_history').insert({
              employee_id: employeeId,
              tanggal: importDate,
              ke_unit: row.department,
              keterangan: 'Data import - Unit kerja saat ini',
            });
          }

          // Create rank history (pangkat saat ini)
          if (row.rank_group && row.rank_group !== 'Tidak Ada') {
            await supabase.from('rank_history').insert({
              employee_id: employeeId,
              tanggal: importDate,
              pangkat_baru: row.rank_group,
              tmt: importDate,
              keterangan: 'Data import - Pangkat/Golongan saat ini',
            });
          }

          // Create position history (jabatan saat ini)
          if (row.position_name) {
            await supabase.from('position_history').insert({
              employee_id: employeeId,
              tanggal: importDate,
              jabatan_baru: row.position_name,
              keterangan: 'Data import - Jabatan sesuai Kepmen 202/2024 saat ini',
            });
          }

          // Create notes from keterangan fields
          if (row.keterangan_penempatan) {
            await supabase.from('placement_notes').insert({
              employee_id: employeeId,
              note: row.keterangan_penempatan,
            });
          }

          if (row.keterangan_penugasan) {
            await supabase.from('assignment_notes').insert({
              employee_id: employeeId,
              note: row.keterangan_penugasan,
            });
          }

          if (row.keterangan_perubahan) {
            await supabase.from('change_notes').insert({
              employee_id: employeeId,
              note: row.keterangan_perubahan,
            });
          }
        }
      } catch (err: any) {
        result.employees.errors.push({ row: i + 2, error: err.message });
        result.employees.failed++;
      }
      
      processedItems++;
      setProgress(Math.round((processedItems / totalItems) * 100));
    }

    // Count validation errors
    posData.forEach((row, idx) => {
      if (row.error) {
        result.positions.errors.push({ row: idx + 2, error: row.error });
        result.positions.failed++;
      }
    });

    empData.forEach((row, idx) => {
      if (row.error) {
        result.employees.errors.push({ row: idx + 2, error: row.error });
        result.employees.failed++;
      }
    });

    setResult(result);
    setProcessing(false);
    
    const totalSuccess = result.employees.success + result.positions.success;
    const totalFailed = result.employees.failed + result.positions.failed;
    
    toast({
      variant: totalSuccess > 0 ? 'default' : 'destructive',
      title: totalSuccess > 0 ? 'Import Selesai' : 'Import Gagal',
      description: `${result.positions.success} jabatan, ${result.employees.success} pegawai berhasil${totalFailed > 0 ? `, ${totalFailed} gagal` : ''}`,
    });
  };

  const reset = () => {
    setFile(null);
    setEmpData([]);
    setPosData([]);
    setResult(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const dept = isAdminPusat ? 'Setditjen Binalavotas' : userDept;
    
    const sampleData = [
      { 'No': '', 'Jabatan Sesuai SK': 'STRUKTURAL', 'Jabatan Sesuai Kepmen 202 Tahun 2024': '', 'Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '', 'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '', 'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '', 'Keterangan Formasi (ABK-Existing)': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 1, 'Jabatan Sesuai SK': 'Direktur', 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Direktur', 'Kelas Jabatan': 15, 'Jumlah ABK': 1, 'Jumlah Existing': 1, 'Nama Pemangku': 'Dr. Budi Santoso, S.T., M.Si.', 'Kriteria ASN': 'PNS', 'NIP': '197407222001121003', 'Pangkat Golongan': 'IV/c', 'Pendidikan Terakhir': 'S3 Ilmu Administrasi', 'Jenis Kelamin': 'Laki-Laki', 'Keterangan Formasi (ABK-Existing)': '0', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 2, 'Jabatan Sesuai SK': 'Kepala Subbagian Tata Usaha', 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Kepala Subbagian Tata Usaha', 'Kelas Jabatan': 10, 'Jumlah ABK': 1, 'Jumlah Existing': 1, 'Nama Pemangku': 'Siti Nurhaliza, S.Kom., M.M.', 'Kriteria ASN': 'PNS', 'NIP': '198810212014031001', 'Pangkat Golongan': 'III/c', 'Pendidikan Terakhir': 'S2 Manajemen', 'Jenis Kelamin': 'Perempuan', 'Keterangan Formasi (ABK-Existing)': '0', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': 'Sertigas tgl 24 Oktober 2025', 'Keterangan Perubahan': '' },
      { 'No': '', 'Jabatan Sesuai SK': 'FUNGSIONAL', 'Jabatan Sesuai Kepmen 202 Tahun 2024': '', 'Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '', 'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '', 'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '', 'Keterangan Formasi (ABK-Existing)': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 3, 'Jabatan Sesuai SK': 'Analis Kebijakan Ahli Muda', 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Analis Kebijakan Ahli Muda', 'Kelas Jabatan': 10, 'Jumlah ABK': 3, 'Jumlah Existing': 2, 'Nama Pemangku': 'Ahmad Fauzi, S.T., M.A.', 'Kriteria ASN': 'PNS', 'NIP': '198303082007121001', 'Pangkat Golongan': 'IV/a', 'Pendidikan Terakhir': 'S2 Ilmu Administrasi', 'Jenis Kelamin': 'Laki-Laki', 'Keterangan Formasi (ABK-Existing)': '1', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': 'Subkoordinator Bidang Pengembangan', 'Keterangan Perubahan': '' },
      { 'No': '', 'Jabatan Sesuai SK': '', 'Jabatan Sesuai Kepmen 202 Tahun 2024': '', 'Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '', 'Nama Pemangku': 'Rini Wulandari, S.Pd', 'Kriteria ASN': 'PNS', 'NIP': '198407012011011009', 'Pangkat Golongan': 'III/d', 'Pendidikan Terakhir': 'S1 Pendidikan', 'Jenis Kelamin': 'Perempuan', 'Keterangan Formasi (ABK-Existing)': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': '', 'Jabatan Sesuai SK': 'PELAKSANA', 'Jabatan Sesuai Kepmen 202 Tahun 2024': '', 'Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '', 'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '', 'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '', 'Keterangan Formasi (ABK-Existing)': '', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '' },
      { 'No': 4, 'Jabatan Sesuai SK': 'Pengadministrasi Perkantoran', 'Jabatan Sesuai Kepmen 202 Tahun 2024': 'Pengadministrasi Perkantoran', 'Kelas Jabatan': 5, 'Jumlah ABK': 2, 'Jumlah Existing': 3, 'Nama Pemangku': 'Dewi Lestari', 'Kriteria ASN': 'PPPK', 'NIP': '', 'Pangkat Golongan': 'V', 'Pendidikan Terakhir': 'SMA', 'Jenis Kelamin': 'Perempuan', 'Keterangan Formasi (ABK-Existing)': '-1', 'Keterangan Penempatan': '', 'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': 'PPPK TMT 1 Mei 2025' },
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
      { wch: 25 }, { wch: 22 }, { wch: 30 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

    // Reference sheet
    const refData = [];
    const max = Math.max(ASN_STATUS_OPTIONS.length, RANK_GROUPS.length, isAdminPusat ? DEPARTMENTS.length : 1);
    for (let i = 0; i < max; i++) {
      refData.push({
        'Status ASN': ASN_STATUS_OPTIONS[i] || '',
        'Pangkat/Golongan': RANK_GROUPS[i] || '',
        'Unit Kerja': isAdminPusat ? (DEPARTMENTS[i] || '') : (i === 0 ? userDept : ''),
        'Jenis Jabatan': ['Struktural', 'Fungsional', 'Pelaksana'][i] || '',
      });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

    XLSX.writeFile(wb, 'template-import-stankom-asn.xlsx');
  };

  // ======== SHARED UI HELPERS ========

  const renderFileUpload = (
    file: File | null,
    fileRef: React.RefObject<HTMLInputElement>,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onReset: () => void,
    empCount: number,
    posCount: number,
  ) => (
    <>
      {!file ? (
        <div
          className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50")}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Klik untuk upload file</p>
          <p className="mt-1 text-xs text-muted-foreground">Format: Excel (.xlsx) - Template Stankom ASN</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {empCount} pegawai, {posCount} jabatan terdeteksi
              </p>
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
      <div className="space-y-3">
        {result.positions.success + result.positions.failed > 0 && (
          <Alert variant={result.positions.success > 0 ? 'default' : 'destructive'}>
            {result.positions.success > 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>Hasil Import Peta Jabatan</AlertTitle>
            <AlertDescription>
              Berhasil: {result.positions.success}, Gagal: {result.positions.failed}
              {result.positions.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs">
                  {result.positions.errors.slice(0, 3).map((err, i) => <li key={i}>Baris {err.row}: {err.error}</li>)}
                  {result.positions.errors.length > 3 && <li>...dan {result.positions.errors.length - 3} error lainnya</li>}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {result.employees.success + result.employees.failed > 0 && (
          <Alert variant={result.employees.success > 0 ? 'default' : 'destructive'}>
            {result.employees.success > 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>Hasil Import Data Pegawai</AlertTitle>
            <AlertDescription>
              Berhasil: {result.employees.success}, Gagal: {result.employees.failed}
              {result.employees.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs">
                  {result.employees.errors.slice(0, 3).map((err, i) => <li key={i}>Baris {err.row}: {err.error}</li>)}
                  {result.employees.errors.length > 3 && <li>...dan {result.employees.errors.length - 3} error lainnya</li>}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );

  // ======== RENDER ========

  const empValid = empData.filter(r => !r.error).length;
  const empInvalid = empData.filter(r => r.error).length;
  const posValid = posData.filter(r => !r.error).length;
  const posInvalid = posData.filter(r => r.error).length;
  const totalValid = empValid + posValid;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Import Data Stankom ASN</h1>
          <p className="page-description">
            Import data pegawai dan peta jabatan sekaligus dari satu file Excel
          </p>
        </div>

        {/* Department Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pilih Unit Kerja Target Import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="department">
                Unit Kerja <span className="text-destructive">*</span>
              </Label>
              {isAdminPusat ? (
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department" className={cn(!selectedDepartment && 'border-destructive')}>
                    <SelectValue placeholder="Pilih unit kerja tujuan import..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.filter(d => d !== 'Pusat').map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={userDept} disabled className="bg-muted" />
              )}
              <p className="text-sm text-muted-foreground">
                {isAdminPusat 
                  ? 'Semua data yang di-import akan masuk ke unit kerja yang dipilih'
                  : 'Data akan di-import ke unit kerja Anda'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Upload File Excel</CardTitle>
              <CardDescription>
                File akan diproses untuk mengekstrak data pegawai dan peta jabatan sekaligus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderFileUpload(file, fileRef, handleFileChange, reset, empData.length, posData.length)}
              
              {(empData.length > 0 || posData.length > 0) && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-medium">Data Pegawai:</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{empValid} valid</span>
                      </div>
                      {empInvalid > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span>{empInvalid} error</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Peta Jabatan:</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{posValid} valid</span>
                      </div>
                      {posInvalid > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span>{posInvalid} error</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {renderProgress(processing, progress)}
                  {renderResult(result)}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleImport} 
                      disabled={totalValid === 0 || processing} 
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import {posValid} Jabatan & {empValid} Pegawai
                    </Button>
                    <Button variant="outline" onClick={reset}>Reset</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Panduan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Format Template Stankom ASN:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Kategori: STRUKTURAL, FUNGSIONAL, PELAKSANA</li>
                  <li>Jabatan Sesuai Kepmen 202/2024</li>
                  <li>Kelas Jabatan & Jumlah ABK</li>
                  <li>Nama Pemangku (wajib)</li>
                  <li>NIP, Kriteria ASN (wajib)</li>
                  <li>Pangkat Golongan</li>
                  <li>Pendidikan Terakhir</li>
                  <li>Jenis Kelamin</li>
                  <li>Keterangan (Formasi/Penempatan/Penugasan/Perubahan)</li>
                </ul>
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                  <p className="font-medium">⚠️ Penting:</p>
                  <p>Hapus data referensi/summary di bagian bawah Excel (tabel pendidikan, jenis kelamin, dll) sebelum import untuk menghindari data yang tidak valid.</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />Download Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Tabs */}
        {(empData.length > 0 || posData.length > 0) && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">
                Pegawai ({empData.length})
                {empInvalid > 0 && <span className="ml-1 text-destructive">• {empInvalid} error</span>}
              </TabsTrigger>
              <TabsTrigger value="positions">
                Jabatan ({posData.length})
                {posInvalid > 0 && <span className="ml-1 text-destructive">• {posInvalid} error</span>}
              </TabsTrigger>
              {(empInvalid > 0 || posInvalid > 0) && (
                <TabsTrigger value="errors" className="text-destructive">
                  Error ({empInvalid + posInvalid})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Preview Data Pegawai
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({empValid} valid, {empInvalid} error dari {empData.length} total)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Kriteria ASN</TableHead>
                          <TableHead>Jabatan SK</TableHead>
                          <TableHead>Jabatan Kepmen</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Pangkat</TableHead>
                          <TableHead>Pendidikan</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Unit Kerja</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empData.map((row, idx) => (
                          <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                            <TableCell className="text-sm">{row.name || '-'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.nip || '-'}</TableCell>
                            <TableCell className="text-sm">{row.asn_status || '-'}</TableCell>
                            <TableCell className="text-sm">{row.position_sk || '-'}</TableCell>
                            <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                            <TableCell className="text-sm">{row.position_type || '-'}</TableCell>
                            <TableCell className="text-sm">{row.rank_group || '-'}</TableCell>
                            <TableCell className="text-sm">{row.education_level || '-'}</TableCell>
                            <TableCell className="text-sm">{row.gender || '-'}</TableCell>
                            <TableCell className="text-sm">{row.department || '-'}</TableCell>
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
            </TabsContent>

            <TabsContent value="positions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Preview Peta Jabatan
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({posValid} valid, {posInvalid} error dari {posData.length} total)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Nama Jabatan</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">ABK</TableHead>
                          <TableHead className="text-center">Existing</TableHead>
                          <TableHead className="text-center">Selisih</TableHead>
                          <TableHead>Unit Kerja</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posData.map((row, idx) => {
                          // Hitung jumlah pegawai yang akan di-import untuk jabatan ini
                          const existingCount = empData.filter(emp => 
                            emp.position_name?.trim().toLowerCase() === row.position_name?.trim().toLowerCase() &&
                            !emp.error
                          ).length;
                          const abk = parseInt(row.abk_count) || 0;
                          const selisih = abk - existingCount;
                          
                          return (
                            <TableRow key={idx} className={cn(row.error && 'bg-destructive/5')}>
                              <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                              <TableCell className="text-sm">{row.position_category}</TableCell>
                              <TableCell className="text-sm text-center">{row.grade || '-'}</TableCell>
                              <TableCell className="text-sm text-center">{row.abk_count || '-'}</TableCell>
                              <TableCell className="text-sm text-center font-medium">{existingCount}</TableCell>
                              <TableCell className="text-sm text-center">
                                {selisih > 0 ? (
                                  <span className="text-orange-600">-{selisih}</span>
                                ) : selisih < 0 ? (
                                  <span className="text-blue-600">+{Math.abs(selisih)}</span>
                                ) : (
                                  <span className="text-green-600">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{row.department}</TableCell>
                              <TableCell>
                                {row.error
                                  ? <span className="text-xs text-destructive">{row.error}</span>
                                  : <CheckCircle className="h-4 w-4 text-green-600" />}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Error Tab */}
            {(empInvalid > 0 || posInvalid > 0) && (
              <TabsContent value="errors">
                <div className="space-y-4">
                  {empInvalid > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-destructive">
                          Error Data Pegawai ({empInvalid})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Baris</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>NIP</TableHead>
                                <TableHead>Kriteria ASN</TableHead>
                                <TableHead>Jabatan SK</TableHead>
                                <TableHead>Jabatan Kepmen</TableHead>
                                <TableHead>Unit Kerja</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {empData.filter(r => r.error).map((row, idx) => (
                                <TableRow key={idx} className="bg-destructive/5">
                                  <TableCell className="font-mono text-xs">{empData.indexOf(row) + 1}</TableCell>
                                  <TableCell className="text-sm">{row.name || '-'}</TableCell>
                                  <TableCell className="font-mono text-xs">{row.nip || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.asn_status || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.position_sk || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.department || '-'}</TableCell>
                                  <TableCell>
                                    <span className="text-xs text-destructive font-medium">{row.error}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {posInvalid > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-destructive">
                          Error Peta Jabatan ({posInvalid})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Baris</TableHead>
                                <TableHead>Nama Jabatan</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>ABK</TableHead>
                                <TableHead>Unit Kerja</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {posData.filter(r => r.error).map((row, idx) => (
                                <TableRow key={idx} className="bg-destructive/5">
                                  <TableCell className="font-mono text-xs">{posData.indexOf(row) + 1}</TableCell>
                                  <TableCell className="text-sm">{row.position_name || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.position_category || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.grade || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.abk_count || '-'}</TableCell>
                                  <TableCell className="text-sm">{row.department || '-'}</TableCell>
                                  <TableCell>
                                    <span className="text-xs text-destructive font-medium">{row.error}</span>
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
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
