import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, Download, Pencil, Trash2, Save, X, ChevronDown, ChevronRight, Search, RefreshCw, MoreVertical, Info, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import {
  applyWorksheetStyling,
  applyCategoryHeaders,
  setColumnWidths,
} from '@/lib/excelStyles';
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
import { DEPARTMENTS, POSITION_TYPES, getSatpelsByPembina, getEffectiveDepartment, isPositionReadOnly, isSatpelOrWorkshop } from '@/lib/constants';
import { SatpelBadge } from '@/components/employees/SatpelBadge';
import { useDepartments } from '@/hooks/useDepartments';
import { cn, normalizeString } from '@/lib/utils';
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
  additional_position?: string | null;
  department?: string | null;
  satuan_kerja_penugasan?: string | null;
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
const POSITION_REFERENCE_COLUMNS = 'id, department, position_category, position_name, grade, abk_count, position_order';
const SUMMARY_CACHE_TTL_MS = 60_000;

export default function PetaJabatan() {
  const { profile, isAdminPusat, canEdit, canViewAll, role } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();

  // Supervised units support (unit pembina → satpel/workshop)
  const hasSupervisedUnits = useMemo(() => {
    if (!profile || role !== 'admin_unit') return false;
    return getSatpelsByPembina(profile.department).length > 0;
  }, [profile, role]);

  // Departments accessible by this user (own unit + supervised units)
  const accessibleDepartments = useMemo(() => {
    if (canViewAll) return dynamicDepartments.filter(d => d !== 'Pusat');
    if (role === 'admin_unit' && hasSupervisedUnits && profile?.department) {
      return [profile.department, ...getSatpelsByPembina(profile.department)];
    }
    return [];
  }, [canViewAll, role, hasSupervisedUnits, profile?.department, dynamicDepartments]);

  // Show department selector for admin_pusat/pimpinan AND admin_unit pembina
  const showDepartmentFilter = canViewAll || (role === 'admin_unit' && hasSupervisedUnits);

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

  // Satpel resolution state
  const [activeSatpelFilter, setActiveSatpelFilter] = useState<string | null>(null);
  const [effectiveDepartment, setEffectiveDepartment] = useState<string>('');

  // Computed: read-only mode when a Satpel/Workshop is selected
  const isReadOnlyMode = useMemo(() => isPositionReadOnly(selectedDepartment), [selectedDepartment]);

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
  const [summaryFilterUnit, setSummaryFilterUnit] = useState<string>('all');
  
  // Summary Non-ASN filters
  const [summaryNonAsnSearchQuery, setSummaryNonAsnSearchQuery] = useState('');
  const [summaryNonAsnFilterUnit, setSummaryNonAsnFilterUnit] = useState<string>('all');
  
  // Expandable rows state for summary per jabatan
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  // Form state
  const [formCategory, setFormCategory] = useState<string>('Struktural');
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAbk, setFormAbk] = useState('0');
  const [formOrder, setFormOrder] = useState('0');
  const isFetchingDataRef = useRef(false);
  const pendingFetchDataRef = useRef(false);
  const isFetchingSummaryRef = useRef(false);
  const pendingFetchSummaryRef = useRef(false);
  const lastSummaryFetchAtRef = useRef(0);
  const lastSummaryScopeRef = useRef('');

  // Delete Non-ASN confirmation state
  const [deleteNonAsnTarget, setDeleteNonAsnTarget] = useState<EmployeeMatch | null>(null);
  const [isDeleteNonAsnOpen, setIsDeleteNonAsnOpen] = useState(false);

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

  // Resolve effective department and satpel filter whenever selectedDepartment changes
  useEffect(() => {
    const effective = getEffectiveDepartment(selectedDepartment);
    if (effective === null) {
      // Satpel not found in mapping
      setEffectiveDepartment('');
      setActiveSatpelFilter(null);
      return;
    }
    setEffectiveDepartment(effective);
    if (isSatpelOrWorkshop(selectedDepartment)) {
      setActiveSatpelFilter(selectedDepartment);
    } else {
      setActiveSatpelFilter(null);
    }
  }, [selectedDepartment]);

  // Fetch summary data when summary tab is active
  useEffect(() => {
    if (activeTab === 'summary-asn' || activeTab === 'summary-non-asn') {
      fetchSummaryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Real-time subscription for employee changes
  const fetchData = useCallback(async () => {
    if (isFetchingDataRef.current) {
      pendingFetchDataRef.current = true;
      return;
    }
    isFetchingDataRef.current = true;
    setIsLoading(true);
    try {
      logger.debug('Fetching data for department:', selectedDepartment, '(effective:', effectiveDepartment, ')');
      
      // Helper to fetch all records without 1000-row limit
      // Uses a factory function to create fresh query per batch (Supabase builder is mutable)
      // WARNING: This can be slow for very large datasets (10,000+ records)
      const fetchAllUnlimited = async <T,>(buildQuery: () => { range: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }> }) => {
        const allData: T[] = [];
        let offset = 0;
        const batchSize = 1000;
        const maxRecords = 50000; // Safety limit to prevent memory issues
        
        while (true) {
          const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData.push(...data);
          
          // Safety check for very large datasets
          if (allData.length >= maxRecords) {
            logger.warn(`Reached maximum record limit (${maxRecords}). Some data may not be loaded.`);
            break;
          }
          
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return { data: allData, error: null };
      };

      const [posRes, empRes, nonAsnRes] = await Promise.all([
        fetchAllUnlimited(() =>
          supabase
            .from('position_references')
            .select(POSITION_REFERENCE_COLUMNS)
            .eq('department', effectiveDepartment)
            .order('position_category')
            .order('position_order')
            .order('position_name')
        ),
        // Fetch ASN employees from unit pembina only
        fetchAllUnlimited(() =>
          supabase
            .from('employees')
            .select('id, name, front_title, back_title, nip, asn_status, rank_group, gender, position_name, additional_position, department, satuan_kerja_penugasan, keterangan_formasi, keterangan_penempatan, keterangan_penugasan, keterangan_perubahan')
            .eq('is_active', true)
            .eq('department', effectiveDepartment)
            .or('asn_status.is.null,asn_status.neq.Non ASN')
        ),
        // Fetch Non-ASN employees from unit pembina only
        fetchAllUnlimited(() =>
          supabase
            .from('employees')
            .select('id, name, front_title, back_title, nip, position_name, gender, rank_group, department, satuan_kerja_penugasan, keterangan_penugasan')
            .eq('is_active', true)
            .eq('department', effectiveDepartment)
            .eq('asn_status', 'Non ASN')
        ),
      ]);

      // Apply client-side filter for Satpel: only show employees assigned to that Satpel
      // Normalize both names for comparison (handle "Satpel" vs "Satuan Pelayanan" variants)
      const rawEmployees = (empRes.data || []) as EmployeeMatch[];
      
      const normalizeForComparison = (name: string) => {
        return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
      };
      
      const filteredEmployees = activeSatpelFilter
        ? rawEmployees.filter(emp => {
            if (!emp.satuan_kerja_penugasan) return false;
            const normalizedFilter = normalizeForComparison(activeSatpelFilter);
            const normalizedPenugasan = normalizeForComparison(emp.satuan_kerja_penugasan);
            return normalizedPenugasan === normalizedFilter;
          })
        : rawEmployees;
      
      setEmployees(filteredEmployees);

      // Filter positions: for Satpel, only show positions that have employees assigned
      // This ensures Peta Jabatan only shows actual positions filled in the Satpel
      const rawPositions = posRes.data || [];
      const filteredPositions = activeSatpelFilter
        ? rawPositions.filter(pos => {
            // Check if any employee in this Satpel has this position
            return filteredEmployees.some(emp => 
              normalizeString(emp.position_name || '') === normalizeString(pos.position_name)
            );
          })
        : rawPositions;
      
      setPositions(filteredPositions);

      // Apply same filter for Non-ASN employees (same logic as ASN)
      const rawNonAsnEmployees = (nonAsnRes.data || []) as EmployeeMatch[];
      const filteredNonAsnEmployees = activeSatpelFilter
        ? rawNonAsnEmployees.filter(emp => {
            if (!emp.satuan_kerja_penugasan) return false;
            const normalizedFilter = normalizeForComparison(activeSatpelFilter);
            const normalizedPenugasan = normalizeForComparison(emp.satuan_kerja_penugasan);
            return normalizedPenugasan === normalizedFilter;
          })
        : rawNonAsnEmployees;

      setNonAsnEmployees(filteredNonAsnEmployees);
      
      logger.debug('Positions loaded (before Satpel filter):', posRes.data?.length || 0);
      logger.debug('Positions loaded (after Satpel filter):', filteredPositions.length);
      logger.debug('Employees loaded (before Satpel filter):', empRes.data?.length || 0);
      logger.debug('Employees loaded (after Satpel filter):', filteredEmployees.length);
      logger.debug('Active Satpel filter:', activeSatpelFilter);
      logger.debug('Non-ASN loaded (before filter):', nonAsnRes.data?.length || 0);
      logger.debug('Non-ASN loaded (after filter):', filteredNonAsnEmployees.length);

      // Fetch pendidikan terakhir per pegawai menggunakan RPC dengan pagination
      if (empRes.data && empRes.data.length > 0) {
        const empIds = new Set(empRes.data.map(e => e.id));
        
        // Fetch dengan pagination untuk menghindari limit 1000
        const allEduData: Array<{ employee_id: string; level: string; major: string | null }> = [];
        let eduOffset = 0;
        const eduBatchSize = 1000;
        
        while (true) {
          const { data: eduBatch, error: eduError } = await supabase
            .rpc('get_latest_education_per_employee')
            .range(eduOffset, eduOffset + eduBatchSize - 1);
          
          if (eduError) {
            logger.error('Error fetching education data:', eduError);
            break;
          }
          
          if (!eduBatch || eduBatch.length === 0) break;
          allEduData.push(...eduBatch);
          
          if (eduBatch.length < eduBatchSize) break;
          eduOffset += eduBatchSize;
        }
        
        const latestEdu: Record<string, string> = {};
        allEduData.forEach((e: { employee_id: string; level: string; major: string | null }) => {
          // Filter hanya untuk pegawai di unit ini
          if (empIds.has(e.employee_id)) {
            if (!latestEdu[e.employee_id]) {
              // Format: "Level Major" atau hanya "Level" jika major kosong
              const eduText = e.major ? `${e.level} ${e.major}` : e.level;
              latestEdu[e.employee_id] = eduText;
            }
          }
        });
        setEducationData(Object.entries(latestEdu).map(([employee_id, level]) => ({ employee_id, level })));
      } else {
        setEducationData([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      logger.error('Error fetching data:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      isFetchingDataRef.current = false;
      setIsLoading(false);
      if (pendingFetchDataRef.current) {
        pendingFetchDataRef.current = false;
        fetchData();
      }
    }
  }, [effectiveDepartment, activeSatpelFilter, toast]);

  // Fetch data when effectiveDepartment changes + real-time subscription
  useEffect(() => {
    if (!effectiveDepartment) return;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // Initial fetch
    fetchData();

    logger.debug('Setting up real-time subscription for employees in:', effectiveDepartment);
    
    interface EmployeePayload {
      eventType: string;
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }
    
    const handleEmployeeChange = (payload: EmployeePayload) => {
      logger.debug('Employee change detected:', payload);
      
      // For INSERT and UPDATE: check new record
      // For DELETE: check old record
      // For UPDATE (pindah unit): check both old and new department
      const newRecord = payload.new;
      const oldRecord = payload.old;
      
      let shouldRefresh = false;
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Check if new department matches current effective department
        if (newRecord && newRecord.department === effectiveDepartment) {
          shouldRefresh = true;
          logger.debug('New/Updated record is for current department');
        }
      }
      
      if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
        // Check if old department matches current effective department
        if (oldRecord && oldRecord.department === effectiveDepartment) {
          shouldRefresh = true;
          logger.debug('Deleted/Old record was from current department');
        }
      }
      
      if (shouldRefresh) {
        logger.debug('Queue refresh Peta Jabatan data...');
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          fetchData();
        }, 1000);
      }
    };
    
    const channel = supabase
      .channel(`employees-${effectiveDepartment}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        handleEmployeeChange
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      logger.debug('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [effectiveDepartment, fetchData]);


  const getEmployeeEducation = (employeeId: string) => {
    return educationData.find(e => e.employee_id === employeeId)?.level || '-';
  };

  const fetchSummaryData = async (force = false) => {
    if (isFetchingSummaryRef.current) {
      pendingFetchSummaryRef.current = true;
      return;
    }
    isFetchingSummaryRef.current = true;
    setIsSummaryLoading(true);
    try {
      logger.debug('Fetching summary data', { canViewAll, department: profile?.department });
      
      // Helper to fetch all records without 1000-row limit
      const fetchAllUnlimited = async <T,>(buildQuery: () => { range: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }> }) => {
        const allData: T[] = [];
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

      // For Admin Unit, only fetch their department data (+ supervised units if pembina)
      // For Admin Pusat/Pimpinan, fetch all departments
      const summaryDepts = !canViewAll && profile?.department
        ? (hasSupervisedUnits
            ? [profile.department, ...getSatpelsByPembina(profile.department)]
            : [profile.department])
        : null; // null = no filter (fetch all)

      const summaryScope = summaryDepts ? summaryDepts.join('|') : '__all__';
      const isCacheFresh = !force
        && lastSummaryScopeRef.current === summaryScope
        && (Date.now() - lastSummaryFetchAtRef.current) < SUMMARY_CACHE_TTL_MS;
      if (isCacheFresh) {
        return;
      }

      const [allPosRes, allEmpRes, allNonAsnRes] = await Promise.all([
        fetchAllUnlimited(() => {
          let query = supabase
            .from('position_references')
            .select(POSITION_REFERENCE_COLUMNS);
          
          if (summaryDepts) {
            query = summaryDepts.length === 1
              ? query.eq('department', summaryDepts[0])
              : query.in('department', summaryDepts);
          }
          
          return query
            .order('department')
            .order('position_category')
            .order('position_order')
            .order('position_name');
        }),
        fetchAllUnlimited(() => {
          let query = supabase
            .from('employees')
            .select('id, name, department, position_name, asn_status')
            .eq('is_active', true)  // Hanya pegawai aktif
            .or('asn_status.is.null,asn_status.neq.Non ASN');
          
          if (summaryDepts) {
            query = summaryDepts.length === 1
              ? query.eq('department', summaryDepts[0])
              : query.in('department', summaryDepts);
          }
          
          return query;
        }),
        fetchAllUnlimited(() => {
          let query = supabase
            .from('employees')
            .select('id, name, department, position_name, rank_group')
            .eq('is_active', true)  // Hanya pegawai aktif
            .eq('asn_status', 'Non ASN');
          
          if (summaryDepts) {
            query = summaryDepts.length === 1
              ? query.eq('department', summaryDepts[0])
              : query.in('department', summaryDepts);
          }
          
          return query;
        }),
      ]);

      setAllPositions(allPosRes.data || []);
      setAllEmployees((allEmpRes.data || []) as EmployeeMatch[]);
      setAllNonAsnEmployees((allNonAsnRes.data || []) as EmployeeMatch[]);
      lastSummaryScopeRef.current = summaryScope;
      lastSummaryFetchAtRef.current = Date.now();
      
      logger.debug('Summary data loaded:', {
        positions: allPosRes.data?.length || 0,
        employees: allEmpRes.data?.length || 0,
        nonAsnEmployees: allNonAsnRes.data?.length || 0,
        canViewAll,
        department: profile?.department
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat summary';
      logger.error('Error fetching summary data:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      isFetchingSummaryRef.current = false;
      setIsSummaryLoading(false);
      if (pendingFetchSummaryRef.current) {
        pendingFetchSummaryRef.current = false;
        fetchSummaryData(true);
      }
    }
  };

  const invalidateSummaryCache = useCallback(() => {
    lastSummaryFetchAtRef.current = 0;
    lastSummaryScopeRef.current = '';
  }, []);



  // Group positions by category with search filter
  const groupedPositions = useMemo(() => {
    const groups: Record<string, PositionReference[]> = {
      Struktural: [],
      Fungsional: [],
      Pelaksana: [],
    };

    // Pre-group employees by their normalized position name for O(1) lookup
    const employeesByPosition = new Map<string, EmployeeMatch[]>();
    employees.forEach(emp => {
      if (emp.position_name) {
        const norm = normalizeString(emp.position_name);
        const list = employeesByPosition.get(norm) || [];
        list.push(emp);
        employeesByPosition.set(norm, list);
      }
    });

    const getMatchingEmployees = (positionName: string) => {
      const norm = normalizeString(positionName);
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
    // Auto-assign urutan berikutnya dalam kategori Struktural
    const nextOrder = positions
      .filter(p => p.position_category === 'Struktural')
      .reduce((max, p) => Math.max(max, p.position_order), 0) + 1;
    setFormOrder(nextOrder.toString());
    setShowModal(true);
  };

  const openEditModal = (pos: PositionReference) => {
    setEditingPosition(pos);
    setFormCategory(pos.position_category);
    setFormName(pos.position_name);
    setFormGrade(pos.grade?.toString() || '');
    setFormAbk(pos.abk_count.toString());
    // Gunakan urutan aktual dari posisi jabatan dalam daftar yang ditampilkan
    // Jika position_order masih 0, hitung dari posisi dalam array yang sudah terurut
    let order = pos.position_order;
    if (order === 0) {
      const sameCategoryPositions = positions
        .filter(p => p.position_category === pos.position_category)
        .sort((a, b) => a.position_order - b.position_order || a.position_name.localeCompare(b.position_name));
      const idx = sameCategoryPositions.findIndex(p => p.id === pos.id);
      order = idx >= 0 ? idx + 1 : 1;
    }
    setFormOrder(order.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama jabatan wajib diisi' });
      return;
    }

    // Validasi duplikat nama jabatan dalam kategori dan unit yang sama
    const isDuplicate = positions.some(p =>
      p.position_category === formCategory &&
      p.position_name.trim().toLowerCase() === formName.trim().toLowerCase() &&
      p.id !== editingPosition?.id
    );
    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: 'Jabatan sudah ada',
        description: `Jabatan "${formName.trim()}" sudah terdaftar di kategori ${formCategory} untuk unit ini.`,
      });
      return;
    }

    const newOrder = parseInt(formOrder) || 1;

    // Validasi: urutan tidak boleh lintas kategori
    // Hitung batas maksimal urutan dalam kategori yang dipilih
    // (kecuali jabatan yang sedang diedit itu sendiri)
    const sameCategoryPositions = positions
      .filter(p => p.position_category === formCategory && p.id !== editingPosition?.id)
      .sort((a, b) => a.position_order - b.position_order);

    const maxOrder = sameCategoryPositions.length + 1; // +1 karena jabatan ini sendiri ikut dihitung
    const clampedOrder = Math.max(1, Math.min(newOrder, maxOrder));

    if (clampedOrder !== newOrder) {
      toast({
        variant: 'destructive',
        title: 'Urutan tidak valid',
        description: `Urutan untuk kategori ${formCategory} harus antara 1 sampai ${maxOrder}.`,
      });
      setFormOrder(clampedOrder.toString());
      return;
    }

    const data = {
      department: selectedDepartment,
      position_category: formCategory,
      position_name: formName.trim(),
      grade: formGrade ? parseInt(formGrade) : null,
      abk_count: parseInt(formAbk) || 0,
      position_order: clampedOrder,
    };

    try {
      if (editingPosition) {
        const oldOrder = editingPosition.position_order;
        const oldCategory = editingPosition.position_category;
        const categoryChanged = oldCategory !== formCategory;

        // Kumpulkan semua update yang perlu dilakukan (reorder)
        const updates: { id: string; position_order: number }[] = [];

        if (categoryChanged) {
          // Kategori berubah: 
          // 1. Geser jabatan di kategori LAMA (tutup gap yang ditinggalkan)
          const oldCatPositions = positions
            .filter(p => p.position_category === oldCategory && p.id !== editingPosition.id)
            .sort((a, b) => a.position_order - b.position_order);

          oldCatPositions.forEach((pos, idx) => {
            const expectedOrder = idx + 1;
            if (pos.position_order !== expectedOrder) {
              updates.push({ id: pos.id, position_order: expectedOrder });
            }
          });

          // 2. Geser jabatan di kategori BARU (buka slot untuk jabatan yang masuk)
          const newCatPositions = positions
            .filter(p => p.position_category === formCategory)
            .sort((a, b) => a.position_order - b.position_order);

          newCatPositions.forEach(pos => {
            if (pos.position_order >= clampedOrder) {
              updates.push({ id: pos.id, position_order: pos.position_order + 1 });
            }
          });
        } else {
          // Kategori sama, hanya urutan berubah
          if (oldOrder !== clampedOrder) {
            const otherPositions = positions
              .filter(p => p.position_category === formCategory && p.id !== editingPosition.id)
              .sort((a, b) => a.position_order - b.position_order);

            if (clampedOrder > oldOrder) {
              // Geser turun: jabatan di antara oldOrder+1 s/d clampedOrder naik satu
              otherPositions.forEach(pos => {
                if (pos.position_order > oldOrder && pos.position_order <= clampedOrder) {
                  updates.push({ id: pos.id, position_order: pos.position_order - 1 });
                }
              });
            } else {
              // Geser naik: jabatan di antara clampedOrder s/d oldOrder-1 turun satu
              otherPositions.forEach(pos => {
                if (pos.position_order >= clampedOrder && pos.position_order < oldOrder) {
                  updates.push({ id: pos.id, position_order: pos.position_order + 1 });
                }
              });
            }
          }
        }

        // Jalankan semua update geser terlebih dahulu
        for (const u of updates) {
          const { error } = await supabase
            .from('position_references')
            .update({ position_order: u.position_order })
            .eq('id', u.id);
          if (error) throw error;
        }

        // Update jabatan yang diedit
        const { error } = await supabase
          .from('position_references')
          .update(data)
          .eq('id', editingPosition.id);
        if (error) throw error;

        const desc = categoryChanged
          ? `Jabatan dipindah ke kategori ${formCategory} urutan ${clampedOrder}`
          : oldOrder !== clampedOrder
            ? `Urutan diubah dari ${oldOrder} ke ${clampedOrder}, ${updates.length} jabatan lain digeser`
            : 'Jabatan berhasil diperbarui';

        toast({ title: 'Berhasil', description: desc });
      } else {
        // Tambah baru: geser jabatan yang ada di posisi >= clampedOrder ke bawah
        const toShift = positions
          .filter(p => p.position_category === formCategory && p.position_order >= clampedOrder)
          .sort((a, b) => b.position_order - a.position_order); // update dari bawah ke atas agar tidak konflik

        for (const pos of toShift) {
          const { error } = await supabase
            .from('position_references')
            .update({ position_order: pos.position_order + 1 })
            .eq('id', pos.id);
          if (error) throw error;
        }

        const { error } = await supabase
          .from('position_references')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Berhasil', description: `Jabatan ditambahkan di urutan ${clampedOrder}` });
      }

      setShowModal(false);
      invalidateSummaryCache();
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan jabatan';
      logger.error('Error saving position:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('position_references').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Jabatan berhasil dihapus' });
      invalidateSummaryCache();
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus jabatan';
      logger.error('Error deleting position:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  // Perbaiki position_order semua jabatan di unit yang sedang aktif
  // berdasarkan urutan tampil saat ini (category → posisi dalam kategori)
  const handleFixPositionOrder = async () => {
    if (!positions.length) return;

    try {
      // Kelompokkan per kategori, urutkan seperti yang ditampilkan sekarang
      const updates: { id: string; position_order: number }[] = [];
      POSITION_CATEGORIES.forEach(category => {
        const catPositions = positions
          .filter(p => p.position_category === category)
          .sort((a, b) => a.position_order - b.position_order || a.position_name.localeCompare(b.position_name));

        catPositions.forEach((pos, idx) => {
          updates.push({ id: pos.id, position_order: idx + 1 });
        });
      });

      // Update satu per satu (Supabase tidak support bulk update via JS client)
      for (const { id, position_order } of updates) {
        const { error } = await supabase
          .from('position_references')
          .update({ position_order })
          .eq('id', id);
        if (error) throw error;
      }

      toast({ title: 'Berhasil', description: `Urutan ${updates.length} jabatan berhasil diperbaiki` });
      invalidateSummaryCache();
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbaiki urutan';
      logger.error('Error fixing position order:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
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
    setDeleteNonAsnTarget(employee);
    setIsDeleteNonAsnOpen(true);
  };

  const confirmDeleteNonAsnEmployee = async () => {
    if (!deleteNonAsnTarget) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', deleteNonAsnTarget.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pegawai Non-ASN berhasil dihapus' });
      invalidateSummaryCache();
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus pegawai';
      logger.error('Error deleting non-ASN employee:', err);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsDeleteNonAsnOpen(false);
      setDeleteNonAsnTarget(null);
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
    const categoryRows: number[] = []; // Track category header rows (0-indexed after header)
    const mergeRanges: Array<{ startRow: number; endRow: number; columns: number[] }> = []; // Track merge ranges for positions with multiple employees
    let currentRowIndex = 0; // Track current row index in data array (0-indexed)

    POSITION_CATEGORIES.forEach(category => {
      // Track this row as a category header (row index = current rows.length)
      categoryRows.push(rows.length);
      
      rows.push({
        'No': category.toUpperCase(), // Put category name in first column for merge
        'Jabatan Sesuai Kepmen 202 Tahun 2024': '',
        'Grade/Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '',
        'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '',
        'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '',
        'Keterangan Formasi': '', 'Keterangan Penempatan': '',
        'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '',
      });
      currentRowIndex++;

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
          currentRowIndex++;
        } else {
          const startRow = currentRowIndex;
          
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
            currentRowIndex++;
          });
          
          // If there are multiple employees for this position, add merge range
          if (matched.length > 1) {
            mergeRanges.push({
              startRow: startRow,
              endRow: currentRowIndex - 1,
              columns: [0, 1, 2, 3, 4, 11] // No, Jabatan, Grade, ABK, Existing, Keterangan Formasi
            });
          }
        }
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Set column widths
    setColumnWidths(ws, [
      5,  // No
      40, // Jabatan Sesuai Kepmen 202 Tahun 2024
      15, // Grade/Kelas Jabatan
      12, // Jumlah ABK
      14, // Jumlah Existing
      30, // Nama Pemangku
      12, // Kriteria ASN
      20, // NIP
      25, // Pangkat Golongan
      18, // Pendidikan Terakhir
      14, // Jenis Kelamin
      18, // Keterangan Formasi
      20, // Keterangan Penempatan
      25, // Keterangan Penugasan Tambahan
      20, // Keterangan Perubahan
    ]);
    
    // Apply styling: header row (0) + category rows + data rows
    // Category rows are at indices: categoryRows array (but in worksheet, they're +1 because of header)
    const worksheetCategoryRows = categoryRows.map(r => r + 1); // +1 because header is row 0
    applyWorksheetStyling(ws, {
      headerRow: 0,
      categoryRows: worksheetCategoryRows,
    });
    
    // Apply category header merging (merge across all 15 columns)
    applyCategoryHeaders(ws, worksheetCategoryRows, 15);
    
    // Apply vertical merges for positions with multiple employees
    if (!ws['!merges']) ws['!merges'] = [];
    mergeRanges.forEach(range => {
      range.columns.forEach(colIdx => {
        ws['!merges']!.push({
          s: { r: range.startRow + 1, c: colIdx }, // +1 because of header row
          e: { r: range.endRow + 1, c: colIdx },   // +1 because of header row
        });
      });
    });
    
    XLSX.utils.book_append_sheet(wb, ws, 'Peta Jabatan ASN');
    
    // ═══════════════════════════════════════════════════════════════════════
    // TAMBAHAN: 3 Tabel Agregasi (Golongan, Pendidikan, Jenis Kelamin)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Helper functions untuk agregasi
    const normalizeAsnStatus = (status: unknown): string => {
      if (!status) return 'Tidak Ada';
      const s = String(status).trim().toUpperCase();
      if (s === 'CPNS' || s.includes('CPNS')) return 'CPNS';
      if (s === 'PNS' || s.includes('PNS')) return 'PNS';
      if (s === 'PPPK' || s.includes('PPPK')) return 'PPPK';
      if (s === 'NON ASN' || s.includes('NON') || s.includes('ALIH DAYA')) return 'Non ASN';
      return s || 'Tidak Ada';
    };

    const normalizeGender = (gender: unknown): string => {
      if (!gender) return 'Tidak Ada';
      const g = String(gender).toLowerCase().replace(/[-_\/\s]+/g, '');
      if (g.includes('laki') || g === 'l' || g === 'm' || g === 'male') return 'Laki-laki';
      if (g.includes('perempuan') || g === 'p' || g === 'f' || g === 'female' || g.includes('wanita')) return 'Perempuan';
      return 'Tidak Ada';
    };

    const extractEducationLevel = (employeeId: string): string => {
      const edu = getEmployeeEducation(employeeId);
      if (!edu || edu === '-') return 'Tidak Ada';
      const level = edu.toUpperCase();
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
      return 'Lainnya';
    };

    // Filter hanya ASN (PNS, CPNS, PPPK) dari unit ini
    const asnEmployees = employees.filter(emp => {
      const status = normalizeAsnStatus(emp.asn_status);
      return status === 'PNS' || status === 'CPNS' || status === 'PPPK';
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 2: Tabel Golongan
    // ═══════════════════════════════════════════════════════════════════════
    const isPnsOrCpns = (emp: EmployeeMatch) => {
      const s = normalizeAsnStatus(emp.asn_status);
      return s === 'PNS' || s === 'CPNS';
    };
    
    const isPppk = (emp: EmployeeMatch) => normalizeAsnStatus(emp.asn_status) === 'PPPK';
    
    const getPnsGolongan = (rankGroup: string): string => {
      const rg = String(rankGroup || '').trim();
      const subMatch = rg.match(/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i);
      if (subMatch) return subMatch[1].toUpperCase();
      const longMatch = rg.match(/\((IV|III|II|I)\//i);
      if (longMatch) return longMatch[1].toUpperCase();
      return 'lainnya';
    };
    
    const getPppkGolongan = (rankGroup: string): string => {
      const rg = String(rankGroup || '').trim().toUpperCase();
      if (rg === 'III') return 'III';
      if (rg === 'V')   return 'V';
      if (rg === 'VII') return 'VII';
      if (rg === 'IX')  return 'IX';
      return 'lainnya';
    };

    const pns_I   = asnEmployees.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'I').length;
    const pns_II  = asnEmployees.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'II').length;
    const pns_III = asnEmployees.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'III').length;
    const pns_IV  = asnEmployees.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'IV').length;
    const jumlah_pns = asnEmployees.filter(e => isPnsOrCpns(e)).length;

    const pppk_III = asnEmployees.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'III').length;
    const pppk_V   = asnEmployees.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'V').length;
    const pppk_VII = asnEmployees.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'VII').length;
    const pppk_IX  = asnEmployees.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'IX').length;
    const jumlah_pppk = asnEmployees.filter(e => isPppk(e)).length;

    const total_asn = jumlah_pns + jumlah_pppk;

    const L = asnEmployees.filter(e => normalizeGender(e.gender) === 'Laki-laki').length;
    const P = asnEmployees.filter(e => normalizeGender(e.gender) === 'Perempuan').length;

    const golonganRows: Record<string, string | number>[] = [{
      'Unit Kerja': selectedDepartment,
      'PNS I': pns_I,
      'PNS II': pns_II,
      'PNS III': pns_III,
      'PNS IV': pns_IV,
      'Jumlah PNS': jumlah_pns,
      'PPPK III': pppk_III,
      'PPPK V': pppk_V,
      'PPPK VII': pppk_VII,
      'PPPK IX': pppk_IX,
      'Jumlah PPPK': jumlah_pppk,
      'Total ASN': total_asn,
      'L': L,
      'P': P,
      'Total JK': L + P,
    }];

    const wsGolongan = XLSX.utils.json_to_sheet(golonganRows);
    wsGolongan['!cols'] = [
      { wch: 32 }, // Unit Kerja
      { wch: 8 },  // PNS I
      { wch: 8 },  // PNS II
      { wch: 8 },  // PNS III
      { wch: 8 },  // PNS IV
      { wch: 12 }, // Jumlah PNS
      { wch: 9 },  // PPPK III
      { wch: 9 },  // PPPK V
      { wch: 9 },  // PPPK VII
      { wch: 9 },  // PPPK IX
      { wch: 13 }, // Jumlah PPPK
      { wch: 11 }, // Total ASN
      { wch: 6 },  // L
      { wch: 6 },  // P
      { wch: 10 }, // Total JK
    ];

    // Styling untuk Tabel Golongan
    const golBorderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const golHeaderStyle = {
      fill: { fgColor: { rgb: '4472C4' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: golBorderStyle,
    };

    const golDataStyle = {
      alignment: { vertical: 'center', horizontal: 'center' },
      border: golBorderStyle,
    };

    const golRange = XLSX.utils.decode_range(wsGolongan['!ref'] || 'A1');
    for (let R = golRange.s.r; R <= golRange.e.r; ++R) {
      for (let C = golRange.s.c; C <= golRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (wsGolongan[cellAddress] && wsGolongan[cellAddress].v !== undefined) {
          wsGolongan[cellAddress].s = R === 0 ? golHeaderStyle : golDataStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsGolongan, 'Tabel Golongan');

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 3: Tabel Pendidikan
    // ═══════════════════════════════════════════════════════════════════════
    const EDU_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const EDU_LABELS = ['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];

    const now = new Date();
    const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
                       'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();
    const titleText = `REKAP PEGAWAI ${selectedDepartment.toUpperCase()} BULAN ${currentMonth} ${currentYear}`;
    const subtitleText = 'Dukungan Personil Berdasarkan Tingkat Pendidikan';

    type ExcelRow = (string | number)[];
    const eduDataRow: ExcelRow = [selectedDepartment, asnEmployees.length];

    EDU_LEVELS.forEach((level) => {
      const count = asnEmployees.filter(e => extractEducationLevel(e.id) === level).length;
      eduDataRow.push(count);
    });
    eduDataRow.push(asnEmployees.length); // JML PEG kedua

    const aoaData: ExcelRow[] = [
      [titleText],
      [subtitleText],
      ['UNIT KERJA', 'JML PEG', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'JML PEG'],
      eduDataRow
    ];

    const wsEdu = XLSX.utils.aoa_to_sheet(aoaData);
    wsEdu['!cols'] = [
      { wch: 32 }, // UNIT KERJA
      { wch: 8 },  // JML PEG
      { wch: 6 },  // SD
      { wch: 6 },  // SMP
      { wch: 6 },  // SMA
      { wch: 6 },  // D1
      { wch: 6 },  // D2
      { wch: 6 },  // D3
      { wch: 6 },  // D4
      { wch: 6 },  // S1
      { wch: 6 },  // S2
      { wch: 6 },  // S3
      { wch: 8 },  // JML PEG
    ];
    wsEdu['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    ];

    // Styling untuk Tabel Pendidikan
    const eduBorderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const eduTitleStyle = {
      fill: { fgColor: { rgb: '4472C4' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: eduBorderStyle,
    };

    const eduSubtitleStyle = {
      fill: { fgColor: { rgb: '5B9BD5' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: eduBorderStyle,
    };

    const eduHeaderStyle = {
      fill: { fgColor: { rgb: '4472C4' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: eduBorderStyle,
    };

    const eduDataStyle = {
      alignment: { vertical: 'center', horizontal: 'center' },
      border: eduBorderStyle,
    };

    const eduRange = XLSX.utils.decode_range(wsEdu['!ref'] || 'A1');
    for (let R = eduRange.s.r; R <= eduRange.e.r; ++R) {
      for (let C = eduRange.s.c; C <= eduRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (wsEdu[cellAddress] && wsEdu[cellAddress].v !== undefined) {
          if (R === 0) {
            wsEdu[cellAddress].s = eduTitleStyle;
          } else if (R === 1) {
            wsEdu[cellAddress].s = eduSubtitleStyle;
          } else if (R === 2) {
            wsEdu[cellAddress].s = eduHeaderStyle;
          } else {
            wsEdu[cellAddress].s = eduDataStyle;
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsEdu, 'Tabel Pendidikan');

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 4: Tabel Jenis Kelamin
    // ═══════════════════════════════════════════════════════════════════════
    const genderRows: Record<string, string | number>[] = [{
      'Unit Kerja': selectedDepartment,
      'Laki-laki': L,
      'Perempuan': P,
      'Total': L + P,
    }];

    const wsGender = XLSX.utils.json_to_sheet(genderRows);
    wsGender['!cols'] = [
      { wch: 32 }, // Unit Kerja
      { wch: 12 }, // Laki-laki
      { wch: 12 }, // Perempuan
      { wch: 10 }, // Total
    ];

    // Styling untuk Tabel Jenis Kelamin
    const genderBorderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const genderHeaderStyle = {
      fill: { fgColor: { rgb: '4472C4' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: genderBorderStyle,
    };

    const genderDataStyle = {
      alignment: { vertical: 'center', horizontal: 'center' },
      border: genderBorderStyle,
    };

    const genderRange = XLSX.utils.decode_range(wsGender['!ref'] || 'A1');
    for (let R = genderRange.s.r; R <= genderRange.e.r; ++R) {
      for (let C = genderRange.s.c; C <= genderRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (wsGender[cellAddress] && wsGender[cellAddress].v !== undefined) {
          wsGender[cellAddress].s = R === 0 ? genderHeaderStyle : genderDataStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, wsGender, 'Tabel Jenis Kelamin');

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE FILE
    // ═══════════════════════════════════════════════════════════════════════
    XLSX.writeFile(wb, `Peta_Jabatan_ASN_${selectedDepartment.replace(/\s/g, '_')}.xlsx`, { 
      bookType: 'xlsx', 
      compression: true 
    });
    
    toast({ 
      title: 'Berhasil', 
      description: `Data Peta Jabatan ASN berhasil di-export dengan ${wb.SheetNames.length} sheet (${rows.length - POSITION_CATEGORIES.length} baris data + 3 tabel agregasi)` 
    });
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
          'NIK': emp.nip || '-',
          'Type Non ASN': emp.rank_group || 'Tenaga Alih Daya',
          'Jenis Kelamin': emp.gender || '-',
          'Keterangan Penugasan': emp.keterangan_penugasan || '-',
          'Status': idx === 0 ? 'Sesuai' : '',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Set column widths
    setColumnWidths(ws, [
      5,  // No
      35, // Jabatan
      10, // Formasi
      10, // Existing
      30, // Nama Pemangku
      20, // NIK
      20, // Type Non ASN
      14, // Jenis Kelamin
      30, // Keterangan Penugasan
      12, // Status
    ]);
    
    // Apply styling: header row (0) + data rows (no category rows for Non-ASN)
    applyWorksheetStyling(ws, {
      headerRow: 0,
      categoryRows: [], // No category headers for Non-ASN
    });
    
    XLSX.utils.book_append_sheet(wb, ws, 'Formasi Non-ASN');
    XLSX.writeFile(wb, `Formasi_Non_ASN_${selectedDepartment.replace(/\s/g, '_')}.xlsx`, {
      bookType: 'xlsx',
      compression: true
    });
    
    toast({ title: 'Berhasil', description: `Data Formasi Non-ASN berhasil di-export (${rows.length} baris data)` });
  };

  const handleExportSummary = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary per Unit Kerja (only for Admin Pusat/Pimpinan)
    if (canViewAll) {
      const deptRows: Record<string, string | number>[] = [];
      dynamicDepartments
        .filter(d => d !== 'Pusat')
        .forEach((dept, idx) => {
          const deptPositions = allPositions.filter(p => p.department === dept);
          const totalAbk = deptPositions.reduce((sum, p) => sum + p.abk_count, 0);
          
          const positionNames = new Set(deptPositions.map(p => normalizeString(p.position_name)));
          const totalExisting = allEmployees.filter(emp => 
            emp.department === dept && emp.position_name && positionNames.has(normalizeString(emp.position_name))
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
      setColumnWidths(ws1, [5, 35, 14, 12, 14, 10, 10, 15]);
      applyWorksheetStyling(ws1, { headerRow: 0 });
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
      const normName = normalizeString(pos.position_name);
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
        const normName = normalizeString(emp.position_name);
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
    setColumnWidths(ws2, [5, 15, 40, 12, 14, 10, 10, 15]);
    applyWorksheetStyling(ws2, { headerRow: 0 });
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary per Jabatan');

    // Sheet 3: Summary per Kategori
    const categoryRows: Record<string, string | number>[] = [];
    POSITION_CATEGORIES.forEach((category, idx) => {
      const categoryPositions = allPositions.filter(p => p.position_category === category);
      const totalAbk = categoryPositions.reduce((sum, p) => sum + p.abk_count, 0);
      
      const positionNames = new Set(categoryPositions.map(p => normalizeString(p.position_name)));
      const totalExisting = allEmployees.filter(emp => 
        emp.position_name && positionNames.has(normalizeString(emp.position_name))
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
    setColumnWidths(ws3, [5, 15, 14, 12, 14, 10, 10, 15]);
    applyWorksheetStyling(ws3, { headerRow: 0 });
    XLSX.utils.book_append_sheet(wb, ws3, 'Summary per Kategori');

    // Sheet 4: Detail Jabatan per Unit Kerja (only for Admin Pusat/Pimpinan)
    if (canViewAll) {
      const detailRows: Record<string, string | number>[] = [];
      const unitHeaderRows: number[] = []; // Track unit header rows for styling
      const subtotalRows: number[] = []; // Track subtotal rows for styling
      let detailNo = 1;

      dynamicDepartments
        .filter(d => d !== 'Pusat')
        .forEach(dept => {
          const deptPositions = allPositions.filter(p => p.department === dept);
          if (deptPositions.length === 0) return;

          // Header baris unit kerja
          unitHeaderRows.push(detailRows.length);
          detailRows.push({
            'No': '',
            'Unit Kerja': dept.toUpperCase(),
            'Kategori': '',
            'Nama Jabatan': '',
            'ABK': '',
            'Existing': '',
            'Gap': '',
            '% Terisi': '',
            'Status': '',
          });

          // Kelompokkan per kategori dalam unit ini
          POSITION_CATEGORIES.forEach(category => {
            const catPositions = deptPositions
              .filter(p => p.position_category === category)
              .sort((a, b) => a.position_order - b.position_order || a.position_name.localeCompare(b.position_name));

            if (catPositions.length === 0) return;

            catPositions.forEach(pos => {
              // Hitung existing untuk jabatan ini di unit ini
              const existing = allEmployees.filter(emp =>
                emp.department === dept &&
                emp.position_name &&
                normalizeString(emp.position_name) === normalizeString(pos.position_name)
              ).length;

              const gap = pos.abk_count - existing;
              const percentage = pos.abk_count > 0
                ? ((existing / pos.abk_count) * 100).toFixed(1)
                : '0';

              detailRows.push({
                'No': detailNo++,
                'Unit Kerja': dept,
                'Kategori': category,
                'Nama Jabatan': pos.position_name,
                'ABK': pos.abk_count,
                'Existing': existing,
                'Gap': gap,
                '% Terisi': `${percentage}%`,
                'Status': gap > 0 ? `Kurang ${gap}` : gap < 0 ? `Lebih ${Math.abs(gap)}` : 'Sesuai',
              });
            });
          });

          // Baris subtotal per unit
          const unitTotalAbk = deptPositions.reduce((sum, p) => sum + p.abk_count, 0);
          const unitPosNames = new Set(deptPositions.map(p => normalizeString(p.position_name)));
          const unitTotalExisting = allEmployees.filter(emp =>
            emp.department === dept &&
            emp.position_name &&
            unitPosNames.has(normalizeString(emp.position_name))
          ).length;
          const unitGap = unitTotalAbk - unitTotalExisting;
          const unitPct = unitTotalAbk > 0
            ? ((unitTotalExisting / unitTotalAbk) * 100).toFixed(1)
            : '0';

          subtotalRows.push(detailRows.length);
          detailRows.push({
            'No': '',
            'Unit Kerja': `SUBTOTAL ${dept}`,
            'Kategori': '',
            'Nama Jabatan': `${deptPositions.length} jabatan`,
            'ABK': unitTotalAbk,
            'Existing': unitTotalExisting,
            'Gap': unitGap,
            '% Terisi': `${unitPct}%`,
            'Status': unitGap > 0 ? `Kurang ${unitGap}` : unitGap < 0 ? `Lebih ${Math.abs(unitGap)}` : 'Sesuai',
          });

          // Baris kosong pemisah antar unit
          detailRows.push({
            'No': '', 'Unit Kerja': '', 'Kategori': '', 'Nama Jabatan': '',
            'ABK': '', 'Existing': '', 'Gap': '', '% Terisi': '', 'Status': '',
          });
        });

      if (detailRows.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(detailRows);
        setColumnWidths(ws4, [5, 35, 14, 42, 8, 10, 8, 10, 15]);
        
        // Apply styling with unit headers as category rows and subtotals as total rows
        const worksheetUnitHeaderRows = unitHeaderRows.map(r => r + 1); // +1 for header row
        const worksheetSubtotalRows = subtotalRows.map(r => r + 1); // +1 for header row
        applyWorksheetStyling(ws4, {
          headerRow: 0,
          categoryRows: worksheetUnitHeaderRows,
          totalRows: worksheetSubtotalRows,
        });
        
        // Merge unit header rows across all columns
        applyCategoryHeaders(ws4, worksheetUnitHeaderRows, 9);
        
        XLSX.utils.book_append_sheet(wb, ws4, 'Detail Jabatan per Unit');
      }
    }

    // Generate filename based on role
    const filename = canViewAll 
      ? `Summary_Peta_Jabatan_Semua_Unit.xlsx`
      : `Summary_Peta_Jabatan_${(profile?.department || selectedDepartment).replace(/\s/g, '_')}.xlsx`;
    
    XLSX.writeFile(wb, filename, {
      bookType: 'xlsx',
      compression: true
    });
    
    const sheetCount = canViewAll ? 4 : 2; // Admin Unit doesn't have "Summary per Unit" & "Detail per Unit" sheets
    toast({ 
      title: 'Berhasil', 
      description: `Summary Peta Jabatan berhasil di-export (${sheetCount} sheets)` 
    });
  };

  // ── Export Peta Jabatan ASN semua unit kerja (1 worksheet per unit) ──────────
  const [isExportingAll, setIsExportingAll] = useState(false);

  const handleExportAllDepartments = async () => {
    setIsExportingAll(true);
    toast({ title: 'Memproses...', description: 'Mengambil data semua unit kerja, harap tunggu.' });

    try {
      const wb = XLSX.utils.book_new();
      const sheetNamesUsed = new Set<string>();

      // Helper: buat nama sheet unik maks 31 karakter (batas Excel)
      const makeSheetName = (dept: string): string => {
        // Singkat nama unit kerja agar muat di 31 karakter
        const name = dept
          .replace(/Balai Besar Pelatihan Vokasi dan Produktivitas/gi, 'BBPVP')
          .replace(/Balai Pelatihan Vokasi dan Produktivitas/gi, 'BPVP')
          .replace(/Setditjen Binalavotas/gi, 'Setditjen')
          .replace(/Direktorat/gi, 'Dit.')
          .trim()
          .substring(0, 31);
        // Pastikan unik
        let candidate = name;
        let counter = 2;
        while (sheetNamesUsed.has(candidate)) {
          const suffix = ` (${counter++})`;
          candidate = name.substring(0, 31 - suffix.length) + suffix;
        }
        sheetNamesUsed.add(candidate);
        return candidate;
      };

      // Helper fetch all dengan pagination untuk menghindari limit 1000 rows Supabase
      const fetchAllPages = async <T,>(
        buildQuery: (from: number, to: number) => ReturnType<typeof supabase.from>
      ): Promise<T[]> => {
        const all: T[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          const { data, error } = await buildQuery(offset, offset + batchSize - 1) as { data: T[] | null; error: unknown };
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return all;
      };

      // Ambil semua data dengan pagination
      const [allPos, allEmp] = await Promise.all([
        fetchAllPages((from, to) =>
          supabase
            .from('position_references')
            .select(POSITION_REFERENCE_COLUMNS)
            .order('department')
            .order('position_category')
            .order('position_order')
            .order('position_name')
            .range(from, to)
        ),
        fetchAllPages((from, to) =>
          supabase
            .from('employees')
            .select('id, name, front_title, back_title, nip, asn_status, rank_group, gender, position_name, additional_position, department, religion, birth_date, tmt_cpns, keterangan_formasi, keterangan_penempatan, keterangan_penugasan, keterangan_perubahan')
            .eq('is_active', true)
            .or('asn_status.is.null,asn_status.neq.Non ASN')
            .range(from, to)
        ),
      ]);

      // Fetch pendidikan terakhir — RPC DISTINCT ON dengan pagination
      const allEdu: Array<{ employee_id: string; level: string; major: string | null }> = [];
      let eduOffset = 0;
      const eduBatchSize = 1000;
      
      while (true) {
        const { data: eduBatch, error: eduError } = await supabase
          .rpc('get_latest_education_per_employee')
          .range(eduOffset, eduOffset + eduBatchSize - 1);
        
        if (eduError) throw eduError;
        if (!eduBatch || eduBatch.length === 0) break;
        
        allEdu.push(...eduBatch);
        
        if (eduBatch.length < eduBatchSize) break;
        eduOffset += eduBatchSize;
      }

      // Buat map pendidikan terakhir per employee_id dengan format "Level Major"
      const eduMap = new Map<string, string>();
      allEdu.forEach(e => {
        if (!eduMap.has(e.employee_id)) {
          // Format: "Level Major" atau hanya "Level" jika major kosong
          const eduText = e.major ? `${e.level} ${e.major}` : e.level;
          eduMap.set(e.employee_id, eduText);
        }
      });

      // Buat map employees per department → per normalized position_name
      // PENTING: Resolve Satpel/Workshop ke unit pembina menggunakan getEffectiveDepartment
      const empByDeptPos = new Map<string, Map<string, EmployeeMatch[]>>();
      allEmp.forEach(emp => {
        if (!emp.department || !emp.position_name) return;
        // Resolve Satpel/Workshop ke unit pembina
        const effectiveDept = getEffectiveDepartment(emp.department);
        if (!effectiveDept) return; // Skip jika tidak ada mapping
        
        if (!empByDeptPos.has(effectiveDept)) empByDeptPos.set(effectiveDept, new Map());
        const posMap = empByDeptPos.get(effectiveDept)!;
        const norm = normalizeString(emp.position_name);
        if (!posMap.has(norm)) posMap.set(norm, []);
        posMap.get(norm)!.push(emp);
      });

      // Kelompokkan position_references per effective department
      // PENTING: Resolve Satpel/Workshop ke unit pembina
      const posByDept = new Map<string, typeof allPos>();
      allPos.forEach(pos => {
        if (!pos.department) return;
        // Resolve Satpel/Workshop ke unit pembina
        const effectiveDept = getEffectiveDepartment(pos.department);
        if (!effectiveDept) return; // Skip jika tidak ada mapping
        
        if (!posByDept.has(effectiveDept)) posByDept.set(effectiveDept, []);
        posByDept.get(effectiveDept)!.push(pos);
      });

      // Kumpulkan semua unit kerja yang punya data jabatan
      // Filter: exclude Pusat dan Satpel/Workshop (karena Satpel menginduk ke unit pembina)
      const depts = dynamicDepartments.filter(d => {
        if (d === 'Pusat') return false;
        // Exclude Satpel dan Workshop karena mereka menginduk ke unit pembina
        if (d.startsWith('Satpel ') || d.startsWith('Workshop ')) return false;
        return true;
      });

      // Buat worksheet per unit kerja
      for (const dept of depts) {
        const deptPositions = posByDept.get(dept) || [];
        if (deptPositions.length === 0) continue; // skip unit tanpa jabatan

        const posMap = empByDeptPos.get(dept) || new Map<string, EmployeeMatch[]>();
        const rows: Record<string, string | number>[] = [];
        let no = 1;
        
        // Track merge ranges untuk jabatan dengan multiple pemangku
        const mergeRanges: Array<{ startRow: number; endRow: number; columns: number[] }> = [];
        let currentRowIndex = 1; // Track row index in worksheet (1-based, karena row 0 adalah header)

        POSITION_CATEGORIES.forEach(category => {
          // Baris header kategori - nilai di kolom pertama untuk merge
          rows.push({
            'No': category.toUpperCase(), // Taruh kategori di kolom pertama
            'Jabatan Sesuai Kepmen 202 Tahun 2024': '',
            'Grade/Kelas Jabatan': '', 'Jumlah ABK': '', 'Jumlah Existing': '',
            'Nama Pemangku': '', 'Kriteria ASN': '', 'NIP': '',
            'Pangkat Golongan': '', 'Pendidikan Terakhir': '', 'Jenis Kelamin': '',
            'Keterangan Formasi': '', 'Keterangan Penempatan': '',
            'Keterangan Penugasan Tambahan': '', 'Keterangan Perubahan': '',
          });
          currentRowIndex++;

          const catPositions = deptPositions
            .filter(p => p.position_category === category)
            .sort((a, b) => {
              if (a.position_order !== b.position_order) {
                return a.position_order - b.position_order;
              }
              return a.position_name.localeCompare(b.position_name);
            });

          catPositions.forEach(pos => {
            const matched = posMap.get(normalizeString(pos.position_name)) || [];
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
              currentRowIndex++;
            } else {
              const startRow = currentRowIndex;
              
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
                  'Pendidikan Terakhir': eduMap.get(emp.id) || '-',
                  'Jenis Kelamin': emp.gender || '-',
                  'Keterangan Formasi': idx === 0
                    ? (ketFormasi > 0 ? `Kurang ${ketFormasi}` : ketFormasi < 0 ? `Lebih ${Math.abs(ketFormasi)}` : 'Sesuai')
                    : '',
                  'Keterangan Penempatan': emp.keterangan_penempatan || '-',
                  'Keterangan Penugasan Tambahan': emp.additional_position || '-',
                  'Keterangan Perubahan': emp.keterangan_perubahan || '-',
                });
                currentRowIndex++;
              });
              
              // Jika ada lebih dari 1 pemangku, tambahkan merge range
              if (matched.length > 1) {
                mergeRanges.push({
                  startRow: startRow,
                  endRow: currentRowIndex - 1,
                  columns: [0, 1, 2, 3, 4, 11] // No, Jabatan, Grade, ABK, Existing, Keterangan Formasi
                });
              }
            }
          });
        });

        // Convert rows to array of arrays untuk bisa menambahkan tabel agregasi di bawah
        const ws = XLSX.utils.json_to_sheet(rows);
        
        // Hitung agregasi untuk unit ini
        const deptEmps = allEmp.filter(e => {
          if (!e.department) return false;
          const effectiveDept = getEffectiveDepartment(e.department);
          return effectiveDept === dept;
        });

        // Filter hanya ASN (PNS, CPNS, PPPK)
        const asnEmps = deptEmps.filter(e => {
          const status = e.asn_status?.trim().toUpperCase() || '';
          return status === 'PNS' || status === 'CPNS' || status === 'PPPK';
        });

        // Hitung golongan
        const getPnsGolongan = (rankGroup: string): string => {
          const rg = String(rankGroup || '').trim();
          const subMatch = rg.match(/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i);
          if (subMatch) return subMatch[1].toUpperCase();
          const longMatch = rg.match(/\((IV|III|II|I)\//i);
          if (longMatch) return longMatch[1].toUpperCase();
          return 'lainnya';
        };

        const getPppkGolongan = (rankGroup: string): string => {
          const rg = String(rankGroup || '').trim().toUpperCase();
          if (rg === 'III') return 'III';
          if (rg === 'V') return 'V';
          if (rg === 'VII') return 'VII';
          if (rg === 'IX') return 'IX';
          return 'lainnya';
        };

        const pnsEmps = asnEmps.filter(e => {
          const s = e.asn_status?.trim().toUpperCase() || '';
          return s === 'PNS' || s === 'CPNS';
        });
        const pppkEmps = asnEmps.filter(e => e.asn_status?.trim().toUpperCase() === 'PPPK');

        const golonganCounts = {
          pnsIV: pnsEmps.filter(e => getPnsGolongan(e.rank_group || '') === 'IV').length,
          pnsIII: pnsEmps.filter(e => getPnsGolongan(e.rank_group || '') === 'III').length,
          pnsII: pnsEmps.filter(e => getPnsGolongan(e.rank_group || '') === 'II').length,
          pnsI: pnsEmps.filter(e => getPnsGolongan(e.rank_group || '') === 'I').length,
          pppkIII: pppkEmps.filter(e => getPppkGolongan(e.rank_group || '') === 'III').length,
          pppkV: pppkEmps.filter(e => getPppkGolongan(e.rank_group || '') === 'V').length,
          pppkVII: pppkEmps.filter(e => getPppkGolongan(e.rank_group || '') === 'VII').length,
          pppkIX: pppkEmps.filter(e => getPppkGolongan(e.rank_group || '') === 'IX').length,
        };

        // Hitung pendidikan
        const getEduLevel = (empId: string): string => {
          const edu = eduMap.get(empId);
          if (!edu) return 'Tidak Ada';
          const level = edu.toUpperCase();
          if (level.includes('S3') || level.includes('DOKTOR') || level.includes('DR')) return 'S3';
          if (level.includes('S2') || level.includes('MAGISTER') || level.includes('MASTER')) return 'S2';
          if (level.includes('S1') || level.includes('SARJANA') || level.includes('BACHELOR')) return 'S1';
          if (level.includes('D4') || level.includes('D-IV')) return 'D4';
          if (level.includes('D3') || level.includes('D-III')) return 'D3';
          if (level.includes('D2') || level.includes('D-II')) return 'D2';
          if (level.includes('D1') || level.includes('D-I')) return 'D1';
          if (level.includes('SMA') || level.includes('SMK') || level.includes('MA')) return 'SMA';
          if (level.includes('SMP') || level.includes('MTS')) return 'SMP';
          if (level.includes('SD') || level.includes('MI')) return 'SD';
          return 'Lainnya';
        };

        const eduCounts = {
          SD: asnEmps.filter(e => getEduLevel(e.id) === 'SD').length,
          SMP: asnEmps.filter(e => getEduLevel(e.id) === 'SMP').length,
          SMA: asnEmps.filter(e => getEduLevel(e.id) === 'SMA').length,
          D1: asnEmps.filter(e => getEduLevel(e.id) === 'D1').length,
          D2: asnEmps.filter(e => getEduLevel(e.id) === 'D2').length,
          D3: asnEmps.filter(e => getEduLevel(e.id) === 'D3').length,
          D4: asnEmps.filter(e => getEduLevel(e.id) === 'D4').length,
          S1: asnEmps.filter(e => getEduLevel(e.id) === 'S1').length,
          S2: asnEmps.filter(e => getEduLevel(e.id) === 'S2').length,
          S3: asnEmps.filter(e => getEduLevel(e.id) === 'S3').length,
        };

        // Hitung jenis kelamin
        const getGender = (gender: unknown): string => {
          if (!gender) return 'Tidak Ada';
          const g = String(gender).toLowerCase().replace(/[-_\/\s]+/g, '');
          if (g.includes('laki') || g === 'l' || g === 'm' || g === 'male') return 'L';
          if (g.includes('perempuan') || g === 'p' || g === 'f' || g === 'female' || g.includes('wanita')) return 'P';
          return 'Tidak Ada';
        };

        const genderCounts = {
          L: asnEmps.filter(e => getGender(e.gender) === 'L').length,
          P: asnEmps.filter(e => getGender(e.gender) === 'P').length,
        };

        const totalAsn = asnEmps.length;

        // Tambahkan tabel agregasi di bawah data utama
        const startRow = rows.length + 3; // Mulai 3 baris setelah data terakhir

        // Tabel 1: Golongan
        XLSX.utils.sheet_add_aoa(ws, [
          [''],
          ['Golongan', 'Jumlah'],
          ['PNS Golongan IV', golonganCounts.pnsIV],
          ['PNS Golongan III', golonganCounts.pnsIII],
          ['PNS Golongan II', golonganCounts.pnsII],
          ['PNS Golongan I', golonganCounts.pnsI],
          ['PPPK Golongan III', golonganCounts.pppkIII],
          ['PPPK Golongan V', golonganCounts.pppkV],
          ['PPPK Golongan VII', golonganCounts.pppkVII],
          ['PPPK Golongan IX', golonganCounts.pppkIX],
          ['Jml', totalAsn],
        ], { origin: startRow });

        // Tabel 2: Pendidikan ASN
        const eduStartRow = startRow + 13;
        XLSX.utils.sheet_add_aoa(ws, [
          [''],
          ['PENDIDIKAN ASN', '', '', '', '', '', '', '', '', '', 'JML'],
          ['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', ''],
          [
            eduCounts.SD, eduCounts.SMP, eduCounts.SMA, eduCounts.D1, eduCounts.D2,
            eduCounts.D3, eduCounts.D4, eduCounts.S1, eduCounts.S2, eduCounts.S3, totalAsn
          ],
        ], { origin: eduStartRow });

        // Tabel 3: Jenis Kelamin
        const genderStartRow = eduStartRow + 6;
        XLSX.utils.sheet_add_aoa(ws, [
          [''],
          ['Jenis Kelamin', '', ''],
          ['L', 'P', 'JML PEG'],
          [genderCounts.L, genderCounts.P, totalAsn],
        ], { origin: genderStartRow });

        ws['!cols'] = [
          { wch: 5 },  // No
          { wch: 40 }, // Jabatan Sesuai Kepmen 202 Tahun 2024
          { wch: 15 }, // Grade/Kelas Jabatan
          { wch: 12 }, // Jumlah ABK
          { wch: 14 }, // Jumlah Existing
          { wch: 30 }, // Nama Pemangku
          { wch: 12 }, // Kriteria ASN
          { wch: 20 }, // NIP
          { wch: 25 }, // Pangkat Golongan
          { wch: 30 }, // Pendidikan Terakhir
          { wch: 14 }, // Jenis Kelamin
          { wch: 20 }, // Keterangan Formasi
          { wch: 20 }, // Keterangan Penempatan
          { wch: 30 }, // Keterangan Penugasan Tambahan
          { wch: 20 }, // Keterangan Perubahan
        ];

        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Merge cells, colors, borders
        // ═══════════════════════════════════════════════════════════════════════
        
        // Define border style
        const borderStyle = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        };

        // Header style (row 0)
        const headerStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue header
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderStyle,
        };

        // Category header style (STRUKTURAL, FUNGSIONAL, PELAKSANA)
        const categoryStyle = {
          fill: { fgColor: { rgb: 'FFC000' } }, // Orange/Gold
          font: { bold: true, color: { rgb: '000000' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderStyle,
        };

        // Data cell style
        const dataStyle = {
          alignment: { vertical: 'center', wrapText: true },
          border: borderStyle,
        };

        // Apply styling to all cells
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        
        // Track category header rows for merging
        const categoryRows: number[] = [];
        
        // First pass: identify category rows (HANYA BACA, JANGAN UBAH)
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // Check column A only
          
          // Check if this is a category header row
          if (ws[cellAddress] && ws[cellAddress].v && 
              ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(String(ws[cellAddress].v).toUpperCase())) {
            categoryRows.push(R);
          }
        }

        // Second pass: apply styling based on row type
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const isCategoryRow = categoryRows.includes(R);
          
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            
            // Only style cells that exist and have values
            if (ws[cellAddress]) {
              // Header row (row 0)
              if (R === 0) {
                ws[cellAddress].s = headerStyle;
              }
              // Category header row
              else if (isCategoryRow) {
                ws[cellAddress].s = categoryStyle;
              }
              // Data cells
              else {
                ws[cellAddress].s = dataStyle;
              }
            }
          }
        }

        // Merge cells for category headers (merge across all columns)
        if (!ws['!merges']) ws['!merges'] = [];
        categoryRows.forEach(rowIdx => {
          // Merge from column A (0) to column O (14)
          ws['!merges']!.push({
            s: { r: rowIdx, c: 0 },  // Start: column A
            e: { r: rowIdx, c: 14 }, // End: column O (15 columns total, 0-14)
          });
        });
        
        // Add vertical merges for positions with multiple employees
        mergeRanges.forEach(range => {
          range.columns.forEach(colIdx => {
            ws['!merges']!.push({
              s: { r: range.startRow, c: colIdx },
              e: { r: range.endRow, c: colIdx },
            });
          });
        });

        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Tabel Agregasi (Golongan, Pendidikan, Jenis Kelamin)
        // ═══════════════════════════════════════════════════════════════════════
        
        // Style untuk header tabel agregasi
        const aggHeaderStyle = {
          fill: { fgColor: { rgb: '70AD47' } }, // Green
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderStyle,
        };

        // Style untuk data tabel agregasi
        const aggDataStyle = {
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderStyle,
        };

        // Style untuk label tabel agregasi (kolom kiri)
        const aggLabelStyle = {
          font: { bold: true, sz: 10 },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderStyle,
        };

        // ─────────────────────────────────────────────────────────────────────
        // Tabel 1: Golongan (startRow + 1 untuk header, +2 sampai +10 untuk data)
        // ─────────────────────────────────────────────────────────────────────
        
        // Header: "Golongan", "Jumlah"
        for (let C = 0; C <= 1; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: startRow + 1, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggHeaderStyle;
          }
        }
        
        // Data rows (8 rows golongan + 1 row total)
        for (let R = startRow + 2; R <= startRow + 10; ++R) {
          // Kolom 0: Label golongan (bold, left-aligned)
          const labelAddr = XLSX.utils.encode_cell({ r: R, c: 0 });
          if (ws[labelAddr]) {
            ws[labelAddr].s = aggLabelStyle;
          }
          
          // Kolom 1: Jumlah (center-aligned)
          const valueAddr = XLSX.utils.encode_cell({ r: R, c: 1 });
          if (ws[valueAddr]) {
            ws[valueAddr].s = aggDataStyle;
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Tabel 2: Pendidikan ASN
        // ─────────────────────────────────────────────────────────────────────
        
        // Header row 1: "PENDIDIKAN ASN" merged (kolom 0-9), "JML" (kolom 10)
        const eduHeaderRow1 = eduStartRow + 1;
        
        // Merge "PENDIDIKAN ASN" dari kolom 0-9
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({
          s: { r: eduHeaderRow1, c: 0 },
          e: { r: eduHeaderRow1, c: 9 },
        });
        
        // Style untuk semua kolom di header row 1
        for (let C = 0; C <= 10; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: eduHeaderRow1, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggHeaderStyle;
          }
        }
        
        // Header row 2: SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3, (empty for JML)
        const eduHeaderRow2 = eduStartRow + 2;
        for (let C = 0; C <= 10; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: eduHeaderRow2, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggHeaderStyle;
          }
        }
        
        // Data row: nilai pendidikan
        const eduDataRow = eduStartRow + 3;
        for (let C = 0; C <= 10; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: eduDataRow, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggDataStyle;
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Tabel 3: Jenis Kelamin
        // ─────────────────────────────────────────────────────────────────────
        
        // Header row 1: "Jenis Kelamin" merged (kolom 0-2)
        const genderHeaderRow1 = genderStartRow + 1;
        
        // Merge "Jenis Kelamin" dari kolom 0-2
        ws['!merges'].push({
          s: { r: genderHeaderRow1, c: 0 },
          e: { r: genderHeaderRow1, c: 2 },
        });
        
        // Style untuk header row 1
        for (let C = 0; C <= 2; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: genderHeaderRow1, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggHeaderStyle;
          }
        }
        
        // Header row 2: L, P, JML PEG
        const genderHeaderRow2 = genderStartRow + 2;
        for (let C = 0; C <= 2; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: genderHeaderRow2, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggHeaderStyle;
          }
        }
        
        // Data row: nilai jenis kelamin
        const genderDataRow = genderStartRow + 3;
        for (let C = 0; C <= 2; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: genderDataRow, c: C });
          if (ws[cellAddr]) {
            ws[cellAddr].s = aggDataStyle;
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, makeSheetName(dept));
      }

      // Sheet terakhir: Summary semua unit
      const summaryRows: Record<string, string | number>[] = [];
      depts.forEach((dept, idx) => {
        // Hitung positions untuk dept ini (sudah resolved ke effective dept)
        const deptPos = posByDept.get(dept) || [];
        if (deptPos.length === 0) return;
        
        const totalAbk = deptPos.reduce((s, p) => s + p.abk_count, 0);
        
        // Hitung employees untuk dept ini (sudah resolved ke effective dept)
        const posMap = empByDeptPos.get(dept) || new Map<string, EmployeeMatch[]>();
        let totalExisting = 0;
        posMap.forEach(emps => {
          totalExisting += emps.length;
        });
        
        const gap = totalAbk - totalExisting;
        summaryRows.push({
          'No': idx + 1,
          'Unit Kerja': dept,
          'Total Jabatan': deptPos.length,
          'Total ABK': totalAbk,
          'Total Existing': totalExisting,
          'Gap (ABK-Existing)': gap,
          '% Terisi': totalAbk > 0 ? `${((totalExisting / totalAbk) * 100).toFixed(1)}%` : '0%',
          'Status': gap > 0 ? `Kurang ${gap}` : gap < 0 ? `Lebih ${Math.abs(gap)}` : 'Sesuai',
        });
      });

      if (summaryRows.length > 0) {
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        wsSummary['!cols'] = [
          { wch: 5 }, { wch: 40 }, { wch: 14 }, { wch: 12 },
          { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 15 },
        ];
        
        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Summary Sheet
        // ═══════════════════════════════════════════════════════════════════════
        const summaryBorderStyle = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        };

        const summaryHeaderStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: summaryBorderStyle,
        };

        const summaryDataStyle = {
          alignment: { vertical: 'center', wrapText: true },
          border: summaryBorderStyle,
        };

        // Apply styling to Summary sheet
        const summaryRange = XLSX.utils.decode_range(wsSummary['!ref'] || 'A1');
        for (let R = summaryRange.s.r; R <= summaryRange.e.r; ++R) {
          for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            
            // Only style existing cells
            if (wsSummary[cellAddress] && wsSummary[cellAddress].v !== undefined) {
              // Header row (row 0)
              if (R === 0) {
                wsSummary[cellAddress].s = summaryHeaderStyle;
              }
              // Data rows
              else {
                wsSummary[cellAddress].s = summaryDataStyle;
              }
            }
          }
        }
        
        // Taruh summary di posisi pertama
        wb.SheetNames.unshift('SUMMARY');
        wb.Sheets['SUMMARY'] = wsSummary;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TAMBAHAN: 3 Sheet Agregasi dari Agregasi Cepat
      // ═══════════════════════════════════════════════════════════════════════

      // Helper functions untuk agregasi (sama seperti di QuickAggregation)
      const normalizeAsnStatus = (status: unknown): string => {
        if (!status) return 'Tidak Ada';
        const s = String(status).trim().toUpperCase();
        if (s === 'CPNS' || s.includes('CPNS')) return 'CPNS';
        if (s === 'PNS' || s.includes('PNS')) return 'PNS';
        if (s === 'PPPK' || s.includes('PPPK')) return 'PPPK';
        if (s === 'NON ASN' || s.includes('NON') || s.includes('ALIH DAYA')) return 'Non ASN';
        return s || 'Tidak Ada';
      };

      const normalizeGender = (gender: unknown): string => {
        if (!gender) return 'Tidak Ada';
        const g = String(gender).toLowerCase().replace(/[-_\/\s]+/g, '');
        if (g.includes('laki') || g === 'l' || g === 'm' || g === 'male') return 'Laki-laki';
        if (g.includes('perempuan') || g === 'p' || g === 'f' || g === 'female' || g.includes('wanita')) return 'Perempuan';
        return 'Tidak Ada';
      };

      const extractEducationLevelFromMap = (employeeId: string): string => {
        const edu = eduMap.get(employeeId);
        if (!edu) return 'Tidak Ada';
        const level = edu.toUpperCase();
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
        return 'Lainnya';
      };

      // Urutan resmi unit kerja
      const OFFICIAL_DEPT_ORDER: string[] = [
        'Setditjen Binalavotas',
        'Direktorat Bina Stankomproglat',
        'Direktorat Bina Lemlatvok',
        'Direktorat Bina Penyelenggaraan Latvogan',
        'Direktorat Bina Intala',
        'Direktorat Bina Peningkatan Produktivitas',
        'Sekretariat BNSP',
        'BBPVP Bekasi',
        'BBPVP Bandung',
        'BBPVP Serang',
        'BBPVP Medan',
        'BBPVP Semarang',
        'BBPVP Makassar',
        'BPVP Surakarta',
        'BPVP Ambon',
        'BPVP Ternate',
        'BPVP Banda Aceh',
        'BPVP Sorong',
        'BPVP Kendari',
        'BPVP Samarinda',
        'BPVP Padang',
        'BPVP Bandung Barat',
        'BPVP Lombok Timur',
        'BPVP Bantaeng',
        'BPVP Banyuwangi',
        'BPVP Sidoarjo',
        'BPVP Pangkep',
        'BPVP Belitung',
        'Satuan Pelayanan Sawahlunto',
        'Satuan Pelayanan Sofifi',
        'Satuan Pelayanan Pekanbaru',
        'Satuan Pelayanan Lubuklinggau',
        'Satuan Pelayanan Lampung',
        'Satuan Pelayanan Bengkulu',
        'Satuan Pelayanan Mamuju',
        'Satuan Pelayanan Majene',
        'Satuan Pelayanan Palu',
        'Satuan Pelayanan Bantul',
        'Satuan Pelayanan Kupang',
        'Satuan Pelayanan Jambi',
        'Satuan Pelayanan Jayapura',
        'Workshop Prabumulih',
        'Workshop Batam',
        'Workshop Gorontalo',
      ];

      // Kelompokkan pegawai per unit kerja (resolve Satpel ke unit pembina)
      const deptEmpMap = new Map<string, typeof allEmp>();
      allEmp.forEach(emp => {
        if (!emp.department) return;
        // Resolve Satpel/Workshop ke unit pembina
        const effectiveDept = getEffectiveDepartment(emp.department);
        if (!effectiveDept) return; // Skip jika tidak ada mapping
        
        if (!deptEmpMap.has(effectiveDept)) deptEmpMap.set(effectiveDept, []);
        deptEmpMap.get(effectiveDept)!.push(emp);
      });

      const deptSet = new Set(deptEmpMap.keys());
      const sortedDepts = [
        ...OFFICIAL_DEPT_ORDER.filter(d => deptSet.has(d)),
        ...[...deptSet].filter(d => !OFFICIAL_DEPT_ORDER.includes(d)).sort(),
      ];

      // ═══════════════════════════════════════════════════════════════════════
      // SHEET 1: Tabel Golongan per Unit Kerja
      // ═══════════════════════════════════════════════════════════════════════
      if (sortedDepts.length > 0) {
        const golonganRows: Record<string, string | number>[] = [];
        const totals = { pns_I: 0, pns_II: 0, pns_III: 0, pns_IV: 0, jumlah_pns: 0, pppk_III: 0, pppk_V: 0, pppk_VII: 0, pppk_IX: 0, jumlah_pppk: 0, total: 0, L: 0, P: 0 };

        sortedDepts.forEach((dept, idx) => {
          const emps = deptEmpMap.get(dept) || [];

          // Hitung PNS per golongan utama (I, II, III, IV)
          const isPnsOrCpns = (e: typeof allEmp[0]) => {
            const s = normalizeAsnStatus(e.asn_status);
            return s === 'PNS' || s === 'CPNS';
          };
          const getPnsGolongan = (rankGroup: string): string => {
            const rg = String(rankGroup || '').trim();
            const subMatch = rg.match(/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i);
            if (subMatch) return subMatch[1].toUpperCase();
            const longMatch = rg.match(/\((IV|III|II|I)\//i);
            if (longMatch) return longMatch[1].toUpperCase();
            return 'lainnya';
          };
          const pns_I   = emps.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'I').length;
          const pns_II  = emps.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'II').length;
          const pns_III = emps.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'III').length;
          const pns_IV  = emps.filter(e => isPnsOrCpns(e) && getPnsGolongan(String(e.rank_group || '')) === 'IV').length;
          const jumlah_pns = emps.filter(e => isPnsOrCpns(e)).length;

          // Hitung PPPK per golongan: III, V, VII, IX
          const isPppk = (e: typeof allEmp[0]) => normalizeAsnStatus(e.asn_status) === 'PPPK';
          const getPppkGolongan = (rankGroup: string): string => {
            const rg = String(rankGroup || '').trim().toUpperCase();
            if (rg === 'III') return 'III';
            if (rg === 'V')   return 'V';
            if (rg === 'VII') return 'VII';
            if (rg === 'IX')  return 'IX';
            return 'lainnya';
          };
          const pppk_III = emps.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'III').length;
          const pppk_V   = emps.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'V').length;
          const pppk_VII = emps.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'VII').length;
          const pppk_IX  = emps.filter(e => isPppk(e) && getPppkGolongan(String(e.rank_group || '')) === 'IX').length;
          const jumlah_pppk = emps.filter(e => isPppk(e)).length;

          const total_asn = jumlah_pns + jumlah_pppk;

          // Hitung jenis kelamin
          const countedAsnEmps = emps.filter(e => isPnsOrCpns(e) || isPppk(e));
          const L = countedAsnEmps.filter(e => normalizeGender(e.gender) === 'Laki-laki').length;
          const P = countedAsnEmps.filter(e => normalizeGender(e.gender) === 'Perempuan').length;

          golonganRows.push({
            'No': idx + 1,
            'Unit Kerja': dept,
            'PNS I': pns_I,
            'PNS II': pns_II,
            'PNS III': pns_III,
            'PNS IV': pns_IV,
            'Jumlah PNS': jumlah_pns,
            'PPPK III': pppk_III,
            'PPPK V': pppk_V,
            'PPPK VII': pppk_VII,
            'PPPK IX': pppk_IX,
            'Jumlah PPPK': jumlah_pppk,
            'Total ASN': total_asn,
            'L': L,
            'P': P,
            'Total JK': L + P,
          });

          totals.pns_I   += pns_I;
          totals.pns_II  += pns_II;
          totals.pns_III += pns_III;
          totals.pns_IV  += pns_IV;
          totals.jumlah_pns  += jumlah_pns;
          totals.pppk_III += pppk_III;
          totals.pppk_V   += pppk_V;
          totals.pppk_VII += pppk_VII;
          totals.pppk_IX  += pppk_IX;
          totals.jumlah_pppk += jumlah_pppk;
          totals.total   += total_asn;
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
          'Jumlah PNS': totals.jumlah_pns,
          'PPPK III': totals.pppk_III,
          'PPPK V': totals.pppk_V,
          'PPPK VII': totals.pppk_VII,
          'PPPK IX': totals.pppk_IX,
          'Jumlah PPPK': totals.jumlah_pppk,
          'Total ASN': totals.total,
          'L': totals.L,
          'P': totals.P,
          'Total JK': totals.L + totals.P,
        });

        const wsGolongan = XLSX.utils.json_to_sheet(golonganRows);
        wsGolongan['!cols'] = [
          { wch: 5 },  // No
          { wch: 32 }, // Unit Kerja
          { wch: 8 },  // PNS I
          { wch: 8 },  // PNS II
          { wch: 8 },  // PNS III
          { wch: 8 },  // PNS IV
          { wch: 12 }, // Jumlah PNS
          { wch: 9 },  // PPPK III
          { wch: 9 },  // PPPK V
          { wch: 9 },  // PPPK VII
          { wch: 9 },  // PPPK IX
          { wch: 13 }, // Jumlah PPPK
          { wch: 11 }, // Total ASN
          { wch: 6 },  // L
          { wch: 6 },  // P
          { wch: 10 }, // Total JK
        ];
        
        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Tabel Golongan per Unit
        // ═══════════════════════════════════════════════════════════════════════
        const golBorderStyle = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        };

        const golHeaderStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: golBorderStyle,
        };

        const golDataStyle = {
          alignment: { vertical: 'center', horizontal: 'center' },
          border: golBorderStyle,
        };

        const golTotalStyle = {
          fill: { fgColor: { rgb: 'FFF2CC' } }, // Light yellow
          font: { bold: true },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: golBorderStyle,
        };

        // Apply styling
        const golRange = XLSX.utils.decode_range(wsGolongan['!ref'] || 'A1');
        const lastRow = golRange.e.r;
        
        for (let R = golRange.s.r; R <= golRange.e.r; ++R) {
          for (let C = golRange.s.c; C <= golRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            
            // Only style existing cells
            if (wsGolongan[cellAddress] && wsGolongan[cellAddress].v !== undefined) {
              // Header row
              if (R === 0) {
                wsGolongan[cellAddress].s = golHeaderStyle;
              }
              // Last row (JUMLAH)
              else if (R === lastRow) {
                wsGolongan[cellAddress].s = golTotalStyle;
              }
              // Data rows
              else {
                wsGolongan[cellAddress].s = golDataStyle;
              }
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, wsGolongan, 'Tabel Golongan per Unit');
        
        // Pindahkan sheet ini ke posisi setelah SUMMARY (posisi index 1)
        const golonganSheetName = 'Tabel Golongan per Unit';
        const golonganIndex = wb.SheetNames.indexOf(golonganSheetName);
        if (golonganIndex > -1) {
          wb.SheetNames.splice(golonganIndex, 1);
          wb.SheetNames.splice(1, 0, golonganSheetName);
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SHEET 2: Tabel Pendidikan per Unit Kerja
      // ═══════════════════════════════════════════════════════════════════════
      if (sortedDepts.length > 0) {
        const EDU_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
        const EDU_LABELS = ['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];

        // Generate dynamic month and year
        const now = new Date();
        const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
                           'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        const currentMonth = monthNames[now.getMonth()];
        const currentYear = now.getFullYear();
        const titleText = `REKAP PEGAWAI DITJEN BULAN ${currentMonth} ${currentYear}`;
        const subtitleText = 'Dukungan Personil Berdasarkan Tingkat Pendidikan';

        type ExcelRow = (string | number)[];
        const dataRows: ExcelRow[] = [];
        const eduTotals: Record<string, number> = { total: 0 };
        EDU_LABELS.forEach(l => { eduTotals[l] = 0; });

        sortedDepts.forEach((dept, idx) => {
          const emps = deptEmpMap.get(dept) || [];
          // Hanya ASN (exclude Non ASN)
          const asnEmps = emps.filter(e => normalizeAsnStatus(e.asn_status) !== 'Non ASN');
          const total = asnEmps.length;

          const row: ExcelRow = [idx + 1, dept, total];

          EDU_LEVELS.forEach((level, i) => {
            const count = asnEmps.filter(e => {
              const edu = extractEducationLevelFromMap(e.id);
              return edu === level;
            }).length;
            row.push(count);
            eduTotals[EDU_LABELS[i]] = (eduTotals[EDU_LABELS[i]] || 0) + count;
          });

          row.push(total); // JML PEG kedua
          eduTotals['total'] += total;
          dataRows.push(row);
        });

        // Baris JUMLAH
        const jumlahRow: ExcelRow = ['', 'JUMLAH', eduTotals['total']];
        EDU_LABELS.forEach(l => { jumlahRow.push(eduTotals[l]); });
        jumlahRow.push(eduTotals['total']); // JML PEG kedua
        dataRows.push(jumlahRow);

        // Build worksheet using aoa_to_sheet
        const aoaData: ExcelRow[] = [
          [titleText],
          [subtitleText],
          ['NO.', 'UNIT KERJA', 'JML PEG', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'JML PEG'],
          ...dataRows
        ];

        const wsEdu = XLSX.utils.aoa_to_sheet(aoaData);
        wsEdu['!cols'] = [
          { wch: 5 },  // NO.
          { wch: 32 }, // UNIT KERJA
          { wch: 8 },  // JML PEG
          { wch: 6 },  // SD
          { wch: 6 },  // SMP
          { wch: 6 },  // SMA
          { wch: 6 },  // D1
          { wch: 6 },  // D2
          { wch: 6 },  // D3
          { wch: 6 },  // D4
          { wch: 6 },  // S1
          { wch: 6 },  // S2
          { wch: 6 },  // S3
          { wch: 8 },  // JML PEG
        ];
        wsEdu['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
        ];
        
        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Tabel Pendidikan per Unit
        // ═══════════════════════════════════════════════════════════════════════
        const eduBorderStyle = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        };

        const eduTitleStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: eduBorderStyle,
        };

        const eduSubtitleStyle = {
          fill: { fgColor: { rgb: '5B9BD5' } }, // Light blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: eduBorderStyle,
        };

        const eduHeaderStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: eduBorderStyle,
        };

        const eduDataStyle = {
          alignment: { vertical: 'center', horizontal: 'center' },
          border: eduBorderStyle,
        };

        const eduTotalStyle = {
          fill: { fgColor: { rgb: 'FFF2CC' } }, // Light yellow
          font: { bold: true },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: eduBorderStyle,
        };

        // Apply styling
        const eduRange = XLSX.utils.decode_range(wsEdu['!ref'] || 'A1');
        const lastEduRow = eduRange.e.r;
        
        for (let R = eduRange.s.r; R <= eduRange.e.r; ++R) {
          for (let C = eduRange.s.c; C <= eduRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            
            // Only style existing cells
            if (wsEdu[cellAddress] && wsEdu[cellAddress].v !== undefined) {
              // Title row (row 0)
              if (R === 0) {
                wsEdu[cellAddress].s = eduTitleStyle;
              }
              // Subtitle row (row 1)
              else if (R === 1) {
                wsEdu[cellAddress].s = eduSubtitleStyle;
              }
              // Header row (row 2)
              else if (R === 2) {
                wsEdu[cellAddress].s = eduHeaderStyle;
              }
              // Last row (JUMLAH)
              else if (R === lastEduRow) {
                wsEdu[cellAddress].s = eduTotalStyle;
              }
              // Data rows
              else {
                wsEdu[cellAddress].s = eduDataStyle;
              }
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, wsEdu, 'Tabel Pendidikan per Unit');
        
        // Pindahkan sheet ini ke posisi setelah Tabel Golongan (posisi index 2)
        const eduSheetName = 'Tabel Pendidikan per Unit';
        const eduIndex = wb.SheetNames.indexOf(eduSheetName);
        if (eduIndex > -1) {
          wb.SheetNames.splice(eduIndex, 1);
          wb.SheetNames.splice(2, 0, eduSheetName);
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SHEET 3: Jumlah ASN per Unit Kerja
      // ═══════════════════════════════════════════════════════════════════════
      if (sortedDepts.length > 0) {
        const asnRows: Record<string, string | number>[] = [];
        let totalAsn = 0;
        let totalNonAsn = 0;
        let totalAll = 0;

        sortedDepts.forEach((dept, idx) => {
          const emps = deptEmpMap.get(dept) || [];
          
          // Hitung ASN (PNS + CPNS + PPPK)
          const asnCount = emps.filter(e => {
            const status = normalizeAsnStatus(e.asn_status);
            return status === 'PNS' || status === 'CPNS' || status === 'PPPK';
          }).length;
          
          // Hitung Non ASN / Outsourcing
          const nonAsnCount = emps.filter(e => {
            const status = normalizeAsnStatus(e.asn_status);
            return status === 'Non ASN';
          }).length;
          
          const total = asnCount + nonAsnCount;

          asnRows.push({
            'No': idx + 1,
            'Nama Unit kerja': dept,
            'JUMLAH ASN (PNS + CPNS + PPPK)': asnCount,
            'Jumlah Tenaga Non ASN / Outsourcing': nonAsnCount,
            'Jumlah ASN dan Tenaga Non ASN': total,
          });

          totalAsn += asnCount;
          totalNonAsn += nonAsnCount;
          totalAll += total;
        });

        // Baris JUMLAH
        asnRows.push({
          'No': '',
          'Nama Unit kerja': 'JUMLAH',
          'JUMLAH ASN (PNS + CPNS + PPPK)': totalAsn,
          'Jumlah Tenaga Non ASN / Outsourcing': totalNonAsn,
          'Jumlah ASN dan Tenaga Non ASN': totalAll,
        });

        const wsAsnSummary = XLSX.utils.json_to_sheet(asnRows);
        wsAsnSummary['!cols'] = [
          { wch: 5 },  // No
          { wch: 32 }, // Nama Unit kerja
          { wch: 28 }, // JUMLAH ASN (PNS + CPNS + PPPK)
          { wch: 35 }, // Jumlah Tenaga Non ASN / Outsourcing
          { wch: 30 }, // Jumlah ASN dan Tenaga Non ASN
        ];
        
        // ═══════════════════════════════════════════════════════════════════════
        // STYLING: Jumlah ASN per Unit
        // ═══════════════════════════════════════════════════════════════════════
        const asnBorderStyle = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        };

        const asnHeaderStyle = {
          fill: { fgColor: { rgb: '4472C4' } }, // Blue
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: asnBorderStyle,
        };

        const asnDataStyle = {
          alignment: { vertical: 'center', horizontal: 'center' },
          border: asnBorderStyle,
        };

        const asnTotalStyle = {
          fill: { fgColor: { rgb: 'FFF2CC' } }, // Light yellow
          font: { bold: true },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: asnBorderStyle,
        };

        // Apply styling
        const asnRange = XLSX.utils.decode_range(wsAsnSummary['!ref'] || 'A1');
        const lastAsnRow = asnRange.e.r;
        
        for (let R = asnRange.s.r; R <= asnRange.e.r; ++R) {
          for (let C = asnRange.s.c; C <= asnRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            
            // Only style existing cells
            if (wsAsnSummary[cellAddress] && wsAsnSummary[cellAddress].v !== undefined) {
              // Header row
              if (R === 0) {
                wsAsnSummary[cellAddress].s = asnHeaderStyle;
              }
              // Last row (JUMLAH)
              else if (R === lastAsnRow) {
                wsAsnSummary[cellAddress].s = asnTotalStyle;
              }
              // Data rows
              else {
                wsAsnSummary[cellAddress].s = asnDataStyle;
              }
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, wsAsnSummary, 'Jumlah ASN per Unit');
        
        // Pindahkan sheet ini ke posisi setelah Tabel Pendidikan (posisi index 3)
        const asnSheetName = 'Jumlah ASN per Unit';
        const asnIndex = wb.SheetNames.indexOf(asnSheetName);
        if (asnIndex > -1) {
          wb.SheetNames.splice(asnIndex, 1);
          wb.SheetNames.splice(3, 0, asnSheetName);
        }
      }

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      XLSX.writeFile(wb, `Peta_Jabatan_ASN_Semua_Unit_${today}.xlsx`);

      toast({
        title: 'Export Berhasil',
        description: `${wb.SheetNames.length} worksheet berhasil di-export (${depts.length} unit kerja + 4 sheet agregasi).`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      toast({ variant: 'destructive', title: 'Export Gagal', description: msg });
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExportSummaryNonASN = () => {
    const wb = XLSX.utils.book_new();

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
        setColumnWidths(ws1, [5, 35, 14, 16, 10, 14]);
        applyWorksheetStyling(ws1, { headerRow: 0 });
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
      const normName = normalizeString(posName);
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
    setColumnWidths(ws2, canViewAll 
      ? [5, 35, 14, 16, 10, 12]
      : [5, 35, 14, 16, 10]
    );
    applyWorksheetStyling(ws2, { headerRow: 0 });
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
    setColumnWidths(ws3, [5, 20, 14, 12]);
    // Apply styling with last row as total row
    applyWorksheetStyling(ws3, {
      headerRow: 0,
      totalRows: [3], // Row 3 is the TOTAL row (0=header, 1-2=data, 3=total)
    });
    XLSX.utils.book_append_sheet(wb, ws3, 'Summary per Type');

    // Generate filename based on role
    const filename = canViewAll 
      ? `Summary_Non_ASN_Semua_Unit.xlsx`
      : `Summary_Non_ASN_${(profile?.department || selectedDepartment).replace(/\s/g, '_')}.xlsx`;
    
    XLSX.writeFile(wb, filename, {
      bookType: 'xlsx',
      compression: true
    });
    
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
  }, [groupsData, getMatchingEmployees]);

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
            {showDepartmentFilter && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger id="department-filter" className="w-full sm:w-[240px]">
                  <SelectValue>
                    {selectedDepartment || "Pilih Unit Kerja"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accessibleDepartments.map(d => (
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
              <>
                <Button
                  variant="outline"
                  onClick={handleFixPositionOrder}
                  disabled={isLoading || positions.length === 0}
                  className="text-xs sm:text-sm"
                  title="Perbaiki urutan semua jabatan berdasarkan urutan tampil saat ini"
                >
                  <span className="hidden sm:inline">Perbaiki Urutan</span><span className="sm:hidden">Urutan</span>
                </Button>
                <Button onClick={openAddModal} className="text-xs sm:text-sm" disabled={isReadOnlyMode || !canEdit}>
                  <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Jabatan</span><span className="sm:hidden">Tambah</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn' | 'summary-asn' | 'summary-non-asn')} className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="asn" className="flex-1 min-w-0">
              <span className="hidden sm:inline">Peta Jabatan ASN</span>
              <span className="sm:hidden">ASN</span>
              <span className="ml-1.5 text-xs hidden md:inline">({positions.length} jabatan, {employees.length} pegawai)</span>
            </TabsTrigger>
            <TabsTrigger value="non-asn" className="flex-1 min-w-0">
              <span className="hidden sm:inline">Formasi Non-ASN</span>
              <span className="sm:hidden">Non-ASN</span>
              <span className="ml-1.5 text-xs hidden md:inline">
                ({(() => {
                  const uniquePositions = new Set(nonAsnEmployees.map(e => e.position_name || 'Tidak Ada Jabatan'));
                  return uniquePositions.size;
                })()} jabatan, {nonAsnEmployees.length} pegawai)
              </span>
            </TabsTrigger>
            <TabsTrigger value="summary-asn" className="flex-1 min-w-0">
              <span className="hidden sm:inline">Summary ASN</span>
              <span className="sm:hidden">Sum. ASN</span>
            </TabsTrigger>
            <TabsTrigger value="summary-non-asn" className="flex-1 min-w-0">
              <span className="hidden sm:inline">Summary Non-ASN</span>
              <span className="sm:hidden">Sum. Non-ASN</span>
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

                    {/* Export Semua Unit (hanya untuk Admin Pusat / Pimpinan) */}
                    {canViewAll && (
                      <Button
                        variant="default"
                        onClick={handleExportAllDepartments}
                        disabled={isExportingAll}
                        className="text-xs sm:text-sm whitespace-nowrap"
                        title="Export peta jabatan ASN semua unit kerja dalam 1 file Excel (1 sheet per unit)"
                      >
                        {isExportingAll ? (
                          <RefreshCw className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-1 sm:mr-2 h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {isExportingAll ? 'Memproses...' : 'Export Semua Unit'}
                        </span>
                        <span className="sm:hidden">
                          {isExportingAll ? '...' : 'Semua'}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
          <CardContent>
            {/* Banner: Satpel read-only mode */}
            {isReadOnlyMode && effectiveDepartment && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>
                  Peta jabatan untuk <strong>{selectedDepartment}</strong> menginduk ke{' '}
                  <strong>{effectiveDepartment}</strong>. Pengelolaan jabatan dilakukan di unit pembina.
                </span>
              </div>
            )}
            {/* Banner: Satpel not found in mapping */}
            {isSatpelOrWorkshop(selectedDepartment) && !effectiveDepartment && (
              <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Unit pembina tidak ditemukan</p>
                  <p className="text-sm text-red-600">
                    Unit <strong>{selectedDepartment}</strong> tidak memiliki unit pembina yang terdaftar.{' '}
                    Hubungi admin pusat untuk konfigurasi.
                  </p>
                </div>
              </div>
            )}
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
                        const categoryPositions = groupsData[row.category!] || [];
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
                          <TableCell className="text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span>{fullName}</span>
                              {emp?.additional_position && (
                                <span className={cn(
                                  'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit',
                                  emp.additional_position.toUpperCase().includes('PLT')
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                )}>
                                  {emp.additional_position}
                                </span>
                              )}
                              {emp?.satuan_kerja_penugasan && (
                                <SatpelBadge satpelName={emp.satuan_kerja_penugasan} />
                              )}
                            </div>
                          </TableCell>
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
                                  <DropdownMenuItem onClick={() => openEditModal(pos)} disabled={isReadOnlyMode}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Jabatan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(pos.id)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isReadOnlyMode}
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
                  ) : hasSupervisedUnits ? (
                    <>
                      Summary Peta Jabatan ASN - {profile?.department}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Unit pembina + {getSatpelsByPembina(profile?.department || '').length} unit binaan)
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
                {canViewAll && (
                  <Button
                    variant="default"
                    onClick={handleExportAllDepartments}
                    disabled={isExportingAll || allPositions.length === 0}
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Download className="mr-1 sm:mr-2 h-4 w-4" />
                    {isExportingAll
                      ? 'Memproses...'
                      : <><span className="hidden sm:inline">Export Semua Unit (Multi-Sheet)</span><span className="sm:hidden">Export Semua</span></>
                    }
                  </Button>
                )}
              </div>

              {/* Summary Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
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

                {/* Unit Kerja Filter - for Admin Pusat/Pimpinan AND Admin Unit Pembina */}
                {showDepartmentFilter && (
                  <Select value={summaryFilterUnit} onValueChange={setSummaryFilterUnit}>
                    <SelectTrigger id="summary-unit-filter" className="w-full sm:w-[220px]">
                      <SelectValue placeholder="Semua Unit Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit Kerja</SelectItem>
                      {accessibleDepartments.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

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
                    const categoryPositions = allPositions.filter(p => {
                      const matchCategory = p.position_category === category;
                      const matchUnit = !canViewAll || summaryFilterUnit === 'all' || p.department === summaryFilterUnit;
                      return matchCategory && matchUnit;
                    });
                    const totalAbk = categoryPositions.reduce((sum, p) => sum + p.abk_count, 0);
                    
                    // Count existing employees for this category
                    const positionNames = new Set(categoryPositions.map(p => normalizeString(p.position_name)));
                    const totalExisting = allEmployees.filter(emp => {
                      const matchUnit = !canViewAll || summaryFilterUnit === 'all' || emp.department === summaryFilterUnit;
                      return matchUnit && emp.position_name && positionNames.has(normalizeString(emp.position_name));
                    }).length;
                    
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

                {/* Summary Table by Department - Only show for Admin Pusat/Pimpinan when no specific unit is selected */}
                {canViewAll && summaryFilterUnit === 'all' && (
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
                                
                                const positionNames = new Set(deptPositions.map(p => normalizeString(p.position_name)));
                                const totalExisting = allEmployees.filter(emp => 
                                  emp.department === dept && emp.position_name && positionNames.has(normalizeString(emp.position_name))
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
                  <h3 className="text-sm font-semibold">
                    Summary per Jabatan
                    {canViewAll && summaryFilterUnit !== 'all' && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        — {summaryFilterUnit}
                      </span>
                    )}
                  </h3>
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
                          
                          // Group positions by normalized name across all departments (or filtered unit)
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
                            // Apply unit filter
                            if (canViewAll && summaryFilterUnit !== 'all' && pos.department !== summaryFilterUnit) {
                              return;
                            }

                            const normName = normalizeString(pos.position_name);
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

                          // Count existing employees per position (respecting unit filter)
                          allEmployees.forEach(emp => {
                            if (emp.position_name) {
                              // Apply unit filter on employees too
                              if (canViewAll && summaryFilterUnit !== 'all' && emp.department !== summaryFilterUnit) {
                                return;
                              }
                              const normName = normalizeString(emp.position_name);
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
                                  if (normalizeString(emp.position_name) !== normalizeString(item.displayName)) return false;
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
                            
                            // Get employees for this position (respecting unit filter)
                            const positionEmployees = allEmployees.filter(emp => {
                              if (!emp.position_name) return false;
                              if (canViewAll && summaryFilterUnit !== 'all' && emp.department !== summaryFilterUnit) return false;
                              return normalizeString(emp.position_name) === normalizeString(item.displayName);
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
                  ) : hasSupervisedUnits ? (
                    <>
                      Summary Pegawai Non-ASN - {profile?.department}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (Unit pembina + {getSatpelsByPembina(profile?.department || '').length} unit binaan)
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
                  
                  {/* Unit Kerja Filter - for Admin Pusat/Pimpinan AND Admin Unit Pembina */}
                  {showDepartmentFilter && (
                    <Select value={summaryNonAsnFilterUnit} onValueChange={setSummaryNonAsnFilterUnit}>
                      <SelectTrigger id="summary-non-asn-unit-filter" className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Semua Unit Kerja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Unit Kerja</SelectItem>
                        {accessibleDepartments.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
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
                      <div className="text-2xl font-bold">
                        {allNonAsnEmployees.filter(e => !canViewAll || summaryNonAsnFilterUnit === 'all' || e.department === summaryNonAsnFilterUnit).length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {canViewAll && summaryNonAsnFilterUnit !== 'all' ? summaryNonAsnFilterUnit : canViewAll ? 'Dari semua unit kerja' : 'Di unit kerja Anda'}
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
                      {(() => {
                        const filtered = allNonAsnEmployees.filter(e => !canViewAll || summaryNonAsnFilterUnit === 'all' || e.department === summaryNonAsnFilterUnit);
                        const count = filtered.filter(e => e.rank_group === 'Tenaga Alih Daya' || !e.rank_group).length;
                        return (
                          <>
                            <div className="text-2xl font-bold">{count}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {((count / (filtered.length || 1)) * 100).toFixed(1)}% dari total
                            </p>
                          </>
                        );
                      })()}
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
                      {(() => {
                        const filtered = allNonAsnEmployees.filter(e => !canViewAll || summaryNonAsnFilterUnit === 'all' || e.department === summaryNonAsnFilterUnit);
                        const count = filtered.filter(e => e.rank_group && e.rank_group !== 'Tenaga Alih Daya').length;
                        return (
                          <>
                            <div className="text-2xl font-bold">{count}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {((count / (filtered.length || 1)) * 100).toFixed(1)}% dari total
                            </p>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Table: Summary Non-ASN per Unit (only for Admin Pusat/Pimpinan, only when no specific unit selected) */}
                {canViewAll && summaryNonAsnFilterUnit === 'all' && allNonAsnEmployees.length > 0 && (
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
                    <h3 className="text-sm font-semibold">
                      Summary per Jabatan
                      {canViewAll && summaryNonAsnFilterUnit !== 'all' && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          — {summaryNonAsnFilterUnit}
                        </span>
                      )}
                    </h3>
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
                            {canViewAll && summaryNonAsnFilterUnit === 'all' && <TableHead className="text-center">Jumlah Unit</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Group Non-ASN by position (respecting unit filter)
                            const positionGroups = new Map<string, {
                              displayName: string;
                              total: number;
                              tenagaAlihDaya: number;
                              lainnya: number;
                              departments: Set<string>;
                              employees: EmployeeMatch[];
                            }>();

                            allNonAsnEmployees
                              .filter(emp => !canViewAll || summaryNonAsnFilterUnit === 'all' || emp.department === summaryNonAsnFilterUnit)
                              .forEach(emp => {
                              const posName = emp.position_name || 'Tidak Ada Jabatan';
                              const normName = normalizeString(posName);
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
                                  <TableCell colSpan={canViewAll && summaryNonAsnFilterUnit === 'all' ? 7 : 6} className="text-center py-8 text-muted-foreground">
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
                                  {canViewAll && summaryNonAsnFilterUnit === 'all' && <TableCell className="text-center">{pos.departments.size}</TableCell>}
                                </TableRow>
                              );

                              // Expanded rows showing employees
                              if (isExpanded && positionEmployees.length > 0) {
                                rows.push(
                                  <TableRow key={`${normName}-expanded`} className="bg-muted/20">
                                    <TableCell colSpan={canViewAll && summaryNonAsnFilterUnit === 'all' ? 7 : 6} className="p-0">
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
              <Select
                value={formCategory}
                onValueChange={cat => {
                  setFormCategory(cat);
                  // Saat tambah baru, auto-update urutan sesuai kategori yang dipilih
                  if (!editingPosition) {
                    const nextOrder = positions
                      .filter(p => p.position_category === cat)
                      .reduce((max, p) => Math.max(max, p.position_order), 0) + 1;
                    setFormOrder(nextOrder.toString());
                  }
                }}
              >
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
                <Label>
                  Urutan
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    (dalam kategori)
                  </span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={(() => {
                    const count = positions.filter(p =>
                      p.position_category === formCategory &&
                      p.id !== editingPosition?.id
                    ).length + 1;
                    return count;
                  })()}
                  value={formOrder}
                  onChange={e => setFormOrder(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const count = positions.filter(p =>
                      p.position_category === formCategory &&
                      p.id !== editingPosition?.id
                    ).length + 1;
                    return `Urutan 1–${count} dalam ${formCategory}. Jabatan lain akan digeser otomatis.`;
                  })()}
                </p>
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

      {/* Delete Non-ASN Confirmation Dialog */}
      <Dialog open={isDeleteNonAsnOpen} onOpenChange={setIsDeleteNonAsnOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pegawai Non-ASN</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus pegawai{' '}
            <span className="font-semibold text-foreground">{deleteNonAsnTarget?.name}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteNonAsnOpen(false); setDeleteNonAsnTarget(null); }}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNonAsnEmployee}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
