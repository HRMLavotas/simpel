import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Pencil, Trash2, Save, X, ChevronDown, ChevronRight, Search, RefreshCw, MoreVertical } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, POSITION_TYPES } from '@/lib/constants';
import { useDepartments } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface PositionReference {
  id: string;
  department: string;
  position_category: string;
  position_order: number;
  position_name: string;
  grade: number | null;
  abk_count: number;
}

interface EmployeeMatch {
  id: string;
  name: string;
  front_title: string | null;
  back_title: string | null;
  nip?: string | null;
  asn_status?: string | null;
  rank_group?: string | null;
  gender: string | null;
  position_name?: string | null;
  keterangan_formasi?: string | null;
  keterangan_penempatan?: string | null;
  keterangan_penugasan?: string | null;
  keterangan_perubahan?: string | null;
}

interface EducationInfo {
  employee_id: string;
  level: string;
}

const POSITION_CATEGORIES = ['Struktural', 'Fungsional', 'Pelaksana'] as const;

export default function PetaJabatan() {
  const { profile, isAdminPusat, canEdit, canViewAll } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();

  const [activeTab, setActiveTab] = useState<'asn' | 'non-asn'>('asn');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    isAdminPusat ? DEPARTMENTS[0] : (profile?.department || '')
  );
  const [positions, setPositions] = useState<PositionReference[]>([]);
  const [employees, setEmployees] = useState<EmployeeMatch[]>([]);
  const [nonAsnEmployees, setNonAsnEmployees] = useState<EmployeeMatch[]>([]);
  const [educationData, setEducationData] = useState<EducationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionReference | null>(null);

  // Collapse state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'Struktural': false,
    'Fungsional': false,
    'Pelaksana': false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formCategory, setFormCategory] = useState<string>('Struktural');
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAbk, setFormAbk] = useState('0');
  const [formOrder, setFormOrder] = useState('0');

  useEffect(() => {
    if (!isAdminPusat && profile?.department) {
      setSelectedDepartment(profile.department);
    }
  }, [profile, isAdminPusat]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchData();
    }
  }, [selectedDepartment]);

  // Real-time subscription for employee changes
  useEffect(() => {
    if (!selectedDepartment) return;

    logger.debug('Setting up real-time subscription for employees in:', selectedDepartment);
    
    const channel = supabase
      .channel(`employees-${selectedDepartment}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        (payload) => {
          logger.debug('Employee change detected:', payload);
          
          // For INSERT and UPDATE: check new record
          // For DELETE: check old record
          // For UPDATE (pindah unit): check both old and new department
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          let shouldRefresh = false;
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Check if new department matches current selected department
            if (newRecord && newRecord.department === selectedDepartment) {
              shouldRefresh = true;
              logger.debug('New/Updated record is for current department');
            }
          }
          
          if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            // Check if old department matches current selected department
            if (oldRecord && oldRecord.department === selectedDepartment) {
              shouldRefresh = true;
              logger.debug('Deleted/Old record was from current department');
            }
          }
          
          if (shouldRefresh) {
            logger.debug('Refreshing Peta Jabatan data...');
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      logger.debug('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedDepartment]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      logger.debug('Fetching data for department:', selectedDepartment);
      
      // Debug: Check all positions in database
      const { data: allPositions } = await supabase
        .from('position_references')
        .select('department')
        .limit(10);
      logger.debug('Sample departments in position_references:', allPositions);
      
      const [posRes, empRes, nonAsnRes] = await Promise.all([
        supabase
          .from('position_references')
          .select('*')
          .eq('department', selectedDepartment)
          .order('position_category')
          .order('position_order'),
        supabase
          .from('employees')
          .select('id, name, front_title, back_title, nip, asn_status, rank_group, gender, position_name, keterangan_formasi, keterangan_penempatan, keterangan_penugasan, keterangan_perubahan')
          .eq('department', selectedDepartment)
          .or('asn_status.is.null,asn_status.neq.Non ASN'),
        supabase
          .from('employees')
          .select('id, name, front_title, back_title, nip, position_name, gender, rank_group, keterangan_penugasan')
          .eq('department', selectedDepartment)
          .eq('asn_status', 'Non ASN'),
      ]);

      logger.debug('Position query result:', posRes);
      logger.debug('Employee query result:', empRes);
      logger.debug('Non-ASN query result:', nonAsnRes);

      if (posRes.error) throw posRes.error;
      if (empRes.error) throw empRes.error;
      if (nonAsnRes.error) throw nonAsnRes.error;

      setPositions(posRes.data || []);
      setEmployees(empRes.data || []);
      setNonAsnEmployees(nonAsnRes.data || []);
      
      logger.debug('Positions loaded:', posRes.data?.length || 0);
      logger.debug('Employees loaded:', empRes.data?.length || 0);
      logger.debug('Non-ASN loaded:', nonAsnRes.data?.length || 0);

      // Fetch latest education for each employee (ASN only)
      if (empRes.data && empRes.data.length > 0) {
        const empIds = empRes.data.map(e => e.id);
        const { data: eduData } = await supabase
          .from('education_history')
          .select('employee_id, level')
          .in('employee_id', empIds)
          .order('graduation_year', { ascending: false });
        
        // Get latest education per employee
        const latestEdu: Record<string, string> = {};
        (eduData || []).forEach(e => {
          if (!latestEdu[e.employee_id]) {
            latestEdu[e.employee_id] = e.level;
          }
        });
        setEducationData(Object.entries(latestEdu).map(([employee_id, level]) => ({ employee_id, level })));
      } else {
        setEducationData([]);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeEducation = (employeeId: string) => {
    return educationData.find(e => e.employee_id === employeeId)?.level || '-';
  };

  const getMatchingEmployees = (positionName: string) => {
    // Normalize: trim, lowercase, and collapse multiple spaces into one
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
    const norm = normalize(positionName);
    
    const matched = employees.filter(e => {
      if (!e.position_name) return false;
      const empNorm = normalize(e.position_name);
      const isMatch = empNorm === norm;
      
      // Debug logging for this specific position
      if (positionName.toLowerCase().includes('arsiparis')) {
        logger.debug(`Checking employee: ${e.name}`);
        logger.debug(`  Position in DB: "${e.position_name}"`);
        logger.debug(`  Normalized: "${empNorm}"`);
        logger.debug(`  Looking for: "${norm}"`);
        logger.debug(`  Match: ${isMatch}`);
      }
      
      return isMatch;
    });
    
    // Debug logging to help identify matching issues
    if (matched.length === 0 && positionName.toLowerCase().includes('arsiparis')) {
      logger.debug(`❌ No match for position: "${positionName}" (normalized: "${norm}")`);
      logger.debug('All employee positions in this department:');
      employees.forEach(e => {
        if (e.position_name) {
          logger.debug(`  - ${e.name}: "${e.position_name}" (normalized: "${normalize(e.position_name)}")`);
        }
      });
    } else if (matched.length > 0 && positionName.toLowerCase().includes('arsiparis')) {
      logger.debug(`✅ Found ${matched.length} match(es) for "${positionName}":`, matched.map(e => e.name));
    }
    
    return matched;
  };

  // Group positions by category with search filter
  const groupedPositions = useMemo(() => {
    const groups: Record<string, PositionReference[]> = {
      Struktural: [],
      Fungsional: [],
      Pelaksana: [],
    };
    
    // Filter positions by search query
    const filteredPositions = positions.filter(p => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      
      // Search in position name
      if (p.position_name.toLowerCase().includes(query)) return true;
      
      // Search in employee names
      const matchedEmployees = getMatchingEmployees(p.position_name);
      return matchedEmployees.some(emp => {
        const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ').toLowerCase();
        return fullName.includes(query) || emp.nip?.includes(query);
      });
    });
    
    filteredPositions.forEach(p => {
      if (groups[p.position_category]) {
        groups[p.position_category].push(p);
      }
    });
    return groups;
  }, [positions, searchQuery, employees]);

  const openAddModal = () => {
    setEditingPosition(null);
    setFormCategory('Struktural');
    setFormName('');
    setFormGrade('');
    setFormAbk('0');
    setFormOrder('0');
    setShowModal(true);
  };

  const openEditModal = (pos: PositionReference) => {
    setEditingPosition(pos);
    setFormCategory(pos.position_category);
    setFormName(pos.position_name);
    setFormGrade(pos.grade?.toString() || '');
    setFormAbk(pos.abk_count.toString());
    setFormOrder(pos.position_order.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama jabatan wajib diisi' });
      return;
    }

    const data = {
      department: selectedDepartment,
      position_category: formCategory,
      position_name: formName.trim(),
      grade: formGrade ? parseInt(formGrade) : null,
      abk_count: parseInt(formAbk) || 0,
      position_order: parseInt(formOrder) || 0,
    };

    try {
      if (editingPosition) {
        const { error } = await supabase
          .from('position_references')
          .update(data)
          .eq('id', editingPosition.id);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jabatan berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('position_references')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Jabatan berhasil ditambahkan' });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('position_references').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Jabatan berhasil dihapus' });
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleEditNonAsnEmployee = (employee: EmployeeMatch) => {
    // Redirect to Data Pegawai page with employee ID
    // Or open a modal to edit employee
    toast({ 
      title: 'Info', 
      description: 'Untuk mengedit pegawai Non-ASN, silakan buka menu Data Pegawai → Tab Non-ASN',
      duration: 5000
    });
  };

  const handleDeleteNonAsnEmployee = async (employee: EmployeeMatch) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pegawai ${employee.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('employees').delete().eq('id', employee.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pegawai Non-ASN berhasil dihapus' });
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleExport = () => {
    const rows: Record<string, string | number>[] = [];
    let no = 1;

    POSITION_CATEGORIES.forEach(category => {
      rows.push({
        'No': '',
        'Jabatan Sesuai Kepmen 202 Tahun 2024': category.toUpperCase(),
        'Grade/Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '',
        'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '',
        'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '',
        'Keterangan Formasi': '', 'Keterangan Penempatan': '',
        'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '',
      });

      const catPositions = groupedPositions[category] || [];
      catPositions.forEach(pos => {
        const matched = getMatchingEmployees(pos.position_name);
        const existing = matched.length;
        const ketFormasi = pos.abk_count - existing;

        if (matched.length === 0) {
          rows.push({
            'No': no++,
            'Jabatan Sesuai Kepmen 202 Tahun 2024': pos.position_name,
            'Grade/Kelas Jabatan': pos.grade || '',
            'Jumlah ABK': pos.abk_count,
            'Jumlah Existing': 0,
            'Nama Pemangku': '-',
            'Kriteria ASN': '-',
            'NIP': '-',
            'Pangkat Golongan': '-',
            'Pendidikan Terakhir': '-',
            'Jenis Kelamin': '-',
            'Keterangan Formasi': ketFormasi > 0 ? `Kurang ${ketFormasi}` : 'Sesuai',
            'Keterangan Penempatan': '-',
            'Keterangan Penugasan Tambahan': '-',
            'Keterangan Perubahan': '-',
          });
        } else {
          matched.forEach((emp, idx) => {
            const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
            rows.push({
              'No': idx === 0 ? no++ : '',
              'Jabatan Sesuai Kepmen 202 Tahun 2024': idx === 0 ? pos.position_name : '',
              'Grade/Kelas Jabatan': idx === 0 ? (pos.grade || '') : '',
              'Jumlah ABK': idx === 0 ? pos.abk_count : '',
              'Jumlah Existing': idx === 0 ? existing : '',
              'Nama Pemangku': fullName,
              'Kriteria ASN': emp.asn_status || '-',
              'NIP': emp.nip || '-',
              'Pangkat Golongan': emp.rank_group || '-',
              'Pendidikan Terakhir': getEmployeeEducation(emp.id),
              'Jenis Kelamin': emp.gender || '-',
              'Keterangan Formasi': idx === 0 ? (ketFormasi > 0 ? `Kurang ${ketFormasi}` : (ketFormasi < 0 ? `Lebih ${Math.abs(ketFormasi)}` : 'Sesuai')) : '',
              'Keterangan Penempatan': emp.keterangan_penempatan || '-',
              'Keterangan Penugasan Tambahan': emp.keterangan_penugasan || '-',
              'Keterangan Perubahan': emp.keterangan_perubahan || '-',
            });
          });
        }
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 14 },
      { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 18 },
      { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Peta Jabatan');
    XLSX.writeFile(wb, `Peta_Jabatan_${selectedDepartment.replace(/\s/g, '_')}.xlsx`);
  };

  // Build table rows for display
  const tableRows = useMemo(() => {
    const result: {
      type: 'category' | 'position';
      category?: string;
      position?: PositionReference;
      employee?: EmployeeMatch;
      isFirst?: boolean;
      existing?: number;
      rowSpan?: number;
    }[] = [];

    POSITION_CATEGORIES.forEach(category => {
      result.push({ type: 'category', category });
      const catPositions = groupedPositions[category] || [];
      catPositions.forEach(pos => {
        const matched = getMatchingEmployees(pos.position_name);
        if (matched.length === 0) {
          result.push({ type: 'position', position: pos, isFirst: true, existing: 0, rowSpan: 1 });
        } else {
          matched.forEach((emp, idx) => {
            result.push({
              type: 'position',
              position: pos,
              employee: emp,
              isFirst: idx === 0,
              existing: matched.length,
              rowSpan: matched.length,
            });
          });
        }
      });
    });

    return result;
  }, [groupedPositions, employees]);

  let positionNo = 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Peta Jabatan</h1>
            <p className="page-description">Jabatan Sesuai Kepmen 202 Tahun 2024</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canViewAll && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicDepartments.filter(d => d !== 'Pusat').map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchData()} 
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={positions.length === 0} className="text-xs sm:text-sm">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span><span className="sm:hidden">Export</span>
            </Button>
            {isAdminPusat && (
              <Button onClick={openAddModal} className="text-xs sm:text-sm">
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tambah Jabatan</span><span className="sm:hidden">Tambah</span>
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="asn">
              Peta Jabatan ASN
              <span className="ml-2 text-xs">({positions.length} jabatan, {employees.length} pegawai)</span>
            </TabsTrigger>
            <TabsTrigger value="non-asn">
              Formasi Non-ASN
              <span className="ml-2 text-xs">
                ({(() => {
                  const uniquePositions = new Set(nonAsnEmployees.map(e => e.position_name || 'Tidak Ada Jabatan'));
                  return uniquePositions.size;
                })()} jabatan, {nonAsnEmployees.length} pegawai)
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab ASN */}
          <TabsContent value="asn">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg">
                    {selectedDepartment}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({positions.length} jabatan, {employees.length} pegawai ASN)
                    </span>
                  </CardTitle>
                  
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari jabatan atau nama pegawai..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-8"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-8"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Jabatan Sesuai Kepmen 202/2024</TableHead>
                      <TableHead className="w-16 text-center">Grade</TableHead>
                      <TableHead className="w-16 text-center">ABK</TableHead>
                      <TableHead className="w-16 text-center">Existing</TableHead>
                      <TableHead>Nama Pemangku</TableHead>
                      <TableHead className="w-20 text-center">Kriteria ASN</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      {isAdminPusat && <TableHead className="w-20">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row, idx) => {
                      if (row.type === 'category') {
                        const categoryPositions = groupedPositions[row.category!] || [];
                        const totalEmployees = categoryPositions.reduce((sum, pos) => {
                          return sum + getMatchingEmployees(pos.position_name).length;
                        }, 0);
                        
                        return (
                          <TableRow 
                            key={`cat-${row.category}`} 
                            className="bg-muted/60 hover:bg-muted/80 cursor-pointer transition-colors"
                            onClick={() => toggleCategory(row.category!)}
                          >
                            <TableCell colSpan={16} className="font-semibold text-sm py-3">
                              <div className="flex items-center gap-2">
                                {collapsedCategories[row.category!] ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                <span>{row.category}</span>
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  ({categoryPositions.length} jabatan, {totalEmployees} pegawai)
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // Skip position rows if category is collapsed
                      if (collapsedCategories[row.position!.position_category]) {
                        return null;
                      }

                      const pos = row.position!;
                      const emp = row.employee;
                      const existing = row.existing || 0;
                      const ketFormasi = pos.abk_count - existing;

                      if (row.isFirst) positionNo++;

                      const fullName = emp
                        ? [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ')
                        : '-';

                      return (
                        <TableRow key={`pos-${idx}`} className={cn(!emp && 'bg-muted/30')}>
                          {row.isFirst && (
                            <>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top font-medium">
                                {positionNo}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="font-medium align-top">
                                {pos.position_name}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top">
                                {pos.grade || '-'}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top">
                                {pos.abk_count}
                              </TableCell>
                              <TableCell rowSpan={row.rowSpan} className="text-center align-top">
                                {existing}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-sm">{fullName}</TableCell>
                          <TableCell className="text-center text-sm">{emp?.asn_status || '-'}</TableCell>
                          {row.isFirst && (
                            <TableCell rowSpan={row.rowSpan} className="align-top text-xs">
                              {ketFormasi > 0
                                ? <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">Kurang {ketFormasi}</span>
                                : ketFormasi < 0
                                ? <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Lebih {Math.abs(ketFormasi)}</span>
                                : <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Sesuai</span>}
                            </TableCell>
                          )}
                          {isAdminPusat && row.isFirst && (
                            <TableCell rowSpan={row.rowSpan} className="align-top">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEditModal(pos)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Jabatan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(pos.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {positions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                          Belum ada data jabatan. Klik "Tambah Jabatan" untuk menambahkan.
                        </TableCell>
                      </TableRow>
                    )}
                    {positions.length > 0 && tableRows.filter(r => r.type === 'position' && !collapsedCategories[r.position!.position_category]).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                          {searchQuery 
                            ? `Tidak ada hasil untuk "${searchQuery}"`
                            : 'Semua kategori sedang ditutup. Klik kategori untuk membuka.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Non-ASN */}
      <TabsContent value="non-asn">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Formasi Non-ASN - {selectedDepartment}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({nonAsnEmployees.length} pegawai Non-ASN)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead className="w-24 text-center">Formasi</TableHead>
                      <TableHead className="w-24 text-center">Existing</TableHead>
                      <TableHead>Nama Pemangku</TableHead>
                      <TableHead className="w-40">Type Non ASN</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      {isAdminPusat && <TableHead className="w-20">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonAsnEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdminPusat ? 8 : 7} className="text-center py-8 text-muted-foreground">
                          Belum ada data pegawai Non-ASN di unit kerja ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (() => {
                        // Group employees by position_name
                        const groupedByPosition: Record<string, EmployeeMatch[]> = {};
                        nonAsnEmployees.forEach(emp => {
                          const position = emp.position_name || 'Tidak Ada Jabatan';
                          if (!groupedByPosition[position]) {
                            groupedByPosition[position] = [];
                          }
                          groupedByPosition[position].push(emp);
                        });

                        let rowNumber = 0;
                        return Object.entries(groupedByPosition).map(([position, employees]) => {
                          rowNumber++;
                          const formasi = employees.length; // Formasi = jumlah pegawai dengan jabatan yang sama
                          const existing = employees.length; // Existing = sama dengan formasi (karena ini data aktual)
                          const status = formasi - existing; // Status selalu 0 karena formasi = existing

                          return employees.map((emp, idx) => {
                            const isFirst = idx === 0;
                            const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
                            
                            return (
                              <TableRow key={emp.id}>
                                {isFirst && (
                                  <>
                                    <TableCell rowSpan={employees.length} className="text-center font-medium align-top">
                                      {rowNumber}
                                    </TableCell>
                                    <TableCell rowSpan={employees.length} className="font-medium align-top">
                                      {position}
                                    </TableCell>
                                    <TableCell rowSpan={employees.length} className="text-center align-top font-medium">
                                      {formasi}
                                    </TableCell>
                                    <TableCell rowSpan={employees.length} className="text-center align-top font-medium">
                                      {existing}
                                    </TableCell>
                                  </>
                                )}
                                <TableCell className="text-sm">{fullName}</TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "inline-block px-2 py-1 rounded text-xs font-medium",
                                    emp.rank_group === 'Tenaga Alih Daya' 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-purple-100 text-purple-800"
                                  )}>
                                    {emp.rank_group || 'Tenaga Alih Daya'}
                                  </span>
                                </TableCell>
                                {isFirst && (
                                  <TableCell rowSpan={employees.length} className="align-top">
                                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                      Sesuai
                                    </span>
                                  </TableCell>
                                )}
                                <TableCell>
                                  {isAdminPusat && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleEditNonAsnEmployee(emp)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit Pegawai
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteNonAsnEmployee(emp)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Hapus
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        });
                      })()
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Edit Jabatan' : 'Tambah Jabatan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori Jabatan</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITION_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Jabatan (Kepmen 202/2024)</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Direktur Jenderal" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Grade/Kelas</Label>
                <Input type="number" value={formGrade} onChange={e => setFormGrade(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Jumlah ABK</Label>
                <Input type="number" value={formAbk} onChange={e => setFormAbk(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={formOrder} onChange={e => setFormOrder(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
