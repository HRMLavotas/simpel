import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeValidation } from '@/hooks/useEmployeeValidation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { DEPARTMENTS, ASN_STATUS_OPTIONS, POSITION_TYPES, RANK_GROUPS_PNS, RANK_GROUPS_PPPK, GENDER_OPTIONS, RELIGION_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { EducationHistoryForm, type EducationEntry } from './EducationHistoryForm';
import {
  EmployeeHistoryForm,
  type HistoryEntry,
  MUTATION_FIELDS,
  POSITION_HISTORY_FIELDS,
  RANK_HISTORY_FIELDS,
  COMPETENCY_TEST_FIELDS,
  TRAINING_FIELDS,
} from './EmployeeHistoryForm';
import { NotesForm, type NoteEntry } from './NotesForm';
import { AdditionalPositionHistoryForm, type AdditionalPositionHistoryEntry } from './AdditionalPositionHistoryForm';
import { QuickActionForm } from './QuickActionForm';
import { PositionAutocomplete } from '@/components/ui/position-autocomplete';
import { usePositionOptions } from '@/hooks/usePositionOptions';
import { logger } from '@/lib/logger';

const employeeSchema = z.object({
  nip: z.string().max(18, 'NIP maksimal 18 digit').optional().or(z.literal('')),
  name: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  front_title: z.string().max(50).optional().or(z.literal('')),
  back_title: z.string().max(50).optional().or(z.literal('')),
  birth_place: z.string().max(100).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  religion: z.string().optional().or(z.literal('')),
  position_type: z.string().optional().or(z.literal('')),
  position_name: z.string().max(255).optional().or(z.literal('')),
  additional_position: z.string().max(255).optional().or(z.literal('')),
  asn_status: z.string().min(1, 'Status ASN wajib dipilih'),
  rank_group: z.string().optional().or(z.literal('')),
  department: z.string().min(1, 'Unit kerja wajib dipilih'),
  join_date: z.string().optional().or(z.literal('')),
  tmt_cpns: z.string().optional().or(z.literal('')),
  tmt_pns: z.string().optional().or(z.literal('')),
  tmt_pensiun: z.string().optional().or(z.literal('')),
});

export type EmployeeFormData = z.infer<typeof employeeSchema> & {
  education_history?: EducationEntry[];
  mutation_history?: HistoryEntry[];
  position_history?: HistoryEntry[];
  rank_history?: HistoryEntry[];
  competency_test_history?: HistoryEntry[];
  training_history?: HistoryEntry[];
  placement_notes?: NoteEntry[];
  assignment_notes?: NoteEntry[];
  change_notes?: NoteEntry[];
  additional_position_history?: AdditionalPositionHistoryEntry[];
  _skipChangeDetection?: boolean; // Internal flag to skip change detection dialog
};

interface Employee {
  id: string;
  nip: string | null;
  name: string;
  front_title: string | null;
  back_title: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  position_type: string | null;
  position_name: string | null;
  additional_position: string | null;
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
}

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSubmit,
  isLoading,
}: EmployeeFormModalProps) {
  const { profile, isAdminPusat } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const isEditing = !!employee;

  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'notes' | 'quick'>(
    isEditing ? 'quick' : 'main'
  );
  
  // Track if changes were made via Quick Action (to skip change detection dialog)
  const quickActionUsedRef = useRef(false);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [mutationEntries, setMutationEntries] = useState<HistoryEntry[]>([]);
  const [positionHistoryEntries, setPositionHistoryEntries] = useState<HistoryEntry[]>([]);
  const [rankHistoryEntries, setRankHistoryEntries] = useState<HistoryEntry[]>([]);
  const [competencyEntries, setCompetencyEntries] = useState<HistoryEntry[]>([]);
  const [trainingEntries, setTrainingEntries] = useState<HistoryEntry[]>([]);
  const [placementNotes, setPlacementNotes] = useState<NoteEntry[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState<NoteEntry[]>([]);
  const [changeNotes, setChangeNotes] = useState<NoteEntry[]>([]);
  const [additionalPositionHistoryEntries, setAdditionalPositionHistoryEntries] = useState<AdditionalPositionHistoryEntry[]>([]);
  
  // State for additional position edit mode
  const [isEditingAdditionalPosition, setIsEditingAdditionalPosition] = useState(false);
  const [tempAdditionalPosition, setTempAdditionalPosition] = useState('');

  // Track if critical fields have changed
  const [hasRankChanged, setHasRankChanged] = useState(false);
  const [hasPositionChanged, setHasPositionChanged] = useState(false);
  const [hasDepartmentChanged, setHasDepartmentChanged] = useState(false);
  const [hasAdditionalPositionChanged, setHasAdditionalPositionChanged] = useState(false);
  
  // Use validation hook
  const { validateNIP, nipValidation, resetNIPValidation } = useEmployeeValidation({ debounceMs: 500 });

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nip: '', name: '', front_title: '', back_title: '',
      birth_place: '', birth_date: '', gender: '', religion: '',
      position_type: '', position_name: '', additional_position: '',
      asn_status: '', rank_group: '', department: profile?.department || '',
      join_date: '', tmt_cpns: '', tmt_pns: '', tmt_pensiun: '',
    },
  });

  // Fetch jabatan dari Peta Jabatan berdasarkan unit kerja yang dipilih
  const watchedDepartment = form.watch('department');
  const { positionNames, isLoading: isLoadingPositions, error: positionError } = usePositionOptions(watchedDepartment || undefined);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<{
    rank_group: string;
    position_name: string;
    department: string;
    additional_position: string;
  }>({ rank_group: '', position_name: '', department: '', additional_position: '' });
  
  // Track if form has been modified by user to prevent unwanted resets
  const formModifiedRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  
  // Reset modification flag when modal closes
  useEffect(() => {
    if (!open) {
      formModifiedRef.current = false;
      initialLoadCompleteRef.current = false;
      quickActionUsedRef.current = false;
      setHasRankChanged(false);
      setHasPositionChanged(false);
      setHasDepartmentChanged(false);
      setHasAdditionalPositionChanged(false);
      setIsEditingAdditionalPosition(false);
      setTempAdditionalPosition('');
      resetNIPValidation();
    } else {
      // Reset ke tab yang sesuai saat modal dibuka
      setActiveTab(employee ? 'quick' : 'main');
    }
  }, [open, employee, resetNIPValidation]);

  // Auto-detect changes and populate history - ONLY after initial load is complete
  // SKIP jika perubahan berasal dari Quick Action (sudah ditangani oleh handler Quick Action)
  useEffect(() => {
    if (!isEditing || !employee || !initialLoadCompleteRef.current) return;

    const subscription = form.watch((value, { name: fieldName }) => {
      formModifiedRef.current = true;

      // Jika Quick Action yang mengubah field ini, skip auto-detect
      // Quick Action sudah menambahkan entry riwayat sendiri
      if (quickActionUsedRef.current) return;
      
      const today = new Date().toISOString().split('T')[0];

      // Detect Rank/Golongan change
      if (fieldName === 'rank_group' && value.rank_group && value.rank_group !== originalValues.rank_group) {
        const oldRank = originalValues.rank_group;
        const newRank = value.rank_group;
        
        if (oldRank && newRank && oldRank !== newRank) {
          setRankHistoryEntries(prev => {
            const alreadyExists = prev.some(
              entry => entry.pangkat_lama === oldRank && entry.pangkat_baru === newRank
            );

            if (!alreadyExists) {
              const newEntry: HistoryEntry = {
                tanggal: today,
                pangkat_lama: oldRank,
                pangkat_baru: newRank,
                tmt: today,
                nomor_sk: '',
                keterangan: 'Perubahan data - Auto-generated',
              };
              toast({ title: '✅ Riwayat Kenaikan Pangkat otomatis ditambahkan', duration: 3000 });
              return [...prev, newEntry];
            }
            return prev;
          });
        }
      }

      // Detect Position/Jabatan change
      if (fieldName === 'position_name' && value.position_name && value.position_name !== originalValues.position_name) {
        const oldPosition = originalValues.position_name;
        const newPosition = value.position_name;
        
        if (oldPosition && newPosition && oldPosition !== newPosition) {
          setPositionHistoryEntries(prev => {
            const alreadyExists = prev.some(
              entry => entry.jabatan_lama === oldPosition && entry.jabatan_baru === newPosition
            );

            if (!alreadyExists) {
              const newEntry: HistoryEntry = {
                tanggal: today,
                jabatan_lama: oldPosition,
                jabatan_baru: newPosition,
                nomor_sk: '',
                keterangan: 'Perubahan data - Auto-generated',
              };
              toast({ title: '✅ Riwayat Jabatan otomatis ditambahkan', duration: 3000 });
              return [...prev, newEntry];
            }
            return prev;
          });
        }
      }

      // Detect Department/Unit Kerja change (Mutasi)
      if (fieldName === 'department' && value.department && value.department !== originalValues.department) {
        const oldDept = originalValues.department;
        const newDept = value.department;
        
        if (oldDept && newDept && oldDept !== newDept) {
          setMutationEntries(prev => {
            const alreadyExists = prev.some(
              entry => entry.dari_unit === oldDept && entry.ke_unit === newDept
            );

            if (!alreadyExists) {
              const newEntry: HistoryEntry = {
                tanggal: today,
                dari_unit: oldDept,
                ke_unit: newDept,
                nomor_sk: '',
                keterangan: 'Mutasi - Auto-generated',
              };
              toast({ title: '✅ Riwayat Mutasi otomatis ditambahkan', duration: 3000 });
              return [...prev, newEntry];
            }
            return prev;
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [isEditing, employee, form, originalValues, toast]);

  // Detect changes to critical fields for warning display
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Check if rank_group has changed
      if (value.rank_group !== originalValues.rank_group && originalValues.rank_group) {
        setHasRankChanged(true);
      } else {
        setHasRankChanged(false);
      }

      // Check if position_name has changed
      if (value.position_name !== originalValues.position_name && originalValues.position_name) {
        setHasPositionChanged(true);
      } else {
        setHasPositionChanged(false);
      }

      // Check if department has changed
      if (value.department !== originalValues.department && originalValues.department) {
        setHasDepartmentChanged(true);
      } else {
        setHasDepartmentChanged(false);
      }

      // Check if additional_position has changed
      if (value.additional_position !== originalValues.additional_position && (originalValues.additional_position || value.additional_position)) {
        setHasAdditionalPositionChanged(true);
      } else {
        setHasAdditionalPositionChanged(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, originalValues]);

  // Auto-fill from NIP when NIP changes and validate
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'nip' && value.nip) {
        const cleanNIP = value.nip.replace(/\s/g, '');
        
        // Trigger validation for NIP
        if (cleanNIP.length === 18) {
          validateNIP(cleanNIP, employee?.id);
          
          try {
            // Parse birth date: YYYYMMDD
            const birthDateStr = cleanNIP.substring(0, 8);
            const birthYear = parseInt(birthDateStr.substring(0, 4));
            const birthMonth = parseInt(birthDateStr.substring(4, 6));
            const birthDay = parseInt(birthDateStr.substring(6, 8));
            
            // Validate year range (1940-2010 reasonable for employees)
            if (birthYear < 1940 || birthYear > 2010) {
              logger.warn('Invalid birth year from NIP:', birthYear);
              return;
            }
            
            // Validate month (1-12)
            if (birthMonth < 1 || birthMonth > 12) {
              logger.warn('Invalid birth month from NIP:', birthMonth);
              return;
            }
            
            // Validate day (1-31)
            if (birthDay < 1 || birthDay > 31) {
              logger.warn('Invalid birth day from NIP:', birthDay);
              return;
            }
            
            const birth_date = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
            
            // Parse TMT CPNS: YYYYMM
            const tmtCpnsStr = cleanNIP.substring(8, 14);
            const tmtYear = parseInt(tmtCpnsStr.substring(0, 4));
            const tmtMonth = parseInt(tmtCpnsStr.substring(4, 6));
            
            // Validate TMT year and month
            if (tmtYear < 1970 || tmtYear > new Date().getFullYear() || tmtMonth < 1 || tmtMonth > 12) {
              logger.warn('Invalid TMT CPNS from NIP:', { tmtYear, tmtMonth });
              return;
            }
            
            const tmt_cpns = `${tmtYear}-${tmtMonth.toString().padStart(2, '0')}-01`;
            
            // Parse gender: 1 = Laki-laki, 2 = Perempuan
            const genderCode = cleanNIP.substring(14, 15);
            const gender = genderCode === '1' ? 'Laki-laki' : genderCode === '2' ? 'Perempuan' : '';
            
            // Final validation with Date object
            const birthDateObj = new Date(birth_date);
            const tmtCpnsObj = new Date(tmt_cpns);
            
            if (!isNaN(birthDateObj.getTime()) && !isNaN(tmtCpnsObj.getTime())) {
              // Validate that birth date is before TMT CPNS
              if (birthDateObj >= tmtCpnsObj) {
                logger.warn('Birth date must be before TMT CPNS');
                return;
              }
              
              // Only fill if fields are empty
              if (!form.getValues('birth_date')) {
                form.setValue('birth_date', birth_date);
              }
              if (!form.getValues('tmt_cpns')) {
                form.setValue('tmt_cpns', tmt_cpns);
              }
              if (!form.getValues('gender')) {
                form.setValue('gender', gender);
              }
            }
          } catch (error) {
            logger.error('Error parsing NIP:', error);
          }
        } else {
          resetNIPValidation();
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, validateNIP, resetNIPValidation, employee?.id]);

  useEffect(() => {
    // Skip reset if user has modified the form (to prevent losing unsaved changes)
    if (formModifiedRef.current && initialLoadCompleteRef.current) {
      logger.debug('⚠️ Skipping form reset - user has unsaved changes');
      return;
    }
    
    if (employee) {
      logger.debug('=== EMPLOYEE DATA FOR EDIT ===');
      logger.debug('Gender:', employee.gender);
      logger.debug('Religion:', employee.religion);
      logger.debug('Full employee:', employee);
      
      // Normalize gender value to match options exactly - handle all common variations
      let normalizedGender = employee.gender || '';
      if (normalizedGender) {
        const genderLower = normalizedGender.toLowerCase().trim();
        if (genderLower === 'l' || genderLower === 'laki-laki' || genderLower === 'laki laki' || 
            genderLower === 'male' || genderLower === 'pria' || genderLower === '1') {
          normalizedGender = 'Laki-laki';
        } else if (genderLower === 'p' || genderLower === 'perempuan' || 
                   genderLower === 'female' || genderLower === 'wanita' || genderLower === '2') {
          normalizedGender = 'Perempuan';
        } else {
          // If value doesn't match any known pattern, keep original but log warning
          logger.warn('Unknown gender value:', normalizedGender);
          normalizedGender = ''; // Reset to empty to force user selection
        }
      }
      
      // Normalize religion value to match options exactly - handle all common variations
      let normalizedReligion = employee.religion || '';
      if (normalizedReligion) {
        const religionLower = normalizedReligion.toLowerCase().trim();
        const religionMap: Record<string, string> = {
          'islam': 'Islam',
          'kristen': 'Kristen',
          'katolik': 'Katolik',
          'hindu': 'Hindu',
          'buddha': 'Buddha',
          'budha': 'Buddha',
          'konghucu': 'Konghucu',
          'khonghucu': 'Konghucu',
        };
        
        normalizedReligion = religionMap[religionLower] || '';
        if (!normalizedReligion && employee.religion) {
          logger.warn('Unknown religion value:', employee.religion);
        }
      }
      
      logger.debug('Normalized Gender:', normalizedGender);
      logger.debug('Normalized Religion:', normalizedReligion);
      
      // Store original values for change detection
      setOriginalValues({
        rank_group: employee.rank_group || '',
        position_name: employee.position_name || '',
        department: employee.department || '',
        additional_position: employee.additional_position || '',
      });
      
      form.reset({
        nip: employee.nip || '', name: employee.name,
        front_title: employee.front_title || '', back_title: employee.back_title || '',
        birth_place: employee.birth_place || '', birth_date: employee.birth_date || '',
        gender: normalizedGender, religion: normalizedReligion,
        position_type: employee.position_type || '',
        position_name: employee.position_name || '', additional_position: employee.additional_position || '',
        asn_status: employee.asn_status || '',
        rank_group: employee.rank_group || '', department: employee.department,
        join_date: employee.join_date || '', tmt_cpns: employee.tmt_cpns || '',
        tmt_pns: employee.tmt_pns || '', tmt_pensiun: employee.tmt_pensiun || '',
      });
      
      // Debug: Check form values after reset
      setTimeout(() => {
        logger.debug('=== FORM VALUES AFTER RESET ===');
        logger.debug('Gender:', form.getValues('gender'));
        logger.debug('Religion:', form.getValues('religion'));
      }, 100);
      
      // Mark initial load as complete
      initialLoadCompleteRef.current = true;
      formModifiedRef.current = false;
    } else {
      // Reset original values for new employee
      setOriginalValues({ rank_group: '', position_name: '', department: '', additional_position: '' });
      
      form.reset({
        nip: '', name: '', front_title: '', back_title: '',
        birth_place: '', birth_date: '', gender: '', religion: '',
        position_type: '', position_name: '', additional_position: '',
        asn_status: '', rank_group: '', department: profile?.department || '',
        join_date: '', tmt_cpns: '', tmt_pns: '', tmt_pensiun: '',
      });
      setEducationEntries([]);
      setMutationEntries([]);
      setPositionHistoryEntries([]);
      setRankHistoryEntries([]);
      setCompetencyEntries([]);
      setTrainingEntries([]);
      setPlacementNotes([]);
      setAssignmentNotes([]);
      setChangeNotes([]);
      setAdditionalPositionHistoryEntries([]);
      
      // Mark initial load as complete
      initialLoadCompleteRef.current = true;
      formModifiedRef.current = false;
    }
  }, [employee, profile, form]);

  // Fetch history dari DB setiap kali modal dibuka - useEffect terpisah di level komponen
  useEffect(() => {
    if (!open || !employee?.id) return;
    if (formModifiedRef.current && initialLoadCompleteRef.current) return;

    setIsFetchingHistory(true);
    const empId = employee.id;

    const mapRows = (data: any[], fields: string[]) =>
      (data || []).map((d: any) => {
        const entry: HistoryEntry = { id: d.id };
        fields.forEach(f => { entry[f] = d[f]?.toString() || ''; });
        return entry;
      });

    // Isi nilai "lama" dari entry sebelumnya berdasarkan urutan tanggal
    const inferOldValues = (
      rows: HistoryEntry[],
      newField: string,
      oldField: string,
      currentValue?: string
    ): HistoryEntry[] => {
      // rows sudah diurutkan ascending (terlama dulu)
      return rows.map((row, i) => {
        if (!row[oldField]) {
          // Ambil dari pangkat_baru/jabatan_baru entry sebelumnya
          const prev = i > 0 ? rows[i - 1][newField] : (currentValue || '');
          return { ...row, [oldField]: prev || '' };
        }
        return row;
      });
    };

    Promise.all([
      supabase.from('education_history').select('*').eq('employee_id', empId).order('graduation_year', { ascending: true }),
      supabase.from('mutation_history').select('*').eq('employee_id', empId).order('tanggal', { ascending: true, nullsFirst: false }),
      supabase.from('position_history').select('*').eq('employee_id', empId).order('tanggal', { ascending: true, nullsFirst: false }),
      supabase.from('rank_history').select('*').eq('employee_id', empId).order('tanggal', { ascending: true, nullsFirst: false }),
      supabase.from('competency_test_history').select('*').eq('employee_id', empId).order('tanggal', { ascending: true, nullsFirst: false }),
      supabase.from('training_history').select('*').eq('employee_id', empId).order('tanggal_mulai', { ascending: true, nullsFirst: false }),
      supabase.from('placement_notes').select('*').eq('employee_id', empId).order('created_at', { ascending: true }),
      supabase.from('assignment_notes').select('*').eq('employee_id', empId).order('created_at', { ascending: true }),
      supabase.from('change_notes').select('*').eq('employee_id', empId).order('created_at', { ascending: true }),
      supabase.from('additional_position_history').select('*').eq('employee_id', empId).order('tanggal', { ascending: true, nullsFirst: false }),
    ]).then(([eduRes, mutRes, posRes, rankRes, compRes, trainRes, placementRes, assignmentRes, changeRes, addPosRes]) => {
      setEducationEntries((eduRes.data || []).map((d: any) => ({
        id: d.id, level: d.level || '', institution_name: d.institution_name || '',
        major: d.major || '', graduation_year: d.graduation_year?.toString() || '',
        front_title: d.front_title || '', back_title: d.back_title || '',
      })));

      const mutationRows = mapRows(mutRes.data || [], ['tanggal', 'dari_unit', 'ke_unit', 'jabatan', 'nomor_sk', 'keterangan']);
      // Isi dari_unit dari ke_unit entry sebelumnya
      const mutationWithOld = inferOldValues(mutationRows, 'ke_unit', 'dari_unit');
      // Jika belum ada riwayat mutasi, inject unit kerja saat ini sebagai entry awal
      if (mutationWithOld.length === 0 && employee.department) {
        mutationWithOld.push({ id: '__current__', ke_unit: employee.department, keterangan: 'Data saat ini' });
      }
      setMutationEntries(mutationWithOld);

      const positionRows = mapRows(posRes.data || [], ['tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan']);
      // Isi jabatan_lama dari jabatan_baru entry sebelumnya
      const positionWithOld = inferOldValues(positionRows, 'jabatan_baru', 'jabatan_lama');
      // Jika belum ada riwayat jabatan, inject jabatan saat ini sebagai entry awal
      if (positionWithOld.length === 0 && employee.position_name) {
        positionWithOld.push({ id: '__current__', jabatan_baru: employee.position_name, unit_kerja: employee.department || '', keterangan: 'Data saat ini' });
      }
      setPositionHistoryEntries(positionWithOld);

      const rankRows = mapRows(rankRes.data || [], ['tanggal', 'pangkat_lama', 'pangkat_baru', 'nomor_sk', 'tmt', 'keterangan']);
      // Isi pangkat_lama dari pangkat_baru entry sebelumnya
      const rankWithOld = inferOldValues(rankRows, 'pangkat_baru', 'pangkat_lama');
      // Jika belum ada riwayat pangkat, inject pangkat saat ini sebagai entry awal
      if (rankWithOld.length === 0 && employee.rank_group) {
        rankWithOld.push({ id: '__current__', pangkat_baru: employee.rank_group, keterangan: 'Data saat ini' });
      }
      setRankHistoryEntries(rankWithOld);

      setCompetencyEntries(mapRows(compRes.data || [], ['tanggal', 'jenis_uji', 'hasil', 'keterangan']));
      setTrainingEntries(mapRows(trainRes.data || [], ['tanggal_mulai', 'tanggal_selesai', 'nama_diklat', 'penyelenggara', 'sertifikat', 'keterangan']));
      setPlacementNotes((placementRes.data || []).map((d: any) => ({ id: d.id, note: d.note || '' })));
      setAssignmentNotes((assignmentRes.data || []).map((d: any) => ({ id: d.id, note: d.note || '' })));
      setChangeNotes((changeRes.data || []).map((d: any) => ({ id: d.id, note: d.note || '' })));
      setAdditionalPositionHistoryEntries(mapRows(addPosRes.data || [], ['tanggal', 'jabatan_tambahan_lama', 'jabatan_tambahan_baru', 'nomor_sk', 'tmt', 'keterangan']));
      setIsFetchingHistory(false);
    }).catch(() => setIsFetchingHistory(false));
  }, [open, employee?.id]);

  // Handle edit additional position
  const handleEditAdditionalPosition = () => {
    setTempAdditionalPosition(form.getValues('additional_position') || '');
    setIsEditingAdditionalPosition(true);
  };

  // Handle save additional position
  const handleSaveAdditionalPosition = () => {
    const today = new Date().toISOString().split('T')[0];
    const oldAdditionalPosition = originalValues.additional_position;
    const newAdditionalPosition = tempAdditionalPosition;
    
    // Update form value
    form.setValue('additional_position', newAdditionalPosition, { shouldValidate: true, shouldDirty: true });
    
    // Only track if there's an actual change (not just empty to empty)
    if (oldAdditionalPosition !== newAdditionalPosition && (oldAdditionalPosition || newAdditionalPosition)) {
      const alreadyExists = additionalPositionHistoryEntries.some(
        entry => entry.jabatan_tambahan_lama === oldAdditionalPosition && entry.jabatan_tambahan_baru === newAdditionalPosition
      );

      if (!alreadyExists) {
        const newEntry: AdditionalPositionHistoryEntry = {
          tanggal: today,
          jabatan_tambahan_lama: oldAdditionalPosition || '',
          jabatan_tambahan_baru: newAdditionalPosition || '',
          nomor_sk: '',
          tmt: today,
          keterangan: 'Perubahan data - Auto-generated',
        };
        setAdditionalPositionHistoryEntries(prev => [...prev, newEntry]);
        
        // Show toast notification
        if (newAdditionalPosition) {
          toast({
            title: '✅ Riwayat Jabatan Tambahan otomatis ditambahkan',
            duration: 3000,
          });
        } else {
          toast({
            title: '✅ Riwayat penghapusan Jabatan Tambahan otomatis ditambahkan',
            duration: 3000,
          });
        }
      }
      
      // Update original value so it doesn't trigger again
      setOriginalValues(prev => ({
        ...prev,
        additional_position: newAdditionalPosition
      }));
    }
    
    setIsEditingAdditionalPosition(false);
  };

  // Handle cancel edit additional position
  const handleCancelEditAdditionalPosition = () => {
    setTempAdditionalPosition('');
    setIsEditingAdditionalPosition(false);
  };

  const handleSubmit = async (data: z.infer<typeof employeeSchema>) => {
    // Check NIP validation before submit
    if (data.nip && data.nip.length === 18) {
      if (nipValidation.isLoading) {
        toast({
          variant: 'destructive',
          title: 'Validasi sedang berjalan',
          description: 'Mohon tunggu validasi NIP selesai',
        });
        return;
      }
      
      if (!nipValidation.isValid) {
        toast({
          variant: 'destructive',
          title: 'NIP tidak valid',
          description: nipValidation.error || 'NIP sudah terdaftar',
        });
        return;
      }
    }
    
    await onSubmit({
      ...data,
      education_history: educationEntries,
      mutation_history: mutationEntries,
      position_history: positionHistoryEntries,
      rank_history: rankHistoryEntries,
      competency_test_history: competencyEntries,
      training_history: trainingEntries,
      placement_notes: placementNotes,
      assignment_notes: assignmentNotes,
      change_notes: changeNotes,
      additional_position_history: additionalPositionHistoryEntries,
      _skipChangeDetection: quickActionUsedRef.current, // Pass flag to parent
    });
  };

  const renderSelectField = (
    label: string, fieldName: keyof z.infer<typeof employeeSchema>,
    options: readonly string[], placeholder: string, required = false, disabled = false, helpText?: string
  ) => {
    const currentValue = form.watch(fieldName) as string;
    const fieldId = `employee-${fieldName}`;
    
    // Debug logging for gender and religion
    if (fieldName === 'gender' || fieldName === 'religion') {
      logger.debug(`${fieldName} - currentValue: "${currentValue}"`);
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{label}{required && ' *'}</Label>
        <Select
          value={currentValue || ''}
          onValueChange={(v) => {
            logger.debug(`${fieldName} changed to: "${v}"`);
            form.setValue(fieldName, v, { shouldValidate: true, shouldDirty: true });
          }}
          disabled={disabled}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors[fieldName] && (
          <p className="text-xs text-destructive">{form.formState.errors[fieldName]?.message}</p>
        )}
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>
    );
  };

  const getRankOptions = () => {
    const status = form.watch('asn_status');
    if (status === 'PPPK') return RANK_GROUPS_PPPK as unknown as string[];
    if (status === 'PNS') return RANK_GROUPS_PNS as unknown as string[];
    return ['Tidak Ada'];
  };

  // Quick Action handlers
  const handleQuickRankChange = (newRank: string, entry: HistoryEntry) => {
    // Mark that Quick Action was used
    quickActionUsedRef.current = true;
    formModifiedRef.current = true; // Mark form as modified
    
    // Update main form
    form.setValue('rank_group', newRank, { shouldValidate: true, shouldDirty: true });
    
    // Check for duplicate with more strict criteria (including date and SK number)
    const isDuplicate = rankHistoryEntries.some(
      e => e.pangkat_lama === entry.pangkat_lama && 
           e.pangkat_baru === entry.pangkat_baru &&
           e.tanggal === entry.tanggal &&
           e.nomor_sk === entry.nomor_sk
    );
    
    if (!isDuplicate) {
      // Add to rank history
      setRankHistoryEntries(prev => [...prev, entry]);
      
      // Show toast
      toast({
        title: '✅ Kenaikan Pangkat Berhasil',
        description: `Pangkat diupdate menjadi ${newRank}`,
        duration: 3000,
      });
    } else {
      logger.warn('Duplicate rank history entry detected, skipping');
      toast({
        title: 'Info',
        description: 'Riwayat pangkat sudah ada',
        duration: 2000,
      });
    }
    
    // Update original value to prevent duplicate auto-tracking
    setOriginalValues(prev => ({ ...prev, rank_group: newRank }));
  };

  const handleQuickPositionChange = (newPosition: string, entry: HistoryEntry) => {
    // Mark that Quick Action was used
    quickActionUsedRef.current = true;
    formModifiedRef.current = true; // Mark form as modified
    
    // Update main form
    form.setValue('position_name', newPosition, { shouldValidate: true, shouldDirty: true });
    
    // Check for duplicate with more strict criteria
    const isDuplicate = positionHistoryEntries.some(
      e => e.jabatan_lama === entry.jabatan_lama && 
           e.jabatan_baru === entry.jabatan_baru &&
           e.tanggal === entry.tanggal &&
           e.nomor_sk === entry.nomor_sk
    );
    
    if (!isDuplicate) {
      // Add to position history
      setPositionHistoryEntries(prev => [...prev, entry]);
      
      // Show toast
      toast({
        title: '✅ Pergantian Jabatan Berhasil',
        description: `Jabatan diupdate menjadi ${newPosition}`,
        duration: 3000,
      });
    } else {
      logger.warn('Duplicate position history entry detected, skipping');
      toast({
        title: 'Info',
        description: 'Riwayat jabatan sudah ada',
        duration: 2000,
      });
    }
    
    // Update original value to prevent duplicate auto-tracking
    setOriginalValues(prev => ({ ...prev, position_name: newPosition }));
  };

  const handleQuickDepartmentChange = (newDepartment: string, newPosition: string, entry: HistoryEntry) => {
    quickActionUsedRef.current = true;
    formModifiedRef.current = true;
    
    // Update department
    form.setValue('department', newDepartment, { shouldValidate: true, shouldDirty: true });

    // Update jabatan jika diisi
    if (newPosition) {
      form.setValue('position_name', newPosition, { shouldValidate: true, shouldDirty: true });
      setOriginalValues(prev => ({ ...prev, department: newDepartment, position_name: newPosition }));
    } else {
      setOriginalValues(prev => ({ ...prev, department: newDepartment }));
    }
    
    // Check for duplicate with more strict criteria
    const isDuplicate = mutationEntries.some(
      e => e.dari_unit === entry.dari_unit && 
           e.ke_unit === entry.ke_unit &&
           e.tanggal === entry.tanggal &&
           e.nomor_sk === entry.nomor_sk
    );
    
    if (!isDuplicate) {
      setMutationEntries(prev => [...prev, entry]);
      
      // Jika jabatan juga berubah, tambah riwayat jabatan
      if (newPosition && newPosition !== form.getValues('position_name')) {
        const today = new Date().toISOString().split('T')[0];
        const posEntry: HistoryEntry = {
          tanggal: entry.tanggal || today,
          jabatan_lama: form.getValues('position_name') || '',
          jabatan_baru: newPosition,
          nomor_sk: entry.nomor_sk || '',
          keterangan: 'Perubahan jabatan saat mutasi - Quick Action',
        };
        setPositionHistoryEntries(prev => [...prev, posEntry]);
      }
      
      toast({
        title: '✅ Mutasi Berhasil',
        description: newPosition
          ? `Unit kerja → ${newDepartment} | Jabatan → ${newPosition}`
          : `Unit kerja diupdate menjadi ${newDepartment}`,
        duration: 3000,
      });
    } else {
      logger.warn('Duplicate mutation entry detected, skipping');
      toast({
        title: 'Info',
        description: 'Riwayat mutasi sudah ada',
        duration: 2000,
      });
    }
  };

  // Wrapper functions for history onChange to mark form as modified
  const handleRankHistoryChange = (entries: HistoryEntry[]) => {
    formModifiedRef.current = true;
    setRankHistoryEntries(entries);
  };

  const handlePositionHistoryChange = (entries: HistoryEntry[]) => {
    formModifiedRef.current = true;
    setPositionHistoryEntries(entries);
  };

  const handleMutationHistoryChange = (entries: HistoryEntry[]) => {
    formModifiedRef.current = true;
    setMutationEntries(entries);
  };

  const handleCompetencyHistoryChange = (entries: HistoryEntry[]) => {
    formModifiedRef.current = true;
    setCompetencyEntries(entries);
  };

  const handleTrainingHistoryChange = (entries: HistoryEntry[]) => {
    formModifiedRef.current = true;
    setTrainingEntries(entries);
  };

  const handleEducationChange = (entries: EducationEntry[]) => {
    formModifiedRef.current = true;
    setEducationEntries(entries);
  };

  const handleAdditionalPositionHistoryChange = (entries: AdditionalPositionHistoryEntry[]) => {
    formModifiedRef.current = true;
    setAdditionalPositionHistoryEntries(entries);
  };

  const handlePlacementNotesChange = (entries: NoteEntry[]) => {
    formModifiedRef.current = true;
    setPlacementNotes(entries);
  };

  const handleAssignmentNotesChange = (entries: NoteEntry[]) => {
    formModifiedRef.current = true;
    setAssignmentNotes(entries);
  };

  const handleChangeNotesChange = (entries: NoteEntry[]) => {
    formModifiedRef.current = true;
    setChangeNotes(entries);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah informasi pegawai di bawah ini' : 'Lengkapi data pegawai baru di bawah ini'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'history' | 'notes' | 'quick')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick">Quick Action</TabsTrigger>
              <TabsTrigger value="main">Data Utama</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
              <TabsTrigger value="notes">Keterangan</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {isEditing ? (
                <QuickActionForm
                  currentRank={form.watch('rank_group') || ''}
                  currentPosition={form.watch('position_name') || ''}
                  currentDepartment={form.watch('department') || ''}
                  asnStatus={form.watch('asn_status') || ''}
                  departments={isAdminPusat ? dynamicDepartments.filter(Boolean) : [profile?.department].filter((dept): dept is string => Boolean(dept))}
                  allDepartments={dynamicDepartments.filter(Boolean)}
                  positionOptions={positionNames}
                  onRankChange={handleQuickRankChange}
                  onPositionChange={handleQuickPositionChange}
                  onDepartmentChange={handleQuickDepartmentChange}
                />
              ) : (
                <Alert>
                  <AlertDescription>
                    Quick Action hanya tersedia saat mengedit data pegawai yang sudah ada.
                    Silakan simpan data pegawai terlebih dahulu, kemudian edit untuk menggunakan fitur Quick Action.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="main" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {/* Identity Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Pribadi</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Opsional)</Label>
                <Input 
                  id="nip" 
                  placeholder="18 digit NIP" 
                  maxLength={18} 
                  {...form.register('nip')}
                  onChange={(e) => {
                    form.register('nip').onChange(e);
                    const cleanNIP = e.target.value.replace(/\s/g, '');
                    if (cleanNIP.length === 18) {
                      validateNIP(cleanNIP, employee?.id);
                    } else {
                      resetNIPValidation();
                    }
                  }}
                />
                {form.formState.errors.nip && <p className="text-xs text-destructive">{form.formState.errors.nip.message}</p>}
                {nipValidation.isLoading && (
                  <p className="text-xs text-muted-foreground">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    Memeriksa NIP...
                  </p>
                )}
                {!nipValidation.isValid && nipValidation.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{nipValidation.error}</AlertDescription>
                  </Alert>
                )}
                {nipValidation.isValid && form.watch('nip')?.length === 18 && !nipValidation.isLoading && (
                  <p className="text-xs text-green-600">✓ NIP tersedia</p>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 NIP 18 digit akan otomatis mengisi Tanggal Lahir, TMT CPNS, dan Jenis Kelamin
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input id="name" placeholder="Nama lengkap (tanpa gelar)" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="front_title">Gelar Depan</Label>
                <Input id="front_title" placeholder="Contoh: Dr., Ir., Drs." {...form.register('front_title')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="back_title">Gelar Belakang</Label>
                <Input id="back_title" placeholder="Contoh: S.E., M.M., Ph.D." {...form.register('back_title')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_place">Tempat Lahir</Label>
                <Input id="birth_place" placeholder="Kota/Kabupaten" {...form.register('birth_place')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                <Input id="birth_date" type="date" {...form.register('birth_date')} />
              </div>

              {renderSelectField('Jenis Kelamin', 'gender', GENDER_OPTIONS, 'Pilih jenis kelamin')}
              {renderSelectField('Agama', 'religion', RELIGION_OPTIONS, 'Pilih agama')}
            </div>
          </div>

          <Separator />

          {/* Position Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Kepegawaian</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {renderSelectField('Status ASN', 'asn_status', ASN_STATUS_OPTIONS, 'Pilih status ASN', true)}
              
              {/* Unlocked Field: Golongan/Pangkat */}
              {renderSelectField('Golongan/Pangkat', 'rank_group', getRankOptions(), 'Pilih golongan/pangkat')}
              {hasRankChanged && (
                <p className="text-xs text-muted-foreground">⚠️ Perubahan pangkat akan otomatis menambahkan riwayat kenaikan pangkat</p>
              )}

              {/* Normal Field: Jenis Jabatan */}
              {renderSelectField('Jenis Jabatan', 'position_type', POSITION_TYPES, 'Pilih jenis jabatan')}

              {/* Unlocked Field: Nama Jabatan - autocomplete dari Peta Jabatan */}
              <div className="space-y-2">
                <Label htmlFor="position_name">Nama Jabatan</Label>
                <PositionAutocomplete
                  id="position_name"
                  value={form.watch('position_name') || ''}
                  onChange={(v) => form.setValue('position_name', v, { shouldValidate: true, shouldDirty: true })}
                  options={positionNames}
                  placeholder={watchedDepartment ? (isLoadingPositions ? 'Memuat jabatan...' : 'Pilih jabatan dari Peta Jabatan') : 'Pilih unit kerja terlebih dahulu'}
                  disabled={!watchedDepartment || isLoadingPositions}
                />
                {!watchedDepartment && (
                  <p className="text-xs text-amber-600">⚠️ Pilih Unit Kerja terlebih dahulu untuk melihat daftar jabatan</p>
                )}
                {positionError && (
                  <p className="text-xs text-destructive">❌ Error memuat jabatan: {positionError}</p>
                )}
                {watchedDepartment && !isLoadingPositions && !positionError && positionNames.length > 0 && (
                  <p className="text-xs text-muted-foreground">💡 Pilih dari daftar jabatan yang tersedia di Peta Jabatan unit ini ({positionNames.length} jabatan)</p>
                )}
                {watchedDepartment && !isLoadingPositions && !positionError && positionNames.length === 0 && (
                  <p className="text-xs text-amber-600">⚠️ Belum ada jabatan di Peta Jabatan untuk unit ini</p>
                )}
                {isLoadingPositions && (
                  <p className="text-xs text-muted-foreground">⏳ Memuat daftar jabatan...</p>
                )}
                {hasPositionChanged && (
                  <p className="text-xs text-muted-foreground">⚠️ Perubahan jabatan akan otomatis menambahkan riwayat jabatan</p>
                )}
              </div>

              {/* NEW: Jabatan Tambahan (Opsional) */}
              <div className="space-y-2">
                <Label htmlFor="additional_position">
                  Jabatan Tambahan 
                  <span className="text-xs text-muted-foreground ml-2">(Opsional)</span>
                </Label>
                <div className="flex gap-2">
                  {isEditingAdditionalPosition ? (
                    <>
                      <Input 
                        id="additional_position_temp"
                        placeholder="Contoh: Subkoordinator Bidang Data dan Informasi" 
                        value={tempAdditionalPosition}
                        onChange={(e) => setTempAdditionalPosition(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleSaveAdditionalPosition}
                        className="shrink-0"
                      >
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEditAdditionalPosition}
                        className="shrink-0"
                      >
                        Batal
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm flex-1 items-center">
                        {form.watch('additional_position') || '-'}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEditAdditionalPosition}
                        className="shrink-0"
                      >
                        Edit
                      </Button>
                      {form.watch('additional_position') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTempAdditionalPosition('');
                            setIsEditingAdditionalPosition(true);
                          }}
                          className="shrink-0"
                        >
                          Kosongkan
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isEditingAdditionalPosition 
                    ? 'Klik "Simpan" untuk menyimpan perubahan atau "Batal" untuk membatalkan'
                    : 'Klik "Edit" untuk mengubah jabatan tambahan. Perubahan akan otomatis menambahkan riwayat.'
                  }
                </p>
                {hasAdditionalPositionChanged && !isEditingAdditionalPosition && (
                  <p className="text-xs text-muted-foreground">⚠️ Perubahan jabatan tambahan akan otomatis menambahkan riwayat jabatan tambahan</p>
                )}
              </div>

              {/* Unlocked Field: Unit Kerja */}
              <div className="space-y-2">
                <Label htmlFor="department">Unit Kerja *</Label>
                {(() => {
                  const departmentOptions = isAdminPusat
                    ? dynamicDepartments.filter(Boolean)
                    : [profile?.department].filter((dept): dept is string => Boolean(dept));

                  return (
                    <Select
                      value={form.watch('department') || ''}
                      onValueChange={(v) => {
                        form.setValue('department', v, { shouldValidate: true, shouldDirty: true });
                        // Reset jabatan karena daftar jabatan berbeda per unit kerja
                        form.setValue('position_name', '', { shouldValidate: false, shouldDirty: true });
                      }}
                      disabled={!isAdminPusat}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Pilih unit kerja" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
                {form.formState.errors.department && (
                  <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>
                )}
                {!isAdminPusat && (
                  <p className="text-xs text-muted-foreground">Unit kerja otomatis sesuai dengan unit Anda</p>
                )}
                {hasDepartmentChanged && (
                  <p className="text-xs text-muted-foreground">⚠️ Perubahan unit kerja akan otomatis menambahkan riwayat mutasi</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tanggal Penting</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="join_date">Tanggal Masuk</Label>
                <Input id="join_date" type="date" {...form.register('join_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_cpns">TMT CPNS</Label>
                <Input id="tmt_cpns" type="date" {...form.register('tmt_cpns')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_pns">TMT PNS</Label>
                <Input id="tmt_pns" type="date" {...form.register('tmt_pns')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_pensiun">TMT Pensiun</Label>
                <Input id="tmt_pensiun" type="date" {...form.register('tmt_pensiun')} />
              </div>
            </div>
          </div>

            </TabsContent>

            <TabsContent value="history" className="space-y-6 focus:outline-none focus-visible:outline-none">
          {/* Mutation History */}
          <div className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Mutasi"
              fields={MUTATION_FIELDS}
              entries={mutationEntries}
              onChange={handleMutationHistoryChange}
              currentValue={form.watch('department')}
              positionOptions={positionNames}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Unit kerja asal akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Untuk menambah mutasi terbaru, gunakan Quick Action
            </p>
          </div>

          <Separator />

          {/* Position History */}
          <div className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Jabatan"
              fields={POSITION_HISTORY_FIELDS}
              entries={positionHistoryEntries}
              onChange={handlePositionHistoryChange}
              currentValue={form.watch('position_name')}
              positionOptions={positionNames}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Jabatan lama akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Untuk menambah jabatan terbaru, gunakan Quick Action
            </p>
          </div>

          <Separator />

          {/* Additional Position History */}
          <div className="scroll-mt-4 transition-all duration-300">
            <AdditionalPositionHistoryForm
              entries={additionalPositionHistoryEntries}
              onChange={handleAdditionalPositionHistoryChange}
              currentAdditionalPosition={form.watch('additional_position')}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Riwayat perubahan jabatan tambahan (opsional)
            </p>
          </div>

          <Separator />

          {/* Rank History */}
          <div className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Kenaikan Pangkat"
              fields={RANK_HISTORY_FIELDS}
              entries={rankHistoryEntries}
              onChange={handleRankHistoryChange}
              currentValue={form.watch('rank_group')}
              rankOptions={getRankOptions()}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Pangkat lama akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Untuk menambah pangkat terbaru, gunakan Quick Action
            </p>
          </div>

          <Separator />

          {/* Education Section */}
          <EducationHistoryForm entries={educationEntries} onChange={handleEducationChange} />

          <Separator />

          {/* Competency Test History */}
          <EmployeeHistoryForm
            title="Riwayat Uji Kompetensi"
            fields={COMPETENCY_TEST_FIELDS}
            entries={competencyEntries}
            onChange={handleCompetencyHistoryChange}
          />

          <Separator />

          {/* Training History */}
          <EmployeeHistoryForm
            title="Riwayat Diklat"
            fields={TRAINING_FIELDS}
            entries={trainingEntries}
            onChange={handleTrainingHistoryChange}
          />

            </TabsContent>

            <TabsContent value="notes" className="space-y-6 focus:outline-none focus-visible:outline-none">
              {/* Keterangan Penempatan */}
              <NotesForm
            title="Keterangan Penempatan"
            entries={placementNotes}
            onChange={handlePlacementNotesChange}
            placeholder="Contoh: Ditempatkan di Subbag Kepegawaian sejak 2020"
          />

          <Separator />

          {/* Keterangan Penugasan Tambahan */}
          <NotesForm
            title="Keterangan Penugasan Tambahan"
            entries={assignmentNotes}
            onChange={handleAssignmentNotesChange}
            placeholder="Contoh: Sertigas sebagai Koordinator Bidang X tgl 24 Oktober 2025"
          />

          <Separator />

          {/* Keterangan Perubahan */}
          <NotesForm
            title="Keterangan Perubahan"
            entries={changeNotes}
            onChange={handleChangeNotesChange}
            placeholder="Contoh: PPPK TMT 1 Mei 2025, Mutasi dari Unit A ke Unit B"
          />

            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
              ) : (
                isEditing ? 'Simpan Perubahan' : 'Tambah Pegawai'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
