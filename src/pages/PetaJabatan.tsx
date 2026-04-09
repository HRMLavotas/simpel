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
  department?: string | null;
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

  // Calculate default department based on user role
  const defaultDepartment = useMemo(() => {
    if (canViewAll) {
      return 'Setditjen Binalavotas';
    }
    if (profile?.department) {
      return profile.department;
    }
    return '';
  }, [canViewAll, profile?.department]);

  const [activeTab, setActiveTab] = useState<'asn' | 'non-asn' | 'summary-asn' | 'summary-non-asn'>('asn');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Setditjen Binalavotas'); // Always start with Setditjen Binalavotas
  const [positions, setPositions] = useState<PositionReference[]>([]);
  const [employees, setEmployees] = useState<EmployeeMatch[]>([]);
  const [nonAsnEmployees, setNonAsnEmployees] = useState<EmployeeMatch[]>([]);
  const [educationData, setEducationData] = useState<EducationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionReference | null>(null);

  // Summary data for all departments
  const [allPositions, setAllPositions] = useState<PositionReference[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeMatch[]>([]);
  const [allNonAsnEmployees, setAllNonAsnEmployees] = useState<EmployeeMatch[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Collapse state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'Struktural': false,
    'Fungsional': false,
    'Pelaksana': false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [nonAsnSearchQuery, setNonAsnSearchQuery] = useState('');

  // Summary tab filters
  const [summarySearchQuery, setSummarySearchQuery] = useState('');
  const [summaryFilterCategory, setSummaryFilterCategory] = useState<string>('all');
  const [summaryFilterStatus, setSummaryFilterStatus] = useState<string>('all');
  
  // Summary Non-ASN filters
  const [summaryNonAsnSearchQuery, setSummaryNonAsnSearchQuery] = useState('');
  
  // Expandable rows state for summary per jabatan
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  // Form state
  const [formCategory, setFormCategory] = useState<string>('Struktural');
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAbk, setFormAbk] = useState('0');
  const [formOrder, setFormOrder] = useState('0');

  useEffect(() => {
    // Set initial department based on user role (only on mount)
    if (!canViewAll && profile?.department) {
      // For Admin Unit, set to their department
      setSelectedDepartment(profile.department);
    } else if (canViewAll && !selectedDepartment) {
      // For Admin Pimpinan/Pusat, set default only if empty
      setSelectedDepartment('Setditjen Binalavotas');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll, profile?.department]); // Removed selectedDepartment from dependencies

  useEffect(() => {
    if (selectedDepartment) {
      fetchData();
    }
  }, [selectedDepartment]);

  // Fetch summary data when summary tab is active
  useEffect(() => {
    if (activeTab === 'summary-asn' || activeTab === 'summary-non-asn') {
      fetchSummaryData();
    }
  }, [activeTab]);

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
      
      // Helper to fetch all records without 1000-row limit
      // Uses a factory function to create fresh query per batch (Supabase builder is mutable)
      const fetchAllUnlimited = async (buildQuery: () => any) => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData.push(...data);
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return { data: allData, error: null };
      };

      const [posRes, empRes, nonAsnRes] = await Promise.all([
        fetchAllUnlimited(() =>
          supabase
            .from('position_references')
            .select('*')
            .eq('department', selectedDepartment)
            .order('position_category')
            .order('position_order')
        ),
        fetchAllUnlimited(() =>
          supabase
            .from('employees')
            .select('id, name, front_title, back_title, nip, asn_status, rank_group, gender, position_name, keterangan_formasi, keterangan_penempatan, keterangan_penugasan, keterangan_perubahan')
            .eq('department', selectedDepartment)
            .or('asn_status.is.null,asn_status.neq.Non ASN')
        ),
        fetchAllUnlimited(() =>
          supabase
            .from('employees')
            .select('id, name, front_title, back_title, nip, position_name, gender, rank_group, keterangan_penugasan')
            .eq('department', selectedDepartment)
            .eq('asn_status', 'Non ASN')
        ),
      ]);

      setPositions(posRes.data || []);
      setEmployees((empRes.data || []) as EmployeeMatch[]);
      setNonAsnEmployees((nonAsnRes.data || []) as EmployeeMatch[]);
      
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

  const fetchSummaryData = async () => {
    setIsSummaryLoading(true);
    try {
      logger.debug('Fetching summary data', { canViewAll, department: profile?.department });
      
      // Helper to fetch all records without 1000-row limit
      const fetchAllUnlimited = async (buildQuery: () => any) => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData.push(...data);
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return { data: allData, error: null };
      };

      // For Admin Unit, only fetch their department data
      // For Admin Pusat/Pimpinan, fetch all departments
      const [allPosRes, allEmpRes, allNonAsnRes] = await Promise.all([
        fetchAllUnlimited(() => {
          let query = supabase
            .from('position_references')
            .select('*');
          
          // Filter by department for Admin Unit
          if (!canViewAll && profile?.department) {
            query = query.eq('department', profile.department);
          }
          
          return query
            .order('department')
            .order('position_category')
            .order('position_order');
        }),
        fetchAllUnlimited(() => {
          let query = supabase
            .from('employees')
            .select('id, name, department, position_name, asn_status')
            .or('asn_status.is.null,asn_status.neq.Non ASN');
          
          // Filter by department for Admin Unit
          if (!canViewAll && profile?.department) {
            query = query.eq('department', profile.department);
          }
          
          return query;
        }),
        fetchAllUnlimited(() => {
          let query = supabase
            .from('employees')
            .select('id, name, department, position_name, rank_group')
            .eq('asn_status', 'Non ASN');
          
          // Filter by department for Admin Unit
          if (!canViewAll && profile?.department) {
            query = query.eq('department', profile.department);
          }
          
          return query;
        }),
      ]);

      setAllPositions(allPosRes.data || []);
      setAllEmployees((allEmpRes.data || []) as EmployeeMatch[]);
      setAllNonAsnEmployees((allNonAsnRes.data || []) as EmployeeMatch[]);
      
      logger.debug('Summary data loaded:', {
        positions: allPosRes.data?.length || 0,
        employees: allEmpRes.data?.length || 0,
        nonAsnEmployees: allNonAsnRes.data?.length || 0,
        canViewAll,
        department: profile?.department
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSummaryLoading(false);
    }
  };



  // Group positions by category with search filter
  const groupedPositions = useMemo(() => {
    const groups: Record<string, PositionReference[]> = {
      Struktural: [],
      Fungsional: [],
      Pelaksana: [],
    };
    
    // Normalize: trim, lowercase, and collapse multiple spaces into one
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

    // Pre-group employees by their normalized position name for O(1) lookup
    const employeesByPosition = new Map<string, EmployeeMatch[]>();
    employees.forEach(emp => {
      if (emp.position_name) {
        const norm = normalize(emp.position_name);
        const list = employeesByPosition.get(norm) || [];
        list.push(emp);
        employeesByPosition.set(norm, list);
      }
    });

    const getMatchingEmployees = (positionName: string) => {
      const norm = normalize(positionName);
      return employeesByPosition.get(norm) || [];
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

    return { groups, getMatchingEmployees };
  }, [positions, searchQuery, employees]);

  // Extract getMatchingEmployees from the memoized result
  const getMatchingEmployees = groupedPositions.getMatchingEmployees;
  const groupsData = groupedPositions.groups;

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

  const togglePositionExpand = (positionName: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionName)) {
        newSet.delete(positionName);
      } else {
        newSet.add(positionName);
      }
      return newSet;
    });
  };

  const handleExportASN = () => {
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

      const catPositions = groupsData[category] || [];
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
    XLSX.utils.book_append_sheet(wb, ws, 'Peta Jabatan ASN');
    XLSX.writeFile(wb, `Peta_Jabatan_ASN_${selectedDepartment.replace(/\s/g, '_')}.xlsx`);
    
    toast({ title: 'Berhasil', description: `Data Peta Jabatan ASN berhasil di-export (${rows.length - POSITION_CATEGORIES.length} baris data)` });
  };

  const handleExportNonASN = () => {
    const rows: Record<string, string | number>[] = [];
    
    // Group employees by position_name
    const groupedByPosition: Record<string, EmployeeMatch[]> = {};
    nonAsnEmployees.forEach(emp => {
      const position = emp.position_name || 'Tidak Ada Jabatan';
      if (!groupedByPosition[position]) {
        groupedByPosition[position] = [];
      }
      groupedByPosition[position].push(emp);
    });

    let no = 1;
    Object.entries(groupedByPosition).forEach(([position, employees]) => {
      const formasi = employees.length;
      const existing = employees.length;

      employees.forEach((emp, idx) => {
        const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
        rows.push({
          'No': idx === 0 ? no++ : '',
          'Jabatan': idx === 0 ? position : '',
          'Formasi': idx === 0 ? formasi : '',
          'Existing': idx === 0 ? existing : '',
          'Nama Pemangku': fullName,
          'NIP': emp.nip || '-',
          'Type Non ASN': emp.rank_group || 'Tenaga Alih Daya',
          'Jenis Kelamin': emp.gender || '-',
          'Keterangan Penugasan': emp.keterangan_penugasan || '-',
          'Status': idx === 0 ? 'Sesuai' : '',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 10 }, { wch: 10 },
      { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
      { wch: 30 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Formasi Non-ASN');
    XLSX.writeFile(wb, `Formasi_Non_ASN_${selectedDepartment.replace(/\s/g, '_')}.xlsx`);
    
    toast({ title: 'Berhasil', description: `Data Formasi Non-ASN berhasil di-export (${rows.length} baris data)` });
  };

  const handleExportSummary = () => {
    const wb = XLSX.utils.book_new();
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

    // Sheet 1: Summary per Unit Kerja (only for Admin Pusat/Pimpinan)
    if (canViewAll) {
      const deptRows: Record<string, string | number>[] = [];
      dynamicDepartments
        .filter(d => d !== 'Pusat')
        .forEach((dept, idx) => {
          const deptPositions = allPositions.filter(p => p.department === dept);
          const totalAbk = deptPositions.reduce((sum, p) => sum + p.abk_count, 0);
          
          const positionNames = new Set(deptPositions.map(p => normalize(p.position_name)));
          const totalExisting = allEmployees.filter(emp => 
            emp.department === dept && emp.position_name && positionNames.has(normalize(emp.position_name))
          ).length;
          
          const gap = totalAbk - totalExisting;
          const percentage = totalAbk > 0 ? ((totalExisting / totalAbk) * 100).toFixed(1) : '0';
          
          deptRows.push({
            'No': idx + 1,
            'Unit Kerja': dept,
            'Total Jabatan': deptPositions.length,
            'Total ABK': totalAbk,
            'Total Existing': totalExisting,
            'Gap': gap,
            '% Terisi': `${percentage}%`,
            'Status': gap > 0 ? `Kurang ${gap}` : gap < 0 ? `Lebih ${Math.abs(gap)}` : 'Sesuai',
          });
        });

      const ws1 = XLSX.utils.json_to_sheet(deptRows);
      ws1['!cols'] = [
        { wch: 5 }, { wch: 35 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary per Unit');
    }

    // Sheet 2: Summary per Jabatan
    const positionGroups = new Map<string, {
      category: string;
      displayName: string;
      totalAbk: number;
      totalExisting: number;
    }>();

    allPositions.forEach(pos => {
      const normName = normalize(pos.position_name);
      const existing = positionGroups.get(normName);
      
      if (existing) {
        existing.totalAbk += pos.abk_count;
      } else {
        positionGroups.set(normName, {
          category: pos.position_category,
          displayName: pos.position_name,
          totalAbk: pos.abk_count,
          totalExisting: 0,
        });
      }
    });

    // Count existing employees per position
    allEmployees.forEach(emp => {
      if (emp.position_name) {
        const normName = normalize(emp.position_name);
        const group = positionGroups.get(normName);
        if (group) {
          group.totalExisting++;
        }
      }
    });

    const positionRows: Record<string, string | number>[] = [];
    let posNo = 1;
    
    POSITION_CATEGORIES.forEach(category => {
      const categoryPositions = Array.from(positionGroups.values())
        .filter(p => p.category === category)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      categoryPositions.forEach(pos => {
        const gap = pos.totalAbk - pos.totalExisting;
        const percentage = pos.totalAbk > 0 ? ((pos.totalExisting / pos.totalAbk) * 100).toFixed(1) : '0';
        
        positionRows.push({
          'No': posNo++,
          'Kategori': pos.category,
          'Nama Jabatan': pos.displayName,
          'Total ABK': pos.totalAbk,
          'Total Existing': pos.totalExisting,
          'Gap': gap,
          '% Terisi': `${percentage}%`,
          'Status': gap > 0 ? `Kurang ${gap}` : gap < 0 ? `Lebih ${Math.abs(gap)}` : 'Sesuai',
        });
      });
    });

    const ws2 = XLSX.utils.json_to_sheet(positionRows);
    ws2['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 12 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary per Jabatan');

    // Sheet 3: Summary per Kategori
    const categoryRows: Record<string, string | number>[] = [];
    POSITION_CATEGORIES.forEach((category, idx) => {
      const categoryPositions = allPositions.filter(p => p.position_category === category);
      const totalAbk = categoryPositions.reduce((sum, p) => sum + p.abk_count, 0);
      
      const positionNames = new Set(categoryPositions.map(p => normalize(p.position_name)));
      const totalExisting = allEmployees.filter(emp => 
        emp.position_name && positionNames.has(normalize(emp.position_name))
      ).length;
      
      const gap = totalAbk - totalExisting;
      const percentage = totalAbk > 0 ? ((totalExisting / totalAbk) * 100).toFixed(1) : '0';
      
      categoryRows.push({
        'No': idx + 1,
        'Kategori': category,
        'Total Jabatan': categoryPositions.length,
        'Total ABK': totalAbk,
        'Total Existing': totalExisting,
        'Gap': gap,
        '% Terisi': `${percentage}%`,
        'Status': gap > 0 ? `Kurang ${gap}` : gap < 0 ? `Lebih ${Math.abs(gap)}` : 'Sesuai',
      });
    });

    const ws3 = XLSX.utils.json_to_sheet(categoryRows);
    ws3['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 14 }, { wch: 12 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Summary per Kategori');

    // Generate filename based on role
    const filename = canViewAll 
      ? `Summary_Peta_Jabatan_Semua_Unit.xlsx`
      : `Summary_Peta_Jabatan_${(profile?.department || selectedDepartment).replace(/\s/g, '_')}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    
    const sheetCount = canViewAll ? 3 : 2; // Admin Unit doesn't have "Summary per Unit" sheet
    toast({ 
      title: 'Berhasil', 
      description: `Summary Peta Jabatan berhasil di-export (${sheetCount} sheets)` 
    });
  };

  const handleExportSummaryNonASN = () => {
    const wb = XLSX.utils.book_new();
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

    // Sheet 1: Summary per Unit Kerja (only for Admin Pusat/Pimpinan)
    if (canViewAll) {
      const deptRows: Record<string, string | number>[] = [];
      dynamicDepartments
        .filter(d => d !== 'Pusat')
        .forEach((dept, idx) => {
          const deptNonAsn = allNonAsnEmployees.filter(e => e.department === dept);
          const tenagaAlihDaya = deptNonAsn.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length;
          const lainnya = deptNonAsn.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length;
          const uniquePositions = new Set(deptNonAsn.map(e => e.position_name || 'Tidak Ada Jabatan'));
          
          if (deptNonAsn.length > 0) {
            deptRows.push({
              'No': idx + 1,
              'Unit Kerja': dept,
              'Total Non-ASN': deptNonAsn.length,
              'Tenaga Alih Daya': tenagaAlihDaya,
              'Lainnya': lainnya,
              'Jumlah Jabatan': uniquePositions.size,
            });
          }
        });

      if (deptRows.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(deptRows);
        ws1['!cols'] = [
          { wch: 5 }, { wch: 35 }, { wch: 14 }, { wch: 16 },
          { wch: 10 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Summary per Unit');
      }
    }

    // Sheet 2: Summary per Jabatan
    const positionGroups = new Map<string, {
      displayName: string;
      total: number;
      tenagaAlihDaya: number;
      lainnya: number;
      departments: Set<string>;
    }>();

    allNonAsnEmployees.forEach(emp => {
      const posName = emp.position_name || 'Tidak Ada Jabatan';
      const normName = normalize(posName);
      const existing = positionGroups.get(normName);
      
      const isTenagaAlihDaya = emp.rank_group === 'Tenaga Alih Daya' || !emp.rank_group;
      
      if (existing) {
        existing.total++;
        if (isTenagaAlihDaya) {
          existing.tenagaAlihDaya++;
        } else {
          existing.lainnya++;
        }
        if (emp.department) {
          existing.departments.add(emp.department);
        }
      } else {
        positionGroups.set(normName, {
          displayName: posName,
          total: 1,
          tenagaAlihDaya: isTenagaAlihDaya ? 1 : 0,
          lainnya: isTenagaAlihDaya ? 0 : 1,
          departments: emp.department ? new Set([emp.department]) : new Set()
        });
      }
    });

    const positionRows: Record<string, string | number>[] = [];
    const sortedPositions = Array.from(positionGroups.values())
      .sort((a, b) => b.total - a.total);

    sortedPositions.forEach((pos, idx) => {
      const row: Record<string, string | number> = {
        'No': idx + 1,
        'Jabatan': pos.displayName,
        'Total Pegawai': pos.total,
        'Tenaga Alih Daya': pos.tenagaAlihDaya,
        'Lainnya': pos.lainnya,
      };
      
      if (canViewAll) {
        row['Jumlah Unit'] = pos.departments.size;
      }
      
      positionRows.push(row);
    });

    const ws2 = XLSX.utils.json_to_sheet(positionRows);
    ws2['!cols'] = canViewAll 
      ? [{ wch: 5 }, { wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 12 }]
      : [{ wch: 5 }, { wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary per Jabatan');

    // Sheet 3: Summary per Type
    const typeRows: Record<string, string | number>[] = [
      {
        'No': 1,
        'Type': 'Tenaga Alih Daya',
        'Total Pegawai': allNonAsnEmployees.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length,
        'Persentase': `${((allNonAsnEmployees.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length / (allNonAsnEmployees.length || 1)) * 100).toFixed(1)}%`,
      },
      {
        'No': 2,
        'Type': 'Lainnya',
        'Total Pegawai': allNonAsnEmployees.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length,
        'Persentase': `${((allNonAsnEmployees.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length / (allNonAsnEmployees.length || 1)) * 100).toFixed(1)}%`,
      },
      {
        'No': '',
        'Type': 'TOTAL',
        'Total Pegawai': allNonAsnEmployees.length,
        'Persentase': '100%',
      },
    ];

    const ws3 = XLSX.utils.json_to_sheet(typeRows);
    ws3['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Summary per Type');

    // Generate filename based on role
    const filename = canViewAll 
      ? `Summary_Non_ASN_Semua_Unit.xlsx`
      : `Summary_Non_ASN_${(profile?.department || selectedDepartment).replace(/\s/g, '_')}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    
    const sheetCount = canViewAll ? 3 : 2; // Admin Unit doesn't have "Summary per Unit" sheet
    toast({ 
      title: 'Berhasil', 
      description: `Summary Non-ASN berhasil di-export (${sheetCount} sheets)` 
    });
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
      const catPositions = groupsData[category] || [];
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
  }, [groupsData, employees, getMatchingEmployees]);

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
                <SelectTrigger id="department-filter" className="w-full sm:w-[240px]">
                  <SelectValue>
                    {selectedDepartment || "Pilih Unit Kerja"}
                  </SelectValue>
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
            {isAdminPusat && (
              <Button onClick={openAddModal} className="text-xs sm:text-sm">
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tambah Jabatan</span><span className="sm:hidden">Tambah</span>
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn' | 'summary-asn' | 'summary-non-asn')} className="space-y-4">
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
            <TabsTrigger value="summary-asn">
              Summary ASN
            </TabsTrigger>
            <TabsTrigger value="summary-non-asn">
              Summary Non-ASN
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
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                    
                    {/* Export Button */}
                    <Button 
                      variant="outline" 
                      onClick={handleExportASN} 
                      disabled={positions.length === 0}
                      className="text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Download className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Export ASN</span><span className="sm:hidden">Export</span>
                    </Button>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">
                Formasi Non-ASN - {selectedDepartment}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({nonAsnEmployees.length} pegawai Non-ASN)
                </span>
              </CardTitle>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari jabatan atau nama pegawai..."
                    value={nonAsnSearchQuery}
                    onChange={(e) => setNonAsnSearchQuery(e.target.value)}
                    className="pl-10 pr-8"
                  />
                  {nonAsnSearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-8"
                      onClick={() => setNonAsnSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Export Button */}
                <Button 
                  variant="outline" 
                  onClick={handleExportNonASN} 
                  disabled={nonAsnEmployees.length === 0}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <Download className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export Non-ASN</span><span className="sm:hidden">Export</span>
                </Button>
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
                        // Filter employees by search query
                        const filteredEmployees = nonAsnEmployees.filter(emp => {
                          if (!nonAsnSearchQuery) return true;
                          const query = nonAsnSearchQuery.toLowerCase();
                          
                          // Search in position name
                          if (emp.position_name?.toLowerCase().includes(query)) return true;
                          
                          // Search in employee name
                          const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ').toLowerCase();
                          if (fullName.includes(query)) return true;
                          
                          // Search in NIP
                          if (emp.nip?.includes(query)) return true;
                          
                          return false;
                        });

                        if (filteredEmployees.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={isAdminPusat ? 8 : 7} className="text-center py-8 text-muted-foreground">
                                {nonAsnSearchQuery 
                                  ? `Tidak ada hasil untuk "${nonAsnSearchQuery}"`
                                  : 'Belum ada data pegawai Non-ASN di unit kerja ini.'}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Group employees by position_name
                        const groupedByPosition: Record<string, EmployeeMatch[]> = {};
                        filteredEmployees.forEach(emp => {
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

      {/* Tab Summary ASN */}
      <TabsContent value="summary-asn">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">
                  {canViewAll ? (
                    <>
                      Summary Peta Jabatan ASN - Semua Unit Kerja
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Gabungan dari semua unit kerja)
                      </span>
                    </>
                  ) : (
                    <>
                      Summary Peta Jabatan ASN - {profile?.department || selectedDepartment}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Data unit kerja Anda)
                      </span>
                    </>
                  )}
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={handleExportSummary} 
                  disabled={allPositions.length === 0}
                  className="text-xs sm:text-sm"
                >
                  <Download className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export Summary</span><span className="sm:hidden">Export</span>
                </Button>
              </div>

              {/* Summary Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={canViewAll ? "Cari unit kerja, jabatan, atau nama pegawai..." : "Cari jabatan atau nama pegawai..."}
                    value={summarySearchQuery}
                    onChange={(e) => setSummarySearchQuery(e.target.value)}
                    className="pl-10 pr-8"
                  />
                  {summarySearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-8"
                      onClick={() => setSummarySearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Category Filter */}
                <Select value={summaryFilterCategory} onValueChange={setSummaryFilterCategory}>
                  <SelectTrigger id="summary-category-filter" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="Struktural">Struktural</SelectItem>
                    <SelectItem value="Fungsional">Fungsional</SelectItem>
                    <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={summaryFilterStatus} onValueChange={setSummaryFilterStatus}>
                  <SelectTrigger id="summary-status-filter" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="kurang">Kurang Pegawai</SelectItem>
                    <SelectItem value="sesuai">Sesuai ABK</SelectItem>
                    <SelectItem value="lebih">Lebih Pegawai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {POSITION_CATEGORIES.map(category => {
                    const categoryPositions = allPositions.filter(p => p.position_category === category);
                    const totalAbk = categoryPositions.reduce((sum, p) => sum + p.abk_count, 0);
                    
                    // Count existing employees for this category
                    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
                    const positionNames = new Set(categoryPositions.map(p => normalize(p.position_name)));
                    const totalExisting = allEmployees.filter(emp => 
                      emp.position_name && positionNames.has(normalize(emp.position_name))
                    ).length;
                    
                    const gap = totalAbk - totalExisting;
                    const percentage = totalAbk > 0 ? ((totalExisting / totalAbk) * 100).toFixed(1) : '0';
                    
                    return (
                      <Card key={category} className="shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">{totalExisting}</span>
                            <span className="text-sm text-muted-foreground">/ {totalAbk} ABK</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all",
                                  gap > 0 ? "bg-orange-500" : gap < 0 ? "bg-blue-500" : "bg-green-500"
                                )}
                                style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {gap > 0 ? (
                                <span className="text-orange-600">Kurang {gap} pegawai</span>
                              ) : gap < 0 ? (
                                <span className="text-blue-600">Lebih {Math.abs(gap)} pegawai</span>
                              ) : (
                                <span className="text-green-600">Sesuai ABK</span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary Table by Department - Only show for Admin Pusat/Pimpinan */}
                {canViewAll && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Summary per Unit Kerja</h3>
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Unit Kerja</TableHead>
                            <TableHead className="text-center">Total Jabatan</TableHead>
                            <TableHead className="text-center">Total ABK</TableHead>
                            <TableHead className="text-center">Total Existing</TableHead>
                            <TableHead className="text-center">Gap</TableHead>
                            <TableHead className="text-center">% Terisi</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Group by department
                            const deptGroups = dynamicDepartments
                              .filter(d => d !== 'Pusat')
                              .map(dept => {
                                const deptPositions = allPositions.filter(p => {
                                  const matchCategory = summaryFilterCategory === 'all' || p.position_category === summaryFilterCategory;
                                  return p.department === dept && matchCategory;
                                });
                                const totalAbk = deptPositions.reduce((sum, p) => sum + p.abk_count, 0);
                                
                                const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
                                const positionNames = new Set(deptPositions.map(p => normalize(p.position_name)));
                                const totalExisting = allEmployees.filter(emp => 
                                  emp.department === dept && emp.position_name && positionNames.has(normalize(emp.position_name))
                                ).length;
                                
                                const gap = totalAbk - totalExisting;
                                const percentage = totalAbk > 0 ? ((totalExisting / totalAbk) * 100).toFixed(1) : '0';
                                
                                return {
                                  dept,
                                  totalJabatan: deptPositions.length,
                                  totalAbk,
                                  totalExisting,
                                  gap,
                                  percentage: parseFloat(percentage)
                                };
                              })
                              .filter(d => {
                                // Filter by search query
                                if (summarySearchQuery && !d.dept.toLowerCase().includes(summarySearchQuery.toLowerCase())) {
                                  return false;
                                }
                                
                                // Filter by status
                                if (summaryFilterStatus === 'kurang' && d.gap <= 0) return false;
                                if (summaryFilterStatus === 'sesuai' && d.gap !== 0) return false;
                                if (summaryFilterStatus === 'lebih' && d.gap >= 0) return false;
                                
                                // Only show departments with positions
                                return d.totalJabatan > 0;
                              });

                            if (deptGroups.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    {summarySearchQuery || summaryFilterCategory !== 'all' || summaryFilterStatus !== 'all'
                                      ? 'Tidak ada data yang sesuai dengan filter'
                                      : 'Belum ada data'}
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return deptGroups.map((item, idx) => (
                              <TableRow key={item.dept}>
                                <TableCell className="text-center">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{item.dept}</TableCell>
                                <TableCell className="text-center">{item.totalJabatan}</TableCell>
                                <TableCell className="text-center font-medium">{item.totalAbk}</TableCell>
                                <TableCell className="text-center font-medium">{item.totalExisting}</TableCell>
                                <TableCell className="text-center">
                                  <span className={cn(
                                    "font-medium",
                                    item.gap > 0 ? "text-orange-600" : item.gap < 0 ? "text-blue-600" : "text-green-600"
                                  )}>
                                    {item.gap > 0 ? `-${item.gap}` : item.gap < 0 ? `+${Math.abs(item.gap)}` : '0'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center font-medium">{item.percentage}%</TableCell>
                                <TableCell>
                                  {item.gap > 0 ? (
                                    <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                      Kurang {item.gap}
                                    </span>
                                  ) : item.gap < 0 ? (
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                      Lebih {Math.abs(item.gap)}
                                    </span>
                                  ) : (
                                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                      Sesuai
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Summary Table by Position */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Summary per Jabatan</h3>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Nama Jabatan</TableHead>
                          <TableHead className="text-center">Total ABK</TableHead>
                          <TableHead className="text-center">Total Existing</TableHead>
                          <TableHead className="text-center">Gap</TableHead>
                          <TableHead className="text-center">% Terisi</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
                          
                          // Group positions by normalized name across all departments
                          const positionGroups = new Map<string, {
                            category: string;
                            displayName: string;
                            totalAbk: number;
                            totalExisting: number;
                          }>();

                          allPositions.forEach(pos => {
                            // Apply category filter
                            if (summaryFilterCategory !== 'all' && pos.position_category !== summaryFilterCategory) {
                              return;
                            }

                            const normName = normalize(pos.position_name);
                            const existing = positionGroups.get(normName);
                            
                            if (existing) {
                              existing.totalAbk += pos.abk_count;
                            } else {
                              positionGroups.set(normName, {
                                category: pos.position_category,
                                displayName: pos.position_name,
                                totalAbk: pos.abk_count,
                                totalExisting: 0
                              });
                            }
                          });

                          // Count existing employees per position
                          allEmployees.forEach(emp => {
                            if (emp.position_name) {
                              const normName = normalize(emp.position_name);
                              const group = positionGroups.get(normName);
                              if (group) {
                                group.totalExisting++;
                              }
                            }
                          });

                          // Convert to array and apply filters
                          const sortedPositions = Array.from(positionGroups.values())
                            .map(item => ({
                              ...item,
                              gap: item.totalAbk - item.totalExisting,
                              percentage: item.totalAbk > 0 ? ((item.totalExisting / item.totalAbk) * 100).toFixed(1) : '0'
                            }))
                            .filter(item => {
                              // Apply search filter - search in position name AND employee names
                              if (summarySearchQuery) {
                                const query = summarySearchQuery.toLowerCase();
                                const positionMatch = item.displayName.toLowerCase().includes(query);
                                
                                // Check if any employee in this position matches the search
                                const employeeMatch = allEmployees.some(emp => {
                                  if (!emp.position_name) return false;
                                  if (normalize(emp.position_name) !== normalize(item.displayName)) return false;
                                  const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ').toLowerCase();
                                  return fullName.includes(query);
                                });
                                
                                if (!positionMatch && !employeeMatch) return false;
                              }

                              // Apply status filter
                              if (summaryFilterStatus === 'kurang' && item.gap <= 0) return false;
                              if (summaryFilterStatus === 'sesuai' && item.gap !== 0) return false;
                              if (summaryFilterStatus === 'lebih' && item.gap >= 0) return false;

                              return true;
                            })
                            .sort((a, b) => {
                              // Sort by category first
                              const catOrder = { 'Struktural': 1, 'Fungsional': 2, 'Pelaksana': 3 };
                              const catCompare = (catOrder[a.category as keyof typeof catOrder] || 99) - 
                                                (catOrder[b.category as keyof typeof catOrder] || 99);
                              if (catCompare !== 0) return catCompare;
                              // Then by name
                              return a.displayName.localeCompare(b.displayName);
                            });

                          if (sortedPositions.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  {summarySearchQuery || summaryFilterCategory !== 'all' || summaryFilterStatus !== 'all'
                                    ? 'Tidak ada data yang sesuai dengan filter'
                                    : 'Belum ada data'}
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return sortedPositions.flatMap((item, idx) => {
                            const isExpanded = expandedPositions.has(item.displayName);
                            
                            // Get employees for this position
                            const positionEmployees = allEmployees.filter(emp => {
                              if (!emp.position_name) return false;
                              return normalize(emp.position_name) === normalize(item.displayName);
                            });

                            const rows = [];
                            
                            // Main row
                            rows.push(
                              <TableRow 
                                key={`pos-${idx}`}
                                className={cn(
                                  "cursor-pointer hover:bg-muted/50 transition-colors",
                                  isExpanded && "bg-muted/30"
                                )}
                                onClick={() => togglePositionExpand(item.displayName)}
                              >
                                <TableCell className="text-center">
                                  {positionEmployees.length > 0 ? (
                                    isExpanded ? (
                                      <ChevronDown className="h-4 w-4 mx-auto" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 mx-auto" />
                                    )
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-center">{idx + 1}</TableCell>
                                <TableCell>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {item.category}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium">{item.displayName}</TableCell>
                                <TableCell className="text-center font-medium">{item.totalAbk}</TableCell>
                                <TableCell className="text-center font-medium">{item.totalExisting}</TableCell>
                                <TableCell className="text-center">
                                  <span className={cn(
                                    "font-medium",
                                    item.gap > 0 ? "text-orange-600" : item.gap < 0 ? "text-blue-600" : "text-green-600"
                                  )}>
                                    {item.gap > 0 ? `-${item.gap}` : item.gap < 0 ? `+${Math.abs(item.gap)}` : '0'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center font-medium">{item.percentage}%</TableCell>
                                <TableCell>
                                  {item.gap > 0 ? (
                                    <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                      Kurang {item.gap}
                                    </span>
                                  ) : item.gap < 0 ? (
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                      Lebih {Math.abs(item.gap)}
                                    </span>
                                  ) : (
                                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                      Sesuai
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );

                            // Expanded rows showing employees
                            if (isExpanded && positionEmployees.length > 0) {
                              rows.push(
                                <TableRow key={`pos-${idx}-expanded`} className="bg-muted/20">
                                  <TableCell colSpan={9} className="p-0">
                                    <div className="px-4 py-3">
                                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                                        Daftar Pemangku ({positionEmployees.length} orang):
                                      </div>
                                      <div className="space-y-2">
                                        {positionEmployees.map((emp, empIdx) => {
                                          const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
                                          return (
                                            <div 
                                              key={emp.id} 
                                              className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                            >
                                              <div className="flex-1">
                                                <div className="font-medium">{empIdx + 1}. {fullName}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                  {emp.department && <span>Unit: {emp.department}</span>}
                                                  {emp.asn_status && <span className="ml-3">Status: {emp.asn_status}</span>}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return rows;
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Summary Non-ASN */}
      <TabsContent value="summary-non-asn">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">
                  {canViewAll ? (
                    <>
                      Summary Pegawai Non-ASN - Semua Unit Kerja
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Gabungan dari semua unit kerja)
                      </span>
                    </>
                  ) : (
                    <>
                      Summary Pegawai Non-ASN - {profile?.department || selectedDepartment}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Data unit kerja Anda)
                      </span>
                    </>
                  )}
                </CardTitle>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={canViewAll ? "Cari unit kerja, jabatan, atau nama pegawai..." : "Cari jabatan atau nama pegawai..."}
                      value={summaryNonAsnSearchQuery}
                      onChange={(e) => setSummaryNonAsnSearchQuery(e.target.value)}
                      className="pl-10 pr-8"
                    />
                    {summaryNonAsnSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-8"
                        onClick={() => setSummaryNonAsnSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Export Button */}
                  <Button 
                    variant="outline" 
                    onClick={handleExportSummaryNonASN} 
                    disabled={allNonAsnEmployees.length === 0}
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Download className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Summary</span><span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards for Non-ASN */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Total Non-ASN Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Pegawai Non-ASN
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allNonAsnEmployees.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {canViewAll ? 'Dari semua unit kerja' : 'Di unit kerja Anda'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tenaga Alih Daya Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Tenaga Alih Daya
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {allNonAsnEmployees.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((allNonAsnEmployees.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length / (allNonAsnEmployees.length || 1)) * 100).toFixed(1)}% dari total
                      </p>
                    </CardContent>
                  </Card>

                  {/* Other Non-ASN Types Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Lainnya
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {allNonAsnEmployees.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((allNonAsnEmployees.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length / (allNonAsnEmployees.length || 1)) * 100).toFixed(1)}% dari total
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Table: Summary Non-ASN per Unit (only for Admin Pusat/Pimpinan) */}
                {canViewAll && allNonAsnEmployees.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Summary per Unit Kerja</h3>
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Unit Kerja</TableHead>
                            <TableHead className="text-center">Total Non-ASN</TableHead>
                            <TableHead className="text-center">Tenaga Alih Daya</TableHead>
                            <TableHead className="text-center">Lainnya</TableHead>
                            <TableHead className="text-center">Jumlah Jabatan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Group Non-ASN by department
                            const deptNonAsnGroups = dynamicDepartments
                              .filter(d => d !== 'Pusat')
                              .map(dept => {
                                const deptNonAsn = allNonAsnEmployees.filter(e => e.department === dept);
                                const tenagaAlihDaya = deptNonAsn.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length;
                                const lainnya = deptNonAsn.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length;
                                const uniquePositions = new Set(deptNonAsn.map(e => e.position_name || 'Tidak Ada Jabatan'));
                                
                                return {
                                  dept,
                                  total: deptNonAsn.length,
                                  tenagaAlihDaya,
                                  lainnya,
                                  jumlahJabatan: uniquePositions.size
                                };
                              })
                              .filter(d => d.total > 0) // Only show departments with Non-ASN employees
                              .filter(d => {
                                // Apply search filter
                                if (!summaryNonAsnSearchQuery.trim()) return true;
                                const query = summaryNonAsnSearchQuery.toLowerCase();
                                return d.dept.toLowerCase().includes(query);
                              });

                            if (deptNonAsnGroups.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {summaryNonAsnSearchQuery.trim() 
                                      ? `Tidak ada unit kerja yang cocok dengan "${summaryNonAsnSearchQuery}"`
                                      : 'Belum ada data pegawai Non-ASN'
                                    }
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return deptNonAsnGroups.map((item, idx) => (
                              <TableRow key={item.dept}>
                                <TableCell className="text-center">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{item.dept}</TableCell>
                                <TableCell className="text-center font-medium">{item.total}</TableCell>
                                <TableCell className="text-center">{item.tenagaAlihDaya}</TableCell>
                                <TableCell className="text-center">{item.lainnya}</TableCell>
                                <TableCell className="text-center">{item.jumlahJabatan}</TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Table: Summary Non-ASN per Jabatan */}
                {allNonAsnEmployees.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Summary per Jabatan</h3>
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Jabatan</TableHead>
                            <TableHead className="text-center">Total Pegawai</TableHead>
                            <TableHead className="text-center">Tenaga Alih Daya</TableHead>
                            <TableHead className="text-center">Lainnya</TableHead>
                            {canViewAll && <TableHead className="text-center">Jumlah Unit</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Group Non-ASN by position
                            const positionGroups = new Map<string, {
                              displayName: string;
                              total: number;
                              tenagaAlihDaya: number;
                              lainnya: number;
                              departments: Set<string>;
                              employees: EmployeeMatch[];
                            }>();

                            const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

                            allNonAsnEmployees.forEach(emp => {
                              const posName = emp.position_name || 'Tidak Ada Jabatan';
                              const normName = normalize(posName);
                              const existing = positionGroups.get(normName);
                              
                              const isTenagaAlihDaya = emp.rank_group === 'Tenaga Alih Daya' || !emp.rank_group;
                              
                              if (existing) {
                                existing.total++;
                                existing.employees.push(emp);
                                if (isTenagaAlihDaya) {
                                  existing.tenagaAlihDaya++;
                                } else {
                                  existing.lainnya++;
                                }
                                if (emp.department) {
                                  existing.departments.add(emp.department);
                                }
                              } else {
                                positionGroups.set(normName, {
                                  displayName: posName,
                                  total: 1,
                                  tenagaAlihDaya: isTenagaAlihDaya ? 1 : 0,
                                  lainnya: isTenagaAlihDaya ? 0 : 1,
                                  departments: emp.department ? new Set([emp.department]) : new Set(),
                                  employees: [emp]
                                });
                              }
                            });

                            const sortedPositions = Array.from(positionGroups.entries())
                              .sort((a, b) => b[1].total - a[1].total) // Sort by total descending
                              .filter(([normName, pos]) => {
                                // Apply search filter
                                if (!summaryNonAsnSearchQuery.trim()) return true;
                                const query = summaryNonAsnSearchQuery.toLowerCase();
                                
                                // Search in position name
                                if (pos.displayName.toLowerCase().includes(query)) return true;
                                
                                // Search in employee names
                                return pos.employees.some(emp => {
                                  const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ').toLowerCase();
                                  return fullName.includes(query);
                                });
                              });

                            if (sortedPositions.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={canViewAll ? 7 : 6} className="text-center py-8 text-muted-foreground">
                                    {summaryNonAsnSearchQuery.trim() 
                                      ? `Tidak ada jabatan atau pegawai yang cocok dengan "${summaryNonAsnSearchQuery}"`
                                      : 'Belum ada data pegawai Non-ASN'
                                    }
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            const rows: JSX.Element[] = [];
                            sortedPositions.forEach(([normName, pos], idx) => {
                              const isExpanded = expandedPositions.has(normName);
                              const positionEmployees = pos.employees;

                              // Main row
                              rows.push(
                                <TableRow key={normName} className="hover:bg-muted/50">
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => togglePositionExpand(normName)}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-center">{idx + 1}</TableCell>
                                  <TableCell className="font-medium">{pos.displayName}</TableCell>
                                  <TableCell className="text-center font-medium">{pos.total}</TableCell>
                                  <TableCell className="text-center">{pos.tenagaAlihDaya}</TableCell>
                                  <TableCell className="text-center">{pos.lainnya}</TableCell>
                                  {canViewAll && <TableCell className="text-center">{pos.departments.size}</TableCell>}
                                </TableRow>
                              );

                              // Expanded rows showing employees
                              if (isExpanded && positionEmployees.length > 0) {
                                rows.push(
                                  <TableRow key={`${normName}-expanded`} className="bg-muted/20">
                                    <TableCell colSpan={canViewAll ? 7 : 6} className="p-0">
                                      <div className="px-4 py-3">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                                          Daftar Pemangku ({positionEmployees.length} orang):
                                        </div>
                                        <div className="space-y-2">
                                          {positionEmployees.map((emp, empIdx) => {
                                            const fullName = [emp.front_title, emp.name, emp.back_title].filter(Boolean).join(' ');
                                            return (
                                              <div 
                                                key={emp.id} 
                                                className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                              >
                                                <div className="flex-1">
                                                  <div className="font-medium">{empIdx + 1}. {fullName}</div>
                                                  <div className="text-xs text-muted-foreground mt-0.5">
                                                    {emp.department && <span>Unit: {emp.department}</span>}
                                                    {emp.rank_group && <span className="ml-3">Type: {emp.rank_group}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            });

                            return rows;
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {allNonAsnEmployees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    Belum ada data pegawai Non-ASN
                  </div>
                )}
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
              <Label htmlFor="form-category">Kategori Jabatan</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="form-category"><SelectValue /></SelectTrigger>
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
