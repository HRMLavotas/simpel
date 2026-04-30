import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MoreVertical, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton-screens';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeFormModal, type EmployeeFormData } from '@/components/employees/EmployeeFormModal';
import { NonAsnFormModal } from '@/components/employees/NonAsnFormModal';
import { DeleteConfirmDialog } from '@/components/employees/DeleteConfirmDialog';
import { ChangeLogDialog, type DetectedChange } from '@/components/employees/ChangeLogDialog';
import { EmployeeDetailsModal } from '@/components/employees/EmployeeDetailsModal';
import { DuplicateMutationDialog, type DuplicateEmployee } from '@/components/employees/DuplicateMutationDialog';
import { type EducationEntry } from '@/components/employees/EducationHistoryForm';
import { type HistoryEntry } from '@/components/employees/EmployeeHistoryForm';
import { type AdditionalPositionHistoryEntry } from '@/components/employees/AdditionalPositionHistoryForm';
import { type NoteEntry } from '@/components/employees/NotesForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ASN_STATUS_OPTIONS } from '@/lib/constants';
import { useDepartments } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { HistoryRowData, NoteData, Employee } from '@/types/employee';
import { createNotification } from '@/hooks/useNotifications';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 20;

const formatDisplayName = (emp: Employee) => {
  const parts: string[] = [];
  if (emp.front_title) parts.push(emp.front_title);
  parts.push(emp.name);
  if (emp.back_title) parts.push(emp.back_title);
  return parts.join(' ');
};

/** Detect meaningful field changes between old employee and new form data */
function detectChanges(oldEmp: Employee, newData: EmployeeFormData): DetectedChange[] {
  const changes: DetectedChange[] = [];
  const norm = (v: string | null | undefined) => (v || '').trim();

  if (norm(oldEmp.rank_group) !== norm(newData.rank_group)) {
    changes.push({
      field: 'rank_group', label: 'Pangkat/Golongan',
      oldValue: norm(oldEmp.rank_group), newValue: norm(newData.rank_group),
      historyType: 'rank',
    });
  }
  if (norm(oldEmp.position_name) !== norm(newData.position_name)) {
    changes.push({
      field: 'position_name', label: 'Nama Jabatan',
      oldValue: norm(oldEmp.position_name), newValue: norm(newData.position_name),
      historyType: 'position',
    });
  }
  if (norm(oldEmp.position_type) !== norm(newData.position_type)) {
    changes.push({
      field: 'position_type', label: 'Jenis Jabatan',
      oldValue: norm(oldEmp.position_type), newValue: norm(newData.position_type),
      historyType: 'position',
    });
  }
  if (norm(oldEmp.department) !== norm(newData.department)) {
    changes.push({
      field: 'department', label: 'Unit Kerja (Mutasi)',
      oldValue: norm(oldEmp.department), newValue: norm(newData.department),
      historyType: 'mutation',
    });
  }
  if (norm(oldEmp.front_title) !== norm(newData.front_title)) {
    changes.push({
      field: 'front_title', label: 'Gelar Depan',
      oldValue: norm(oldEmp.front_title), newValue: norm(newData.front_title),
      historyType: 'title',
    });
  }
  if (norm(oldEmp.back_title) !== norm(newData.back_title)) {
    changes.push({
      field: 'back_title', label: 'Gelar Belakang',
      oldValue: norm(oldEmp.back_title), newValue: norm(newData.back_title),
      historyType: 'title',
    });
  }
  if (norm(oldEmp.asn_status) !== norm(newData.asn_status)) {
    changes.push({
      field: 'asn_status', label: 'Status ASN',
      oldValue: norm(oldEmp.asn_status), newValue: norm(newData.asn_status),
      historyType: 'general',
    });
  }

  return changes;
}

/** Isi nilai "lama" dari entry sebelumnya berdasarkan urutan tanggal ascending */
function inferOldValues(
  rows: HistoryEntry[],
  newField: string,
  oldField: string
): HistoryEntry[] {
  return rows.map((row, i) => {
    if (!row[oldField] && i > 0) {
      return { ...row, [oldField]: rows[i - 1][newField] || '' };
    }
    return row;
  });
}

export default function Employees() {
  const { profile, isAdminPusat, user, canEdit, canViewAll, role } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();
  
  const [activeTab, setActiveTab] = useState<'asn' | 'non-asn'>('asn');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Map urutan jabatan dari position_references: normalisedName → { categoryOrder, positionOrder, department }
  // Digunakan untuk mengurutkan pegawai persis seperti urutan di Peta Jabatan
  const [positionOrderMap, setPositionOrderMap] = useState<Map<string, { categoryOrder: number; positionOrder: number }>>(new Map());
  
  // Collapse state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'Struktural': false,
    'Fungsional': false,
    'Pelaksana': false,
    'Lainnya': false,
  });
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [nonAsnModalOpen, setNonAsnModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<EducationEntry[]>([]);
  const [selectedMutationHistory, setSelectedMutationHistory] = useState<HistoryEntry[]>([]);
  const [selectedPositionHistory, setSelectedPositionHistory] = useState<HistoryEntry[]>([]);
  const [selectedRankHistory, setSelectedRankHistory] = useState<HistoryEntry[]>([]);
  const [selectedCompetencyHistory, setSelectedCompetencyHistory] = useState<HistoryEntry[]>([]);
  const [selectedTrainingHistory, setSelectedTrainingHistory] = useState<HistoryEntry[]>([]);
  const [selectedPlacementNotes, setSelectedPlacementNotes] = useState<NoteEntry[]>([]);
  const [selectedAssignmentNotes, setSelectedAssignmentNotes] = useState<NoteEntry[]>([]);
  const [selectedChangeNotes, setSelectedChangeNotes] = useState<NoteEntry[]>([]);
  const [selectedAdditionalPositionHistory, setSelectedAdditionalPositionHistory] = useState<AdditionalPositionHistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change log dialog state
  const [changeLogOpen, setChangeLogOpen] = useState(false);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [pendingFormData, setPendingFormData] = useState<EmployeeFormData | null>(null);

  // Duplicate mutation dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateEmployee, setDuplicateEmployee] = useState<DuplicateEmployee | null>(null);
  const [pendingMutationData, setPendingMutationData] = useState<{
    data: EmployeeFormData;
    changes: DetectedChange[];
    notes: string;
    link: string;
    effectiveDate: string;
    finalDepartment: string;
  } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [profile, canViewAll]);

  const fetchEmployees = async (skipIfModalOpen = false) => {
    // Skip refresh if modal is open and user is editing
    if (skipIfModalOpen && (formModalOpen || nonAsnModalOpen || changeLogOpen)) {
      logger.debug('Skipping fetchEmployees - modal is open');
      return;
    }
    
    if (!profile) return;
    setIsLoading(true);
    logger.debug('=== FETCHING EMPLOYEES ===');
    try {
      // Fetch position_references untuk membangun urutan jabatan persis seperti Peta Jabatan
      // Key: "department|||normName" agar setiap unit punya urutan jabatan sendiri
      const CATEGORY_ORDER: Record<string, number> = { 'Struktural': 1, 'Fungsional': 2, 'Pelaksana': 3 };
      const posOrderMap = new Map<string, { categoryOrder: number; positionOrder: number }>();

      let posOffset = 0;
      while (true) {
        let posQuery = supabase
          .from('position_references')
          .select('position_name, position_category, position_order, department')
          .range(posOffset, posOffset + 999);

        // Admin unit hanya perlu urutan jabatan unit mereka sendiri
        if (!canViewAll && profile.department) {
          posQuery = posQuery.eq('department', profile.department);
        }

        const { data: posBatch, error: posError } = await posQuery
          .order('position_category')
          .order('position_order');

        if (posError) throw posError;
        if (!posBatch || posBatch.length === 0) break;

        posBatch.forEach(pos => {
          // Key per unit + nama jabatan agar urutan tiap unit independen
          const deptKey = `${pos.department}|||${pos.position_name.trim().toLowerCase()}`;
          const catOrder = CATEGORY_ORDER[pos.position_category] ?? 99;
          posOrderMap.set(deptKey, { categoryOrder: catOrder, positionOrder: pos.position_order });
        });

        if (posBatch.length < 1000) break;
        posOffset += 1000;
      }

      setPositionOrderMap(posOrderMap);

      // Fetch employees - filter by department for admin_unit (RLS handles this server-side too)
      const allData: Employee[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        let query = supabase
          .from('employees')
          .select('*')
          .range(offset, offset + batchSize - 1)
          .order('department')
          .order('name');

        // For admin_unit, restrict to their department (belt-and-suspenders with RLS)
        if (!canViewAll && profile.department) {
          query = query.eq('department', profile.department);
        }

        const { data: batch, error } = await query;
        
        if (error) throw error;
        
        if (!batch || batch.length === 0) break;
        allData.push(...batch);
        
        if (batch.length < batchSize) break;
        offset += batchSize;
      }
      
      // Sort pegawai persis seperti urutan Peta Jabatan:
      // 1. department (A-Z)
      // 2. position_category order (Struktural → Fungsional → Pelaksana → lainnya)
      // 3. position_order dari position_references (urutan jabatan dalam kategori, per unit)
      // 4. nama sebagai tiebreaker
      const sortedData = (allData || []).sort((a, b) => {
        // Sort by department first
        const deptCompare = (a.department || '').localeCompare(b.department || '');
        if (deptCompare !== 0) return deptCompare;

        // Lookup menggunakan key department + nama jabatan
        const deptA = (a.department || '').trim();
        const deptB = (b.department || '').trim();
        const normA = (a.position_name || '').trim().toLowerCase();
        const normB = (b.position_name || '').trim().toLowerCase();
        const posA = posOrderMap.get(`${deptA}|||${normA}`);
        const posB = posOrderMap.get(`${deptB}|||${normB}`);

        // Kategori order
        const catA = posA?.categoryOrder ?? 99;
        const catB = posB?.categoryOrder ?? 99;
        if (catA !== catB) return catA - catB;

        // Position order dalam kategori
        const ordA = posA?.positionOrder ?? 999999;
        const ordB = posB?.positionOrder ?? 999999;
        if (ordA !== ordB) return ordA - ordB;

        // Tiebreaker: nama
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setEmployees(sortedData);
      logger.debug('Employees state updated, count:', sortedData.length);
    } catch (error) {
      logger.error('Error fetching employees:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data pegawai' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter((emp) => {
      // Filter by active tab (ASN vs Non-ASN)
      const matchesTab = activeTab === 'asn' 
        ? emp.asn_status !== 'Non ASN' 
        : emp.asn_status === 'Non ASN';
      
      const displayName = formatDisplayName(emp).toLowerCase();
      const matchesSearch = 
        displayName.includes(searchQuery.toLowerCase()) ||
        (emp.nip && emp.nip.includes(searchQuery)) ||
        (emp.position_name && emp.position_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || emp.asn_status === statusFilter;
      const matchesDepartment = !canViewAll || departmentFilter === 'all' || emp.department === departmentFilter;
      return matchesTab && matchesSearch && matchesStatus && matchesDepartment;
    });
    
    logger.debug('=== FILTERED EMPLOYEES ===');
    logger.debug('Active tab:', activeTab);
    logger.debug('Total employees:', employees.length);
    logger.debug('Department filter:', departmentFilter);
    logger.debug('Filtered count:', filtered.length);
    
    return filtered;
  }, [employees, activeTab, searchQuery, statusFilter, departmentFilter, canViewAll]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Group employees by position_type for display with category headers
  const groupedEmployees = useMemo(() => {
    const groups: { category: string; employees: Employee[] }[] = [];
    let currentCategory = '';
    let currentGroup: Employee[] = [];

    paginatedEmployees.forEach((emp) => {
      const category = emp.position_type || 'Lainnya';
      
      if (category !== currentCategory) {
        // Save previous group if exists
        if (currentGroup.length > 0) {
          groups.push({ category: currentCategory, employees: currentGroup });
        }
        // Start new group
        currentCategory = category;
        currentGroup = [emp];
      } else {
        currentGroup.push(emp);
      }
    });

    // Add last group
    if (currentGroup.length > 0) {
      groups.push({ category: currentCategory, employees: currentGroup });
    }

    return groups;
  }, [paginatedEmployees]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, statusFilter, departmentFilter]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setSelectedEducation([]);
    setSelectedMutationHistory([]);
    setSelectedPositionHistory([]);
    setSelectedRankHistory([]);
    setSelectedCompetencyHistory([]);
    setSelectedTrainingHistory([]);
    setSelectedPlacementNotes([]);
    setSelectedAssignmentNotes([]);
    setSelectedChangeNotes([]);
    
    // Open appropriate modal based on active tab
    if (activeTab === 'non-asn') {
      setNonAsnModalOpen(true);
    } else {
      setFormModalOpen(true);
    }
  };

  const mapHistoryRows = (data: HistoryRowData[], fields: string[]): HistoryEntry[] => {
    return (data || []).map((d) => {
      const entry: HistoryEntry = { id: d.id };
      fields.forEach(f => { 
        const value = d[f];
        entry[f] = value?.toString() || ''; 
      });
      return entry;
    });
  };

  const handleEditEmployee = async (employee: Employee) => {
    logger.debug('=== handleEditEmployee CALLED ===');
    logger.debug('Employee ID:', employee.id);
    logger.debug('Employee Name:', employee.name);
    logger.debug('Employee Rank Group:', employee.rank_group);
    logger.debug('Employee ASN Status:', employee.asn_status);
    logger.debug('Full Employee Object:', employee);
    
    setSelectedEmployee(employee);
    
    try {
      if (employee.asn_status === 'Non ASN') {
        setNonAsnModalOpen(true);
        return;
      }
      setFormModalOpen(true);
    } catch (error) {
      logger.error('Error opening edit form:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal membuka form edit' });
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = async (employee: Employee) => {
    setSelectedEmployee(employee);
    
    try {
      // Fetch all related data
      const [eduRes, mutRes, posRes, rankRes, compRes, trainRes, placementRes, assignmentRes, changeRes, additionalPosRes] = await Promise.all([
        supabase.from('education_history').select('*').eq('employee_id', employee.id).order('graduation_year', { ascending: true }),
        supabase.from('mutation_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
        supabase.from('position_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
        supabase.from('rank_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
        supabase.from('competency_test_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }),
        supabase.from('training_history').select('*').eq('employee_id', employee.id).order('tanggal_mulai', { ascending: true, nullsFirst: false }),
        supabase.from('placement_notes').select('*').eq('employee_id', employee.id).order('created_at', { ascending: true }),
        supabase.from('assignment_notes').select('*').eq('employee_id', employee.id).order('created_at', { ascending: true }),
        supabase.from('change_notes').select('*').eq('employee_id', employee.id).order('created_at', { ascending: true }),
        supabase.from('additional_position_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }),
      ]);

      setSelectedEducation(
        (eduRes.data || []).map((d: any) => ({
          id: d.id, level: d.level || '', institution_name: d.institution_name || '',
          major: d.major || '', graduation_year: d.graduation_year?.toString() || '',
          front_title: d.front_title || '', back_title: d.back_title || '',
        }))
      );
      setSelectedMutationHistory(inferOldValues(
        mapHistoryRows(mutRes.data || [], ['tanggal', 'dari_unit', 'ke_unit', 'jabatan', 'nomor_sk', 'keterangan']),
        'ke_unit', 'dari_unit'
      ));
      setSelectedPositionHistory(inferOldValues(
        mapHistoryRows(posRes.data || [], ['tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan']),
        'jabatan_baru', 'jabatan_lama'
      ));
      setSelectedRankHistory(inferOldValues(
        mapHistoryRows(rankRes.data || [], ['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']),
        'pangkat_baru', 'pangkat_lama'
      ));
      setSelectedCompetencyHistory(mapHistoryRows(compRes.data || [], ['tanggal', 'jenis_uji', 'hasil', 'keterangan']));
      setSelectedTrainingHistory(mapHistoryRows(trainRes.data || [], ['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']));
      
      setSelectedPlacementNotes((placementRes.data || []).map((d) => ({ id: d.id, note: d.note || '' })));
      setSelectedAssignmentNotes((assignmentRes.data || []).map((d) => ({ id: d.id, note: d.note || '' })));
      setSelectedChangeNotes((changeRes.data || []).map((d) => ({ id: d.id, note: d.note || '' })));
      setSelectedAdditionalPositionHistory(mapHistoryRows(additionalPosRes.data || [], ['tanggal', 'jabatan_tambahan_lama', 'jabatan_tambahan_baru', 'nomor_sk', 'tmt', 'keterangan']));
      
      logger.debug('=== NOTES DATA FOR DETAILS MODAL ===');
      logger.debug('Placement notes:', placementRes.data);
      logger.debug('Assignment notes:', assignmentRes.data);
      logger.debug('Change notes:', changeRes.data);
      
      setDetailsModalOpen(true);
    } catch (error) {
      logger.error('Error loading employee details:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat detail pegawai' });
    }
  };

  const saveHistoryEntries = async (
    tableName: string,
    employeeId: string,
    entries: HistoryEntry[] | undefined,
    fieldKeys: string[]
  ) => {
    if (!entries) return;
    
    logger.debug(`=== SAVING ${tableName} ===`);
    logger.debug('Entries to save:', entries);
    
    const rows = entries
      .filter(e => fieldKeys.some(k => e[k]))
      .filter(e => e.id !== '__current__') // Jangan simpan entry placeholder "Data saat ini"
      .map((e) => {
        const row: Record<string, string | number | null> = { employee_id: employeeId };
        fieldKeys.forEach(k => {
          row[k] = e[k] || null;
        });
        return row;
      });

    // Infer nilai "lama" dari entry sebelumnya jika kosong
    if (tableName === 'rank_history') {
      rows.forEach((row, i) => {
        if (!row.pangkat_lama && i > 0) {
          row.pangkat_lama = rows[i - 1].pangkat_baru || null;
        }
      });
    } else if (tableName === 'position_history') {
      rows.forEach((row, i) => {
        if (!row.jabatan_lama && i > 0) {
          row.jabatan_lama = rows[i - 1].jabatan_baru || null;
        }
      });
    } else if (tableName === 'mutation_history') {
      rows.forEach((row, i) => {
        if (!row.dari_unit && i > 0) {
          row.dari_unit = rows[i - 1].ke_unit || null;
        }
      });
    }
      
    logger.debug('Rows to insert:', rows);
    
    // Delete existing entries then insert new ones.
    // If delete succeeds but insert fails, we re-throw so the caller can handle it.
    const { error: deleteError } = await supabase
      .from(tableName as any)
      .delete()
      .eq('employee_id', employeeId);
    
    if (deleteError) {
      logger.error(`Error deleting ${tableName}:`, deleteError);
      throw deleteError;
    }
    
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from(tableName as any).insert(rows);
      if (insertError) {
        logger.error(`Error inserting ${tableName}:`, insertError);
        throw insertError;
      }
      logger.debug(`Successfully saved ${rows.length} entries to ${tableName}`);
    } else {
      logger.debug(`Cleared all entries from ${tableName} (no valid rows to insert)`);
    }
  };

  /** Auto-create history records based on detected changes */
  const createAutoHistoryRecords = async (
    employeeId: string,
    changes: DetectedChange[],
    notes: string,
    link: string,
    effectiveDate: string,
    existingRankHistory: HistoryEntry[],
    existingPositionHistory: HistoryEntry[],
    existingMutationHistory: HistoryEntry[],
  ) => {
    const keterangan = [notes, link].filter(Boolean).join('\nLampiran: ');

    for (const change of changes) {
      switch (change.historyType) {
        case 'rank': {
          // Skip jika sudah ada di manual history dengan nilai yang sama
          const alreadyInHistory = existingRankHistory.some(
            e => e.pangkat_baru === change.newValue
          );
          if (alreadyInHistory) break;
          await supabase.from('rank_history').insert({
            employee_id: employeeId,
            tanggal: effectiveDate,
            pangkat_lama: change.oldValue || null,
            pangkat_baru: change.newValue || null,
            keterangan: keterangan || null,
            tmt: effectiveDate,
          });
          break;
        }
        case 'position': {
          if (change.field !== 'position_name') break;
          const alreadyInHistory = existingPositionHistory.some(
            e => e.jabatan_baru === change.newValue
          );
          if (alreadyInHistory) break;
          await supabase.from('position_history').insert({
            employee_id: employeeId,
            tanggal: effectiveDate,
            jabatan_lama: change.oldValue || null,
            jabatan_baru: change.newValue || null,
            keterangan: keterangan || null,
          });
          break;
        }
        case 'mutation': {
          const alreadyInHistory = existingMutationHistory.some(
            e => e.ke_unit === change.newValue
          );
          if (alreadyInHistory) break;
          await supabase.from('mutation_history').insert({
            employee_id: employeeId,
            tanggal: effectiveDate,
            dari_unit: change.oldValue || null,
            ke_unit: change.newValue || null,
            keterangan: keterangan || null,
          });
          break;
        }
      }
    }
  };

  const executeSave = async (data: EmployeeFormData, changes: DetectedChange[], notes: string, link: string, effectiveDate: string) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Determine the latest department from mutation history
      let finalDepartment = data.department;
      let departmentChanged = false;
      
      if (data.mutation_history && data.mutation_history.length > 0) {
        const sortedMutations = [...data.mutation_history]
          .filter(m => m.tanggal && m.ke_unit)
          .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        
        if (sortedMutations.length > 0) {
          const newDepartment = sortedMutations[0].ke_unit || data.department;
          departmentChanged = !!(selectedEmployee && newDepartment !== selectedEmployee.department);
          finalDepartment = newDepartment;
        }
      }

      // --- DETEKSI DUPLIKAT SAAT MUTASI LINTAS UNIT ---
      if (departmentChanged && selectedEmployee && finalDepartment !== selectedEmployee.department) {
        const namePattern = `%${selectedEmployee.name}%`;
        let orFilter = `name.ilike.${namePattern}`;
        if (selectedEmployee.nip) {
          orFilter += `,nip.eq.${selectedEmployee.nip}`;
        }

        const { data: dupes } = await supabase
          .from('employees')
          .select('id, name, nip, department, position_name')
          .eq('department', finalDepartment)
          .neq('id', selectedEmployee.id)
          .or(orFilter)
          .limit(1);

        if (dupes && dupes.length > 0) {
          setPendingMutationData({ data, changes, notes, link, effectiveDate, finalDepartment });
          setDuplicateEmployee(dupes[0] as DuplicateEmployee);
          setDuplicateDialogOpen(true);
          setIsSubmitting(false);
          return;
        }
      }
      // --- END DETEKSI DUPLIKAT ---

      // Langsung jalankan tanpa setIsSubmitting lagi (sudah true dari atas)
      await doExecuteSave(data, changes, notes, link, effectiveDate, finalDepartment, departmentChanged);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data pegawai';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      setIsSubmitting(false);
    }
    // Tidak ada finally di sini - doExecuteSave yang handle setIsSubmitting(false)
  };

  /** Handler pilihan "Gabungkan" dari dialog duplikat */
  const handleMergeDuplicate = async () => {
    if (!pendingMutationData || !duplicateEmployee || !selectedEmployee) return;
    setIsSubmitting(true);
    let mergeSuccess = false;
    try {
      const tables = [
        'mutation_history', 'position_history', 'rank_history',
        'competency_test_history', 'training_history',
        'placement_notes', 'assignment_notes', 'change_notes',
        'education_history', 'additional_position_history',
      ];
      await Promise.all(
        tables.map((t) =>
          supabase.from(t as any).update({ employee_id: selectedEmployee.id }).eq('employee_id', duplicateEmployee.id)
        )
      );
      await supabase.from('employees').delete().eq('id', duplicateEmployee.id);
      toast({ title: 'Data digabungkan', description: `Record duplikat ${duplicateEmployee.name} di ${duplicateEmployee.department} telah dihapus.` });
      mergeSuccess = true;
    } catch (err) {
      logger.error('Error merging duplicate:', err);
      toast({ variant: 'destructive', title: 'Gagal menggabungkan', description: 'Terjadi kesalahan saat menggabungkan data.' });
    }

    const { data, changes, notes, link, effectiveDate, finalDepartment } = pendingMutationData;
    const deptChanged = selectedEmployee.department !== finalDepartment;
    setDuplicateDialogOpen(false);
    setDuplicateEmployee(null);
    setPendingMutationData(null);

    if (mergeSuccess) {
      await doExecuteSave(data, changes, notes, link, effectiveDate, finalDepartment, deptChanged);
    } else {
      setIsSubmitting(false);
    }
  };

  /** Handler pilihan "Biarkan Keduanya" dari dialog duplikat */
  const handleKeepBothDuplicate = async () => {
    if (!pendingMutationData || !selectedEmployee) return;
    setIsSubmitting(true);
    const { data, changes, notes, link, effectiveDate, finalDepartment } = pendingMutationData;
    const deptChanged = selectedEmployee.department !== finalDepartment;
    setDuplicateDialogOpen(false);
    setDuplicateEmployee(null);
    setPendingMutationData(null);
    await doExecuteSave(data, changes, notes, link, effectiveDate, finalDepartment, deptChanged);
  };

  /** Inti penyimpanan setelah semua pengecekan selesai */
  const doExecuteSave = async (
    data: EmployeeFormData,
    detectedChanges: DetectedChange[],
    notes: string,
    link: string,
    effectiveDate: string,
    finalDepartment: string,
    departmentChanged: boolean,
  ) => {
    if (!user) return;
    // Catatan: setIsSubmitting(true) sudah dipanggil oleh caller
    try {
      let finalPositionName = data.position_name;
      let positionChanged = false;
      
      if (data.position_history && data.position_history.length > 0) {
        const sortedPositions = [...data.position_history]
          .filter(p => p.tanggal && p.jabatan_baru)
          .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        
        if (sortedPositions.length > 0) {
          const newPosition = sortedPositions[0].jabatan_baru || data.position_name;
          positionChanged = !!(selectedEmployee && newPosition !== selectedEmployee.position_name);
          finalPositionName = newPosition;
        }
      }

      const employeeData = {
        nip: data.nip || null,
        name: data.name,
        front_title: data.front_title || null,
        back_title: data.back_title || null,
        birth_place: data.birth_place || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        religion: data.religion || null,
        position_type: data.position_type || null,
        position_name: finalPositionName, // Use the latest position from position_history
        additional_position: data.additional_position || null,
        asn_status: data.asn_status,
        rank_group: data.rank_group || null,
        department: finalDepartment, // Use the latest department from mutation
        join_date: data.join_date || null,
        tmt_cpns: data.tmt_cpns || null,
        tmt_pns: data.tmt_pns || null,
        tmt_pensiun: data.tmt_pensiun || null,
      };

      let employeeId: string;

      if (selectedEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', selectedEmployee.id);
        if (error) throw error;
        employeeId = selectedEmployee.id;

        // Build notification message based on changes
        const changeLabels: string[] = [];
        if (positionChanged) changeLabels.push(`Jabatan: ${finalPositionName}`);
        if (departmentChanged) changeLabels.push(`Unit: ${finalDepartment}`);
        
        if (changeLabels.length > 0) {
          toast({ 
            title: 'Berhasil', 
            description: `Data pegawai berhasil diperbarui. ${changeLabels.join(' | ')}` 
          });
        } else {
          toast({ title: 'Berhasil', description: 'Data pegawai berhasil diperbarui' });
        }

        // Kirim notifikasi jika yang melakukan perubahan adalah admin_unit
        if (role === 'admin_unit' && profile) {
          const empName = [data.front_title, data.name, data.back_title].filter(Boolean).join(' ');
          const changeDesc = changeLabels.length > 0 ? ` (${changeLabels.join(', ')})` : '';
          await createNotification({
            type: 'employee_updated',
            title: 'Data Pegawai Diperbarui',
            message: `${profile.full_name} (${profile.department}) memperbarui data ${empName}${changeDesc}`,
            employee_id: employeeId,
            employee_name: empName,
            actor_id: user?.id,
            actor_name: profile.full_name,
            actor_department: profile.department,
          });
        }

        // Jika ada mutasi masuk ke unit lain, notifikasi admin_unit penerima
        if (departmentChanged && finalDepartment) {
          const empName = [data.front_title, data.name, data.back_title].filter(Boolean).join(' ');
          await createNotification({
            type: 'mutation_in',
            title: 'Pegawai Mutasi Masuk',
            message: `${empName} telah dimutasi masuk ke unit Anda dari ${selectedEmployee?.department || '-'}`,
            employee_id: employeeId,
            employee_name: empName,
            actor_id: user?.id,
            actor_name: profile?.full_name,
            actor_department: profile?.department,
            target_department: finalDepartment,
          });
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select('id')
          .single();
        if (error) {
          if (error.code === '23505') throw new Error('NIP sudah terdaftar dalam database');
          throw error;
        }
        employeeId = inserted.id;
        
        // For new employee, show position if set from history
        if (finalPositionName) {
          toast({ 
            title: 'Berhasil', 
            description: `Pegawai baru berhasil ditambahkan dengan jabatan: ${finalPositionName}` 
          });
        } else {
          toast({ title: 'Berhasil', description: 'Pegawai baru berhasil ditambahkan' });
        }

        // Kirim notifikasi ke admin_pusat jika yang menambahkan adalah admin_unit
        if (role === 'admin_unit' && profile) {
          const empName = [data.front_title, data.name, data.back_title].filter(Boolean).join(' ');
          await createNotification({
            type: 'employee_created',
            title: 'Pegawai Baru Ditambahkan',
            message: `${profile.full_name} (${profile.department}) menambahkan pegawai baru: ${empName}`,
            employee_id: employeeId,
            employee_name: empName,
            actor_id: user?.id,
            actor_name: profile.full_name,
            actor_department: profile.department,
          });
        }
      }

      // Handle education history
      if (data.education_history) {
        await supabase.from('education_history').delete().eq('employee_id', employeeId);
        const eduRows = data.education_history
          .filter(e => e.level)
          .map(e => ({
            employee_id: employeeId,
            level: e.level,
            institution_name: e.institution_name || null,
            major: e.major || null,
            graduation_year: e.graduation_year ? parseInt(e.graduation_year) : null,
            front_title: e.front_title || null,
            back_title: e.back_title || null,
          }));
        if (eduRows.length > 0) {
          await supabase.from('education_history').insert(eduRows);
        }
      }

      // Save all other history types (manual entries from form)
      logger.debug('=== SAVING ALL HISTORY DATA ===');
      logger.debug('Mutation history:', data.mutation_history);
      logger.debug('Position history:', data.position_history);
      
      await Promise.all([
        saveHistoryEntries('mutation_history', employeeId, data.mutation_history, ['tanggal', 'dari_unit', 'ke_unit', 'jabatan', 'nomor_sk', 'keterangan']),
        saveHistoryEntries('position_history', employeeId, data.position_history, ['tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan']),
        saveHistoryEntries('rank_history', employeeId, data.rank_history, ['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']),
        saveHistoryEntries('competency_test_history', employeeId, data.competency_test_history, ['tanggal', 'jenis_uji', 'hasil', 'keterangan']),
        saveHistoryEntries('training_history', employeeId, data.training_history, ['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']),
      ]);
      
      logger.debug('=== ALL HISTORY DATA SAVED ===');

      // Save notes data
      if (data.placement_notes) {
        await supabase.from('placement_notes').delete().eq('employee_id', employeeId);
        const placementRows = data.placement_notes
          .filter(n => n.note && n.note.trim())
          .map(n => ({ employee_id: employeeId, note: n.note }));
        if (placementRows.length > 0) {
          await supabase.from('placement_notes').insert(placementRows);
        }
      }

      if (data.assignment_notes) {
        await supabase.from('assignment_notes').delete().eq('employee_id', employeeId);
        const assignmentRows = data.assignment_notes
          .filter(n => n.note && n.note.trim())
          .map(n => ({ employee_id: employeeId, note: n.note }));
        if (assignmentRows.length > 0) {
          await supabase.from('assignment_notes').insert(assignmentRows);
        }
      }

      if (data.change_notes) {
        await supabase.from('change_notes').delete().eq('employee_id', employeeId);
        const changeRows = data.change_notes
          .filter(n => n.note && n.note.trim())
          .map(n => ({ employee_id: employeeId, note: n.note }));
        if (changeRows.length > 0) {
          await supabase.from('change_notes').insert(changeRows);
        }
      }

      // Save additional position history
      if (data.additional_position_history) {
        await supabase.from('additional_position_history').delete().eq('employee_id', employeeId);
        const additionalPosRows = data.additional_position_history
          .filter(h => h.jabatan_tambahan_baru || h.jabatan_tambahan_lama)
          .map(h => ({
            employee_id: employeeId,
            tanggal: h.tanggal || null,
            jabatan_tambahan_lama: h.jabatan_tambahan_lama || null,
            jabatan_tambahan_baru: h.jabatan_tambahan_baru || null,
            nomor_sk: h.nomor_sk || null,
            tmt: h.tmt || null,
            keterangan: h.keterangan || null,
          }));
        if (additionalPosRows.length > 0) {
          await supabase.from('additional_position_history').insert(additionalPosRows);
        }
      }

      // Auto-create history records AFTER manual save (so they aren't wiped by delete+re-insert)
      if (detectedChanges.length > 0) {
        await createAutoHistoryRecords(
          employeeId,
          detectedChanges,
          notes,
          link,
          effectiveDate,
          data.rank_history || [],
          data.position_history || [],
          data.mutation_history || [],
        );
      }

      // Refresh selectedEmployee dengan data terbaru dari DB
      // Skip jika employee dimutasi keluar (department berubah dan bukan admin_pusat)
      if (selectedEmployee && !(departmentChanged && !isAdminPusat)) {
        try {
          const { data: updatedEmployee, error: selectError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .single();
          
          // Ignore 403 error (RLS policy blocks access after mutation)
          if (selectError && selectError.code !== 'PGRST301') {
            logger.warn('Could not refresh employee data after save:', selectError);
          } else if (updatedEmployee) {
            setSelectedEmployee(updatedEmployee as Employee);
          }
        } catch (err) {
          logger.warn('Error refreshing employee data:', err);
          // Continue anyway - data was saved successfully
        }
      }

      setFormModalOpen(false);
      setChangeLogOpen(false);
      setPendingFormData(null);
      setDetectedChanges([]);
      
      await fetchEmployees();
      
      if (departmentChanged && !isAdminPusat) {
        setTimeout(() => {
          toast({ 
            title: 'Info', 
            description: 'Pegawai telah dipindahkan ke unit kerja lain dan tidak lagi muncul di daftar Anda.',
            variant: 'default'
          });
        }, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data pegawai';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: EmployeeFormData) => {
    // If editing, detect changes and show dialog (unless Quick Action was used)
    if (selectedEmployee && !data._skipChangeDetection) {
      const changes = detectChanges(selectedEmployee, data);
      if (changes.length > 0) {
        setDetectedChanges(changes);
        setPendingFormData(data);
        setFormModalOpen(false);
        setChangeLogOpen(true);
        return;
      }
    }

    // No tracked changes, Quick Action was used, or new employee — save directly
    await executeSave(data, [], '', '', new Date().toISOString().split('T')[0]);
  };

  const handleChangeLogConfirm = async (notes: string, link: string, date: string) => {
    if (!pendingFormData) return;
    await executeSave(pendingFormData, detectedChanges, notes, link, date);
  };

  const handleChangeLogSkip = async () => {
    if (!pendingFormData) return;
    await executeSave(pendingFormData, detectedChanges, '', '', new Date().toISOString().split('T')[0]);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      const empName = formatDisplayName(selectedEmployee);
      const empDepartment = selectedEmployee.department;

      const { error } = await supabase.from('employees').delete().eq('id', selectedEmployee.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data pegawai berhasil dihapus' });

      // Kirim notifikasi ke admin_pusat jika yang menghapus adalah admin_unit
      if (role === 'admin_unit' && profile) {
        await createNotification({
          type: 'employee_deleted',
          title: 'Data Pegawai Dihapus',
          message: `${profile.full_name} (${profile.department}) menghapus data pegawai: ${empName} dari unit ${empDepartment}`,
          employee_name: empName,
          actor_id: user?.id,
          actor_name: profile.full_name,
          actor_department: profile.department,
        });
      }

      setDeleteDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus data pegawai';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const now = new Date();
    const timestamp = format(now, 'yyyy-MM-dd');

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Data Pegawai ──────────────────────────────────────────────
    const headers = [
      'No', 'NIP', 'Gelar Depan', 'Nama', 'Gelar Belakang',
      'Jenis Jabatan', 'Nama Jabatan', 'Jabatan Tambahan / PLT',
      'Status ASN', 'Golongan', 'Unit Kerja', 'Tanggal Masuk',
      'Ket. Formasi', 'Ket. Penempatan', 'Ket. Penugasan', 'Ket. Perubahan',
    ];

    const rows = filteredEmployees.map((emp, idx) => [
      idx + 1,
      emp.nip || '',
      emp.front_title || '',
      emp.name || '',
      emp.back_title || '',
      emp.position_type || '',
      emp.position_name || '',
      emp.additional_position || '',
      emp.asn_status || '',
      emp.rank_group || '',
      emp.department || '',
      emp.join_date || '',
      emp.keterangan_formasi || '',
      emp.keterangan_penempatan || '',
      emp.keterangan_penugasan || '',
      emp.keterangan_perubahan || '',
    ]);

    const aoaData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Lebar kolom
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 20 }, // NIP
      { wch: 10 }, // Gelar Depan
      { wch: 30 }, // Nama
      { wch: 15 }, // Gelar Belakang
      { wch: 15 }, // Jenis Jabatan
      { wch: 35 }, // Nama Jabatan
      { wch: 25 }, // Jabatan Tambahan
      { wch: 10 }, // Status ASN
      { wch: 25 }, // Golongan
      { wch: 30 }, // Unit Kerja
      { wch: 14 }, // Tanggal Masuk
      { wch: 25 }, // Ket. Formasi
      { wch: 25 }, // Ket. Penempatan
      { wch: 25 }, // Ket. Penugasan
      { wch: 25 }, // Ket. Perubahan
    ];

    // Freeze baris header
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

    // ── Sheet 2: Ringkasan ─────────────────────────────────────────────────
    const asnCount = filteredEmployees.filter(e => e.asn_status === 'PNS' || e.asn_status === 'CPNS').length;
    const pppkCount = filteredEmployees.filter(e => e.asn_status === 'PPPK').length;
    const nonAsnCount = filteredEmployees.filter(e => e.asn_status === 'Non ASN').length;

    const summaryData = [
      ['Ringkasan Data Pegawai'],
      [],
      ['Tanggal Export', timestamp],
      ['Total Pegawai', filteredEmployees.length],
      [],
      ['Berdasarkan Status ASN'],
      ['PNS / CPNS', asnCount],
      ['PPPK', pppkCount],
      ['Non ASN', nonAsnCount],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Download
    XLSX.writeFile(wb, `data-pegawai-${timestamp}.xlsx`, { bookType: 'xlsx', compression: true });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PNS': return <Badge className="badge-pns">PNS</Badge>;
      case 'CPNS': return <Badge className="badge-cpns">CPNS</Badge>;
      case 'PPPK': return <Badge className="badge-pppk">PPPK</Badge>;
      case 'Non ASN': return <Badge className="badge-nonasn">Non ASN</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Data Pegawai</h1>
            <p className="page-description">
              Kelola data nominatif pegawai {!canViewAll && profile?.department}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={handleExport} disabled={filteredEmployees.length === 0} className="text-xs sm:text-sm">
              <Download className="mr-1 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Export Excel</span><span className="sm:hidden">Export</span>
            </Button>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="text-xs sm:text-sm">
                    <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Pegawai</span>
                    <span className="sm:hidden">Tambah</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Pilih Jenis Pegawai</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAddEmployee}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Data ASN
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedEmployee(null);
                    setSelectedEducation([]);
                    setSelectedPositionHistory([]);
                    setNonAsnModalOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Data Non-ASN
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama, NIP, atau jabatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-full sm:w-[180px]"><SelectValue placeholder="Status ASN" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {ASN_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {canViewAll && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="department-filter" className="w-full sm:w-[240px]"><SelectValue placeholder="Unit Kerja" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {dynamicDepartments.filter(d => d !== 'Pusat').map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="asn">
              Data ASN
              <span className="ml-2 text-xs text-muted-foreground">
                ({employees.filter(e => {
                  const matchesStatus = statusFilter === 'all' || e.asn_status === statusFilter;
                  const matchesDepartment = !canViewAll || departmentFilter === 'all' || e.department === departmentFilter;
                  return e.asn_status !== 'Non ASN' && matchesStatus && matchesDepartment;
                }).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="non-asn">
              Data Non-ASN
              <span className="ml-2 text-xs text-muted-foreground">
                ({employees.filter(e => {
                  const matchesStatus = statusFilter === 'all' || e.asn_status === statusFilter;
                  const matchesDepartment = !canViewAll || departmentFilter === 'all' || e.department === departmentFilter;
                  return e.asn_status === 'Non ASN' && matchesStatus && matchesDepartment;
                }).length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                <TableHead>Status ASN</TableHead>
                <TableHead className="hidden lg:table-cell">Golongan</TableHead>
                {canViewAll && <TableHead className="hidden xl:table-cell">Unit Kerja</TableHead>}
                <TableHead className="w-[60px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={canViewAll ? 7 : 6} rows={10} />
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewAll ? 7 : 6} className="h-32 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Tidak ada data yang sesuai dengan filter'
                      : 'Belum ada data pegawai'}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {groupedEmployees.map((group, groupIdx) => (
                    <React.Fragment key={`group-${groupIdx}`}>
                      {/* Category Header Row with Collapse/Expand */}
                      <TableRow 
                        className="bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                        onClick={() => toggleCategory(group.category)}
                      >
                        <TableCell 
                          colSpan={canViewAll ? 7 : 6} 
                          className="font-semibold text-sm uppercase tracking-wide py-3"
                        >
                          <div className="flex items-center gap-2">
                            {collapsedCategories[group.category] ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span>{group.category}</span>
                            <span className="text-xs font-normal text-muted-foreground ml-2">
                              ({group.employees.length} pegawai)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Employee Rows - Only show if not collapsed */}
                      {!collapsedCategories[group.category] && group.employees.map((employee) => (
                        <TableRow key={employee.id} className="animate-fade-in">
                          <TableCell className="font-mono text-sm">{employee.nip || '-'}</TableCell>
                          <TableCell className="font-medium">{formatDisplayName(employee)}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              <span>{employee.position_name || '-'}</span>
                              {employee.additional_position && (
                                <span className={cn(
                                  'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit',
                                  employee.additional_position.toUpperCase().includes('PLT')
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                )}>
                                  {employee.additional_position}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(employee.asn_status)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{employee.rank_group || '-'}</TableCell>
                          {canViewAll && <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{employee.department}</TableCell>}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                {canEdit && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteEmployee(employee)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          </div>

          {!isLoading && filteredEmployees.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t px-4 py-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} dari {filteredEmployees.length} data
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </div>

      <EmployeeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        employee={selectedEmployee}
        education={selectedEducation}
        mutationHistory={selectedMutationHistory}
        positionHistory={selectedPositionHistory}
        rankHistory={selectedRankHistory}
        competencyHistory={selectedCompetencyHistory}
        trainingHistory={selectedTrainingHistory}
        placementNotes={selectedPlacementNotes}
        assignmentNotes={selectedAssignmentNotes}
        changeNotes={selectedChangeNotes}
        additionalPositionHistory={selectedAdditionalPositionHistory}
      />

      <EmployeeFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <NonAsnFormModal
        open={nonAsnModalOpen}
        onOpenChange={setNonAsnModalOpen}
        onSuccess={fetchEmployees}
        editData={selectedEmployee?.asn_status === 'Non ASN' ? selectedEmployee : undefined}
        userDepartment={profile?.department as any}
        isAdminPusat={isAdminPusat}
        initialEducation={selectedEducation}
        initialPositionHistory={selectedPositionHistory}
      />

      <ChangeLogDialog
        open={changeLogOpen}
        onOpenChange={(open) => {
          setChangeLogOpen(open);
          if (!open) {
            // If user closes dialog, reopen form so they don't lose data
            setFormModalOpen(true);
          }
        }}
        changes={detectedChanges}
        employeeName={selectedEmployee ? formatDisplayName(selectedEmployee) : ''}
        onConfirm={handleChangeLogConfirm}
        onSkip={handleChangeLogSkip}
        isLoading={isSubmitting}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
        employeeName={selectedEmployee ? formatDisplayName(selectedEmployee) : ''}
        department={selectedEmployee?.department || ''}
      />

      <DuplicateMutationDialog
        open={duplicateDialogOpen}
        duplicate={duplicateEmployee}
        targetDepartment={pendingMutationData?.finalDepartment || ''}
        onMerge={handleMergeDuplicate}
        onKeepBoth={handleKeepBothDuplicate}
        onCancel={() => {
          setDuplicateDialogOpen(false);
          setDuplicateEmployee(null);
          setPendingMutationData(null);
          setIsSubmitting(false);
        }}
        isLoading={isSubmitting}
      />
    </AppLayout>
  );
}
