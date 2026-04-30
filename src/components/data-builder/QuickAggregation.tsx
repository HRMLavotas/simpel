import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, Loader2, Zap, Users, TrendingUp, Award, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

interface QuickAggregationProps {
  // No props needed - component will fetch its own data
}

// Helper function to normalize rank group for detailed view
function normalizeRankGroup(rankGroup: string): string {
  if (!rankGroup || rankGroup === '-') return 'Tidak Ada';
  
  const rg = String(rankGroup).trim();
  
  // Handle Non-ASN cases
  if (rg.toLowerCase().includes('tenaga alih daya') || 
      rg.toLowerCase().includes('non asn')) {
    return 'Non ASN';
  }
  
  // Handle PPPK cases (V, VII, IX, etc) - keep as is
  if (/^(V|VII|IX|XI)$/i.test(rg)) {
    return rg.toUpperCase();
  }
  
  // Extract detailed rank (e.g., "III/a", "IV/b")
  const detailMatch = rg.match(/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i);
  if (detailMatch) {
    return `${detailMatch[1]}/${detailMatch[2]}`.toUpperCase();
  }
  
  // If no detailed match, try to extract just the Roman numeral
  const romanMatch = rg.match(/\b(IV|III|II|I)\b/i);
  if (romanMatch) {
    return romanMatch[1].toUpperCase();
  }
  
  return rg;
}

// Helper function to extract main rank (I, II, III, IV) from rank_group
function extractMainRank(rankGroup: string): string {
  if (!rankGroup || rankGroup === '-') return 'Tidak Ada';
  
  // Handle Non-ASN cases
  if (rankGroup.toLowerCase().includes('tenaga alih daya') || 
      rankGroup.toLowerCase().includes('non asn')) {
    return 'Non ASN';
  }
  
  // Handle PPPK cases (V, VII, IX, etc)
  if (/^(V|VII|IX|XI)$/i.test(rankGroup.trim())) {
    return 'PPPK';
  }
  
  // Extract Roman numerals (I, II, III, IV)
  const match = rankGroup.match(/\b(IV|III|II|I)\b/);
  if (match) {
    return match[1];
  }
  
  return 'Lainnya';
}

// Helper function to extract education level from education_history
function extractEducationLevel(educationHistory: unknown): string {
  if (!educationHistory) return 'Tidak Ada';
  
  try {
    let histories: any[] = [];
    
    if (typeof educationHistory === 'string') {
      histories = JSON.parse(educationHistory);
    } else if (Array.isArray(educationHistory)) {
      histories = educationHistory;
    }
    
    if (!Array.isArray(histories) || histories.length === 0) {
      return 'Tidak Ada';
    }
    
    // Get the highest education level
    const levels = histories.map(h => {
      const level = String(h.level || h.jenjang || '').toUpperCase();
      
      // Normalize education levels
      if (level.includes('S3') || level.includes('DOKTOR') || level.includes('DR')) return 'S3';
      if (level.includes('S2') || level.includes('MAGISTER') || level.includes('MASTER')) return 'S2';
      if (level.includes('S1') || level.includes('SARJANA') || level.includes('BACHELOR')) return 'S1';
      if (level.includes('D4') || level.includes('D-IV')) return 'D4';
      if (level.includes('D3') || level.includes('D-III')) return 'D3';
      if (level.includes('D2') || level.includes('D-II')) return 'D2';
      if (level.includes('D1') || level.includes('D-I')) return 'D1';
      if (level.includes('SMA') || level.includes('SMK') || level.includes('MA')) return 'SMA/SMK';
      if (level.includes('SMP') || level.includes('MTS')) return 'SMP';
      if (level.includes('SD') || level.includes('MI')) return 'SD';
      
      return level || 'Lainnya';
    });
    
    // Priority order for highest education
    const priority = ['S3', 'S2', 'S1', 'D4', 'D3', 'D2', 'D1', 'SMA/SMK', 'SMP', 'SD'];
    for (const level of priority) {
      if (levels.includes(level)) return level;
    }
    
    return levels[0] || 'Lainnya';
  } catch (error) {
    return 'Tidak Ada';
  }
}

// Helper function to normalize ASN status
function normalizeAsnStatus(status: unknown): string {
  if (!status) return 'Tidak Ada';
  const s = String(status).trim().toUpperCase();
  
  // Normalize variations - IMPORTANT: Check CPNS BEFORE PNS to avoid false matches
  if (s === 'CPNS' || s.includes('CPNS')) return 'CPNS';
  if (s === 'PNS' || s.includes('PNS')) return 'PNS';
  if (s === 'PPPK' || s.includes('PPPK')) return 'PPPK';
  if (s === 'NON ASN' || s.includes('NON') || s.includes('ALIH DAYA')) return 'Non ASN';
  
  return s || 'Tidak Ada';
}

// Helper function to normalize gender
function normalizeGender(gender: unknown): string {
  if (!gender) return 'Tidak Ada';
  const g = String(gender).toLowerCase();
  if (g.includes('laki') || g === 'l' || g === 'm' || g === 'male') return 'Laki-laki';
  if (g.includes('perempuan') || g === 'p' || g === 'f' || g === 'female') return 'Perempuan';
  return 'Tidak Ada';
}

// Helper function to calculate age from birth_date
function calculateAge(birthDate: unknown): number | null {
  if (!birthDate) return null;
  try {
    const birth = new Date(String(birthDate));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 100 ? age : null;
  } catch {
    return null;
  }
}

// Helper function to categorize age
function categorizeAge(age: number | null): string {
  if (!age) return 'Tidak Ada';
  if (age < 25) return '<25 tahun';
  if (age < 35) return '25-34 tahun';
  if (age < 45) return '35-44 tahun';
  if (age < 55) return '45-54 tahun';
  return '≥55 tahun';
}

// Helper function to calculate years of service
function calculateYearsOfService(startDate: unknown): number | null {
  if (!startDate) return null;
  try {
    const start = new Date(String(startDate));
    const today = new Date();
    const years = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      return years - 1;
    }
    return years >= 0 && years < 60 ? years : null;
  } catch {
    return null;
  }
}

// Helper function to categorize years of service
function categorizeYearsOfService(years: number | null): string {
  if (!years && years !== 0) return 'Tidak Ada';
  if (years < 5) return '<5 tahun';
  if (years < 10) return '5-9 tahun';
  if (years < 20) return '10-19 tahun';
  if (years < 30) return '20-29 tahun';
  return '≥30 tahun';
}

// Urutan resmi unit kerja sesuai format laporan resmi (Tabel Dukungan Personil)
const OFFICIAL_DEPT_ORDER: string[] = [
  'Setditjen Binalavotas',
  'Direktorat Bina Stankomproglat',
  'Direktorat Bina Intala',
  'Direktorat Bina Peningkatan Produktivitas',
  'Direktorat Bina Lemlatvok',
  'Direktorat Bina Penyelenggaraan Latvogan',
  'Set. BNSP',
  'BBPVP Medan',
  'BBPVP Serang',
  'BBPVP Bekasi',
  'BBPVP Bandung',
  'BBPVP Semarang',
  'BBPVP Makassar',
  'BPVP Banda Aceh',
  'BPVP Padang',
  'BPVP Surakarta',
  'BPVP Samarinda',
  'BPVP Kendari',
  'BPVP Ternate',
  'BPVP Ambon',
  'BPVP Sorong',
  'BPVP Bandung Barat',
  'BPVP Lombok Timur',
  'BPVP Bantaeng',
  'BPVP Sidoarjo',
  'BPVP Banyuwangi',
  'BPVP Pangkep',
  'BPVP Belitung',
  'Satpel Sawahlunto',
  'Satpel Sofifi',
  'Satpel Pekanbaru',
  'Satpel Lubuklinggau',
  'Satpel Lampung',
  'Satpel Bengkulu',
  'Satpel Mamuju',
  'Satpel Majene',
  'Satpel Palu',
  'Satpel Bantul',
  'Satpel Kupang',
  'Satpel Jambi',
  'Satpel Jayapura',
  'Workshop Prabumulih',
  'Workshop Batam',
  'Workshop Gorontalo',
];

export function QuickAggregation({}: QuickAggregationProps) {
  const { toast } = useToast();
  const { profile, canViewAll } = useAuth();
  const shouldFilterByDepartment = !canViewAll && profile?.department;
  
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch data function
  const fetchData = async (departmentFilter?: string) => {
    setIsLoading(true);
    try {
      // Fetch ALL employees with pagination
      const allEmployees: any[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        let query = supabase
          .from('employees')
          .select('id, nip, name, rank_group, gender, department, asn_status, position_type, religion, birth_date, tmt_cpns')
          .range(offset, offset + batchSize - 1)
          .order('name');

        // Filter by department if needed
        if (shouldFilterByDepartment) {
          query = query.eq('department', profile!.department);
        } else if (departmentFilter && departmentFilter !== 'all') {
          query = query.eq('department', departmentFilter);
        }

        const { data: batch, error: empError } = await query;

        if (empError) throw empError;
        if (!batch || batch.length === 0) break;

        allEmployees.push(...batch);

        // If we got less than batchSize, we've reached the end
        if (batch.length < batchSize) break;

        offset += batchSize;
      }

      // Fetch education history for all employees
      const employeeIds = allEmployees.map(e => e.id).filter(Boolean);
      let educationData: Record<string, any[]> = {};

      if (employeeIds.length > 0) {
        // Fetch education in batches to avoid URL length limits
        const eduBatchSize = 500;
        for (let i = 0; i < employeeIds.length; i += eduBatchSize) {
          const idBatch = employeeIds.slice(i, i + eduBatchSize);
          
          const { data: educations, error: eduError } = await supabase
            .from('education_history')
            .select('employee_id, level, institution_name, major, graduation_year')
            .in('employee_id', idBatch);

          if (!eduError && educations) {
            // Group education by employee_id
            educations.forEach(edu => {
              if (!educationData[edu.employee_id]) {
                educationData[edu.employee_id] = [];
              }
              educationData[edu.employee_id].push(edu);
            });
          }
        }
      }

      // Merge education data with employees
      const mergedData = allEmployees.map(emp => ({
        ...emp,
        education_history: educationData[emp.id] || [],
      }));

      setData(mergedData);
      
      // Extract unique departments for filter
      if (!shouldFilterByDepartment) {
        const uniqueDepts = [...new Set(allEmployees.map(e => e.department).filter(Boolean))].sort();
        setDepartments(uniqueDepts as string[]);
      }
      
      toast({
        title: 'Data berhasil dimuat',
        description: `${mergedData.length} pegawai dimuat untuk agregasi cepat.`,
      });
    } catch (error) {
      logger.error('[QuickAggregation] Gagal mengambil data:', error);
      toast({
        title: 'Gagal mengambil data',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle department filter change
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    fetchData(value);
  };

  // Calculate aggregations
  const aggregations = useMemo(() => {
    if (data.length === 0) return null;

    // Rank aggregation (I, II, III, IV)
    const rankCounts: Record<string, number> = {};
    data.forEach(row => {
      const mainRank = extractMainRank(String(row.rank_group || ''));
      rankCounts[mainRank] = (rankCounts[mainRank] || 0) + 1;
    });

    // Detailed Rank aggregation (III/a, IV/b, etc)
    const detailedRankCounts: Record<string, number> = {};
    data.forEach(row => {
      const detailedRank = normalizeRankGroup(String(row.rank_group || ''));
      detailedRankCounts[detailedRank] = (detailedRankCounts[detailedRank] || 0) + 1;
    });

    // Education aggregation
    const educationCounts: Record<string, number> = {};
    data.forEach(row => {
      const education = extractEducationLevel(row.education_history);
      educationCounts[education] = (educationCounts[education] || 0) + 1;
    });

    // Gender aggregation
    const genderCounts: Record<string, number> = {};
    data.forEach(row => {
      const gender = normalizeGender(row.gender);
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    // ASN Status aggregation
    const asnStatusCounts: Record<string, number> = {};
    data.forEach(row => {
      const status = normalizeAsnStatus(row.asn_status);
      asnStatusCounts[status] = (asnStatusCounts[status] || 0) + 1;
    });

    // Department aggregation
    const departmentCounts: Record<string, number> = {};
    data.forEach(row => {
      const dept = String(row.department || 'Tidak Ada');
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // Position Type aggregation
    const positionTypeCounts: Record<string, number> = {};
    data.forEach(row => {
      const posType = String(row.position_type || 'Tidak Ada');
      positionTypeCounts[posType] = (positionTypeCounts[posType] || 0) + 1;
    });

    // Religion aggregation
    const religionCounts: Record<string, number> = {};
    data.forEach(row => {
      const religion = String(row.religion || 'Tidak Ada');
      religionCounts[religion] = (religionCounts[religion] || 0) + 1;
    });

    // Age aggregation
    const ageCounts: Record<string, number> = {};
    let totalAge = 0;
    let ageCount = 0;
    data.forEach(row => {
      const age = calculateAge(row.birth_date);
      const ageCategory = categorizeAge(age);
      ageCounts[ageCategory] = (ageCounts[ageCategory] || 0) + 1;
      if (age) {
        totalAge += age;
        ageCount++;
      }
    });
    const averageAge = ageCount > 0 ? (totalAge / ageCount).toFixed(1) : '0';

    // Years of Service aggregation
    const yearsOfServiceCounts: Record<string, number> = {};
    let totalYears = 0;
    let yearsCount = 0;
    data.forEach(row => {
      const years = calculateYearsOfService(row.tmt_cpns);
      const yearsCategory = categorizeYearsOfService(years);
      yearsOfServiceCounts[yearsCategory] = (yearsOfServiceCounts[yearsCategory] || 0) + 1;
      if (years !== null) {
        totalYears += years;
        yearsCount++;
      }
    });
    const averageYears = yearsCount > 0 ? (totalYears / yearsCount).toFixed(1) : '0';

    return {
      rank: Object.entries(rankCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['I', 'II', 'III', 'IV', 'PPPK', 'Non ASN', 'Lainnya', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      detailedRank: Object.entries(detailedRankCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          // Custom sort for detailed ranks
          const order = [
            'I/a', 'I/b', 'I/c', 'I/d',
            'II/a', 'II/b', 'II/c', 'II/d',
            'III/a', 'III/b', 'III/c', 'III/d',
            'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e',
            'V', 'VII', 'IX', 'XI',
            'Non ASN', 'Lainnya', 'Tidak Ada'
          ];
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        }),
      education: Object.entries(educationCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['S3', 'S2', 'S1', 'D4', 'D3', 'D2', 'D1', 'SMA/SMK', 'SMP', 'SD', 'Lainnya', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      gender: Object.entries(genderCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['Laki-laki', 'Perempuan', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      asnStatus: Object.entries(asnStatusCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['PNS', 'CPNS', 'PPPK', 'Non ASN', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      department: Object.entries(departmentCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => b.count - a.count), // Sort by count descending
      positionType: Object.entries(positionTypeCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['Struktural', 'Fungsional', 'Pelaksana', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      religion: Object.entries(religionCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      age: Object.entries(ageCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['<25 tahun', '25-34 tahun', '35-44 tahun', '45-54 tahun', '≥55 tahun', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      yearsOfService: Object.entries(yearsOfServiceCounts)
        .map(([name, count]) => ({ name, count, percentage: ((count / data.length) * 100).toFixed(1) }))
        .sort((a, b) => {
          const order = ['<5 tahun', '5-9 tahun', '10-19 tahun', '20-29 tahun', '≥30 tahun', 'Tidak Ada'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        }),
      averageAge,
      averageYears,
    };
  }, [data]);

  const handleExport = () => {
    if (!aggregations) {
      toast({ title: 'Tidak ada data', description: 'Silakan muat data terlebih dahulu.', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan
      const summaryData = [
        { Kategori: 'Total Pegawai', Nilai: data.length },
        { Kategori: 'Tanggal Export', Nilai: new Date().toLocaleDateString('id-ID') },
        { Kategori: 'Filter Unit Kerja', Nilai: selectedDepartment === 'all' ? 'Semua Unit' : selectedDepartment },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Sheet 2: Status ASN
      const asnStatusData = aggregations.asnStatus.map(item => ({
        'Status ASN': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsAsnStatus = XLSX.utils.json_to_sheet(asnStatusData);
      XLSX.utils.book_append_sheet(wb, wsAsnStatus, 'Status ASN');

      // Sheet 3: Pangkat/Golongan Utama
      const rankData = aggregations.rank.map(item => ({
        'Pangkat/Golongan': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsRank = XLSX.utils.json_to_sheet(rankData);
      XLSX.utils.book_append_sheet(wb, wsRank, 'Pangkat Utama');

      // Sheet 4: Pangkat/Golongan Detail
      const detailedRankData = aggregations.detailedRank.map(item => ({
        'Pangkat/Golongan': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsDetailedRank = XLSX.utils.json_to_sheet(detailedRankData);
      XLSX.utils.book_append_sheet(wb, wsDetailedRank, 'Pangkat Detail');

      // Sheet 5: Jenis Jabatan
      const positionTypeData = aggregations.positionType.map(item => ({
        'Jenis Jabatan': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsPositionType = XLSX.utils.json_to_sheet(positionTypeData);
      XLSX.utils.book_append_sheet(wb, wsPositionType, 'Jenis Jabatan');

      // Sheet 6: Pendidikan
      const educationData = aggregations.education.map(item => ({
        'Pendidikan': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsEducation = XLSX.utils.json_to_sheet(educationData);
      XLSX.utils.book_append_sheet(wb, wsEducation, 'Pendidikan');

      // Sheet 7: Jenis Kelamin
      const genderData = aggregations.gender.map(item => ({
        'Jenis Kelamin': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsGender = XLSX.utils.json_to_sheet(genderData);
      XLSX.utils.book_append_sheet(wb, wsGender, 'Jenis Kelamin');

      // Sheet 8: Agama
      const religionData = aggregations.religion.map(item => ({
        'Agama': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsReligion = XLSX.utils.json_to_sheet(religionData);
      XLSX.utils.book_append_sheet(wb, wsReligion, 'Agama');

      // Sheet 9: Rentang Usia
      const ageData = aggregations.age.map(item => ({
        'Rentang Usia': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsAge = XLSX.utils.json_to_sheet(ageData);
      XLSX.utils.book_append_sheet(wb, wsAge, 'Rentang Usia');

      // Sheet 10: Masa Kerja
      const yearsData = aggregations.yearsOfService.map(item => ({
        'Masa Kerja': item.name,
        'Jumlah': item.count,
        'Persentase': `${item.percentage}%`,
      }));
      const wsYears = XLSX.utils.json_to_sheet(yearsData);
      XLSX.utils.book_append_sheet(wb, wsYears, 'Masa Kerja');

      // Sheet 11: Unit Kerja (only if not filtered by department)
      if (selectedDepartment === 'all' && aggregations.department.length > 1) {
        const departmentData = aggregations.department.map(item => ({
          'Unit Kerja': item.name,
          'Jumlah': item.count,
          'Persentase': `${item.percentage}%`,
        }));
        const wsDepartment = XLSX.utils.json_to_sheet(departmentData);
        XLSX.utils.book_append_sheet(wb, wsDepartment, 'Unit Kerja');
      }

      // Sheet 12: Tabel Golongan per Unit Kerja (format resmi)
      // Kolom: No | Unit Kerja | PNS I | PNS II | PNS III | PNS IV | PPPK III | PPPK IV | PPPK VII | PPPK IX | Total | L | P | Total JK
      if (selectedDepartment === 'all' && aggregations.department.length > 1) {
        // Kelompokkan data per unit kerja
        const deptMap = new Map<string, typeof data>();
        data.forEach(emp => {
          const dept = String(emp.department || 'Tidak Ada');
          if (!deptMap.has(dept)) deptMap.set(dept, []);
          deptMap.get(dept)!.push(emp);
        });

        // Urutkan unit kerja sesuai urutan resmi laporan
        // Unit yang tidak ada di daftar resmi diletakkan di akhir secara alphabetical
        const deptSet = new Set(deptMap.keys());
        const sortedDepts = [
          ...OFFICIAL_DEPT_ORDER.filter(d => deptSet.has(d)),
          ...[...deptSet].filter(d => !OFFICIAL_DEPT_ORDER.includes(d)).sort(),
        ];

        const golonganRows: Record<string, string | number>[] = [];
        const totals = { pns_I: 0, pns_II: 0, pns_III: 0, pns_IV: 0, pppk_III: 0, pppk_IV: 0, pppk_VII: 0, pppk_IX: 0, total: 0, L: 0, P: 0 };

        sortedDepts.forEach((dept, idx) => {
          const emps = deptMap.get(dept) || [];

          // Hitung PNS per golongan utama
          const pns_I   = emps.filter(e => normalizeAsnStatus(e.asn_status) === 'PNS' && extractMainRank(String(e.rank_group || '')) === 'I').length;
          const pns_II  = emps.filter(e => normalizeAsnStatus(e.asn_status) === 'PNS' && extractMainRank(String(e.rank_group || '')) === 'II').length;
          const pns_III = emps.filter(e => normalizeAsnStatus(e.asn_status) === 'PNS' && extractMainRank(String(e.rank_group || '')) === 'III').length;
          const pns_IV  = emps.filter(e => normalizeAsnStatus(e.asn_status) === 'PNS' && extractMainRank(String(e.rank_group || '')) === 'IV').length;

          // Hitung PPPK per golongan (V=III, VII=VII, IX=IX, XI=IV)
          const pppk_III = emps.filter(e => {
            const s = normalizeAsnStatus(e.asn_status);
            const rg = String(e.rank_group || '').trim().toUpperCase();
            return (s === 'PPPK' || s === 'CPNS') && rg === 'V';
          }).length;
          const pppk_IV = emps.filter(e => {
            const s = normalizeAsnStatus(e.asn_status);
            const rg = String(e.rank_group || '').trim().toUpperCase();
            return (s === 'PPPK' || s === 'CPNS') && rg === 'XI';
          }).length;
          const pppk_VII = emps.filter(e => {
            const s = normalizeAsnStatus(e.asn_status);
            const rg = String(e.rank_group || '').trim().toUpperCase();
            return (s === 'PPPK' || s === 'CPNS') && rg === 'VII';
          }).length;
          const pppk_IX = emps.filter(e => {
            const s = normalizeAsnStatus(e.asn_status);
            const rg = String(e.rank_group || '').trim().toUpperCase();
            return (s === 'PPPK' || s === 'CPNS') && rg === 'IX';
          }).length;

          // Hitung jenis kelamin (exclude Non ASN)
          const asnEmps = emps.filter(e => normalizeAsnStatus(e.asn_status) !== 'Non ASN');
          const L = asnEmps.filter(e => normalizeGender(e.gender) === 'Laki-laki').length;
          const P = asnEmps.filter(e => normalizeGender(e.gender) === 'Perempuan').length;
          const total = pns_I + pns_II + pns_III + pns_IV + pppk_III + pppk_IV + pppk_VII + pppk_IX;

          golonganRows.push({
            'No': idx + 1,
            'Unit Kerja': dept,
            'PNS I': pns_I,
            'PNS II': pns_II,
            'PNS III': pns_III,
            'PNS IV': pns_IV,
            'PPPK III': pppk_III,
            'PPPK IV': pppk_IV,
            'PPPK VII': pppk_VII,
            'PPPK IX': pppk_IX,
            'Total': total,
            'L': L,
            'P': P,
            'Total JK': L + P,
          });

          totals.pns_I   += pns_I;
          totals.pns_II  += pns_II;
          totals.pns_III += pns_III;
          totals.pns_IV  += pns_IV;
          totals.pppk_III += pppk_III;
          totals.pppk_IV  += pppk_IV;
          totals.pppk_VII += pppk_VII;
          totals.pppk_IX  += pppk_IX;
          totals.total   += total;
          totals.L       += L;
          totals.P       += P;
        });

        // Baris JUMLAH
        golonganRows.push({
          'No': '',
          'Unit Kerja': 'JUMLAH',
          'PNS I': totals.pns_I,
          'PNS II': totals.pns_II,
          'PNS III': totals.pns_III,
          'PNS IV': totals.pns_IV,
          'PPPK III': totals.pppk_III,
          'PPPK IV': totals.pppk_IV,
          'PPPK VII': totals.pppk_VII,
          'PPPK IX': totals.pppk_IX,
          'Total': totals.total,
          'L': totals.L,
          'P': totals.P,
          'Total JK': totals.L + totals.P,
        });

        const wsGolongan = XLSX.utils.json_to_sheet(golonganRows);
        wsGolongan['!cols'] = [
          { wch: 5 }, { wch: 30 },
          { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
          { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 },
          { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, wsGolongan, 'Tabel Golongan per Unit');
      }

      // Export
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `agregasi-cepat-${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName, { bookType: 'xlsx', compression: true });

      const sheetCount = selectedDepartment === 'all' && aggregations.department.length > 1 ? 11 : 10;
      toast({
        title: 'Export berhasil',
        description: `File ${fileName} berhasil diunduh dengan ${data.length} pegawai (${sheetCount} sheet).`,
      });
    } catch (error) {
      toast({
        title: 'Export gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat export.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <Zap className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Agregasi Data Cepat</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Klik tombol di bawah untuk memuat data dan melihat ringkasan cepat untuk Pangkat Utama, Pendidikan, dan Jenis Kelamin.
          </p>
        </div>
        <Button onClick={() => fetchData()} disabled={isLoading} size="lg" className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat Data...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              Tampilkan Agregasi Cepat
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!aggregations) return null;

  return (
    <div className="space-y-6">
      {/* Header with Filter and Export Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Agregasi Data Cepat</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan lengkap untuk Status ASN, Pangkat, Jabatan, Pendidikan, Gender, dan Agama
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!shouldFilterByDepartment && departments.length > 0 && (
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => fetchData(selectedDepartment)} variant="outline" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pegawai aktif</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Rata-rata Usia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{aggregations.averageAge}</p>
            <p className="text-xs text-muted-foreground mt-1">Tahun</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Rata-rata Masa Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{aggregations.averageYears}</p>
            <p className="text-xs text-muted-foreground mt-1">Tahun</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Pendidikan S2/S3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {aggregations.education.filter(e => e.name === 'S2' || e.name === 'S3').reduce((sum, e) => sum + e.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((aggregations.education.filter(e => e.name === 'S2' || e.name === 'S3').reduce((sum, e) => sum + e.count, 0) / data.length) * 100).toFixed(1)}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aggregation Tables */}
      <div className="space-y-6">
        {/* Pangkat/Golongan Utama */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Pangkat/Golongan Utama</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tanpa sub-golongan (a/b/c/d)</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pangkat</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.rank.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pendidikan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Pendidikan Terakhir</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tanpa jurusan/program studi</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pendidikan</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.education.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Jenis Kelamin */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Jenis Kelamin</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribusi gender pegawai</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenis Kelamin</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.gender.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Status ASN */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Status ASN</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">PNS, CPNS, PPPK, Non ASN</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status ASN</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.asnStatus.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Jenis Jabatan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Jenis Jabatan</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Struktural, Fungsional, Pelaksana</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenis Jabatan</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.positionType.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Agama */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Agama</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribusi agama pegawai</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Agama</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.religion.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Unit Kerja - only show if viewing all departments */}
        {selectedDepartment === 'all' && aggregations.department.length > 1 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Unit Kerja</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Distribusi pegawai per unit kerja</p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/80">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Unit Kerja</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregations.department.map((item, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 bg-muted/30 font-bold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                      <td className="px-4 py-3 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rentang Usia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Rentang Usia</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribusi pegawai berdasarkan usia (Rata-rata: {aggregations.averageAge} tahun)</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rentang Usia</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.age.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Masa Kerja */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Masa Kerja</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribusi pegawai berdasarkan masa kerja (Rata-rata: {aggregations.averageYears} tahun)</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/80">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Masa Kerja</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.yearsOfService.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Separator */}
      <div className="border-t-2 border-dashed border-muted-foreground/30 my-8"></div>

      {/* Pangkat/Golongan Detail - Separated Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-primary rounded-full"></div>
          <div>
            <h3 className="text-lg font-semibold">Pangkat/Golongan Detail</h3>
            <p className="text-sm text-muted-foreground">Breakdown lengkap dengan sub-golongan (I/a, II/b, III/c, IV/d, dll)</p>
          </div>
        </div>

        <Card className="shadow-md border-primary/20">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Detail Pangkat/Golongan per Sub-Golongan
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Menampilkan distribusi pegawai berdasarkan pangkat/golongan lengkap termasuk sub-golongan
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border shadow-sm overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/80 sticky top-0">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pangkat/Golongan</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregations.detailedRank.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-lg">{item.count}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold sticky bottom-0">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right text-lg">{data.length}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Catatan Agregasi Cepat:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><strong>Status ASN:</strong> PNS, CPNS, PPPK, dan Non ASN</li>
                <li><strong>Pangkat Utama:</strong> Hanya golongan utama (I, II, III, IV) tanpa sub-golongan</li>
                <li><strong>Jenis Jabatan:</strong> Struktural, Fungsional, dan Pelaksana</li>
                <li><strong>Pendidikan:</strong> Jenjang pendidikan tertinggi tanpa jurusan</li>
                <li><strong>Jenis Kelamin:</strong> Distribusi Laki-laki dan Perempuan</li>
                <li><strong>Agama:</strong> Distribusi agama pegawai</li>
                <li><strong>Rentang Usia:</strong> Distribusi berdasarkan kelompok usia</li>
                <li><strong>Masa Kerja:</strong> Distribusi berdasarkan lama bekerja</li>
                <li><strong>Unit Kerja:</strong> Distribusi pegawai per unit (jika melihat semua unit)</li>
                <li><strong>PPPK:</strong> Golongan V, VII, IX dikategorikan sebagai PPPK</li>
                <li><strong>Non ASN:</strong> Tenaga Alih Daya dikategorikan sebagai Non ASN</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
