import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Edit3 } from 'lucide-react';
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
import { DEPARTMENTS, ASN_STATUS_OPTIONS, POSITION_TYPES, RANK_GROUPS_PNS, RANK_GROUPS_PPPK, GENDER_OPTIONS, RELIGION_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
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
  initialEducation?: EducationEntry[];
  initialMutationHistory?: HistoryEntry[];
  initialPositionHistory?: HistoryEntry[];
  initialRankHistory?: HistoryEntry[];
  initialCompetencyTestHistory?: HistoryEntry[];
  initialTrainingHistory?: HistoryEntry[];
  initialPlacementNotes?: NoteEntry[];
  initialAssignmentNotes?: NoteEntry[];
  initialChangeNotes?: NoteEntry[];
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSubmit,
  isLoading,
  initialEducation,
  initialMutationHistory,
  initialPositionHistory,
  initialRankHistory,
  initialCompetencyTestHistory,
  initialTrainingHistory,
  initialPlacementNotes,
  initialAssignmentNotes,
  initialChangeNotes,
}: EmployeeFormModalProps) {
  const { profile, isAdminPusat } = useAuth();
  const isEditing = !!employee;
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [mutationEntries, setMutationEntries] = useState<HistoryEntry[]>([]);
  const [positionHistoryEntries, setPositionHistoryEntries] = useState<HistoryEntry[]>([]);
  const [rankHistoryEntries, setRankHistoryEntries] = useState<HistoryEntry[]>([]);
  const [competencyEntries, setCompetencyEntries] = useState<HistoryEntry[]>([]);
  const [trainingEntries, setTrainingEntries] = useState<HistoryEntry[]>([]);
  const [placementNotes, setPlacementNotes] = useState<NoteEntry[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState<NoteEntry[]>([]);
  const [changeNotes, setChangeNotes] = useState<NoteEntry[]>([]);

  // Refs for scrolling to sections
  const mutationHistoryRef = useRef<HTMLDivElement>(null);
  const positionHistoryRef = useRef<HTMLDivElement>(null);
  const rankHistoryRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nip: '', name: '', front_title: '', back_title: '',
      birth_place: '', birth_date: '', gender: '', religion: '',
      position_type: '', position_name: '',
      asn_status: '', rank_group: '', department: profile?.department || '',
      join_date: '', tmt_cpns: '', tmt_pns: '', tmt_pensiun: '',
    },
  });

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<{
    rank_group: string;
    position_name: string;
    department: string;
  }>({ rank_group: '', position_name: '', department: '' });

  // Auto-detect changes and populate history
  useEffect(() => {
    if (!isEditing || !employee) return;

    const subscription = form.watch((value, { name: fieldName }) => {
      const today = new Date().toISOString().split('T')[0];

      // Detect Rank/Golongan change
      if (fieldName === 'rank_group' && value.rank_group && value.rank_group !== originalValues.rank_group) {
        const oldRank = originalValues.rank_group;
        const newRank = value.rank_group;
        
        if (oldRank && newRank && oldRank !== newRank) {
          // Check if this change already exists in history
          const alreadyExists = rankHistoryEntries.some(
            entry => entry.pangkat_lama === oldRank && entry.pangkat_baru === newRank
          );

          if (!alreadyExists) {
            // Add new rank history entry
            const newEntry: HistoryEntry = {
              tanggal: today,
              pangkat_lama: oldRank,
              pangkat_baru: newRank,
              tmt: today,
              nomor_sk: '',
              keterangan: 'Perubahan data - Auto-generated',
            };
            setRankHistoryEntries(prev => [...prev, newEntry]);
            
            // Show toast or notification
            console.log('✅ Riwayat Kenaikan Pangkat otomatis ditambahkan:', newEntry);
          }
        }
      }

      // Detect Position/Jabatan change
      if (fieldName === 'position_name' && value.position_name && value.position_name !== originalValues.position_name) {
        const oldPosition = originalValues.position_name;
        const newPosition = value.position_name;
        
        if (oldPosition && newPosition && oldPosition !== newPosition) {
          const alreadyExists = positionHistoryEntries.some(
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
            setPositionHistoryEntries(prev => [...prev, newEntry]);
            
            console.log('✅ Riwayat Jabatan otomatis ditambahkan:', newEntry);
          }
        }
      }

      // Detect Department/Unit Kerja change (Mutasi)
      if (fieldName === 'department' && value.department && value.department !== originalValues.department) {
        const oldDept = originalValues.department;
        const newDept = value.department;
        
        if (oldDept && newDept && oldDept !== newDept) {
          const alreadyExists = mutationEntries.some(
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
            setMutationEntries(prev => [...prev, newEntry]);
            
            console.log('✅ Riwayat Mutasi otomatis ditambahkan:', newEntry);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [isEditing, employee, form, originalValues, rankHistoryEntries, positionHistoryEntries, mutationEntries]);

  // Auto-fill from NIP when NIP changes
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'nip' && value.nip) {
        const cleanNIP = value.nip.replace(/\s/g, '');
        if (cleanNIP.length === 18) {
          try {
            // Parse birth date: YYYYMMDD
            const birthDateStr = cleanNIP.substring(0, 8);
            const birthYear = birthDateStr.substring(0, 4);
            const birthMonth = birthDateStr.substring(4, 6);
            const birthDay = birthDateStr.substring(6, 8);
            const birth_date = `${birthYear}-${birthMonth}-${birthDay}`;
            
            // Parse TMT CPNS: YYYYMM
            const tmtCpnsStr = cleanNIP.substring(8, 14);
            const tmtYear = tmtCpnsStr.substring(0, 4);
            const tmtMonth = tmtCpnsStr.substring(4, 6);
            const tmt_cpns = `${tmtYear}-${tmtMonth}-01`;
            
            // Parse gender: 1 = Laki-laki, 2 = Perempuan
            const genderCode = cleanNIP.substring(14, 15);
            const gender = genderCode === '1' ? 'Laki-laki' : genderCode === '2' ? 'Perempuan' : '';
            
            // Validate dates
            const birthDateObj = new Date(birth_date);
            const tmtCpnsObj = new Date(tmt_cpns);
            
            if (!isNaN(birthDateObj.getTime()) && !isNaN(tmtCpnsObj.getTime())) {
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
            console.error('Error parsing NIP:', error);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (employee) {
      console.log('=== EMPLOYEE DATA FOR EDIT ===');
      console.log('Gender:', employee.gender);
      console.log('Religion:', employee.religion);
      console.log('Full employee:', employee);
      
      // Normalize gender value to match options exactly
      let normalizedGender = employee.gender || '';
      if (normalizedGender) {
        const genderLower = normalizedGender.toLowerCase().trim();
        if (genderLower === 'l' || genderLower === 'laki-laki' || genderLower === 'laki laki') {
          normalizedGender = 'Laki-laki';
        } else if (genderLower === 'p' || genderLower === 'perempuan') {
          normalizedGender = 'Perempuan';
        }
      }
      
      // Normalize religion value to match options exactly
      let normalizedReligion = employee.religion || '';
      if (normalizedReligion) {
        const religionLower = normalizedReligion.toLowerCase().trim();
        // Capitalize first letter to match options
        normalizedReligion = religionLower.charAt(0).toUpperCase() + religionLower.slice(1);
      }
      
      console.log('Normalized Gender:', normalizedGender);
      console.log('Normalized Religion:', normalizedReligion);
      
      // Store original values for change detection
      setOriginalValues({
        rank_group: employee.rank_group || '',
        position_name: employee.position_name || '',
        department: employee.department || '',
      });
      
      form.reset({
        nip: employee.nip || '', name: employee.name,
        front_title: employee.front_title || '', back_title: employee.back_title || '',
        birth_place: employee.birth_place || '', birth_date: employee.birth_date || '',
        gender: normalizedGender, religion: normalizedReligion,
        position_type: employee.position_type || '',
        position_name: employee.position_name || '', asn_status: employee.asn_status || '',
        rank_group: employee.rank_group || '', department: employee.department,
        join_date: employee.join_date || '', tmt_cpns: employee.tmt_cpns || '',
        tmt_pns: employee.tmt_pns || '', tmt_pensiun: employee.tmt_pensiun || '',
      });
      
      // Debug: Check form values after reset
      setTimeout(() => {
        console.log('=== FORM VALUES AFTER RESET ===');
        console.log('Gender:', form.getValues('gender'));
        console.log('Religion:', form.getValues('religion'));
      }, 100);
      
      setEducationEntries(initialEducation || []);
      setMutationEntries(initialMutationHistory || []);
      setPositionHistoryEntries(initialPositionHistory || []);
      setRankHistoryEntries(initialRankHistory || []);
      setCompetencyEntries(initialCompetencyTestHistory || []);
      setTrainingEntries(initialTrainingHistory || []);
      setPlacementNotes(initialPlacementNotes || []);
      setAssignmentNotes(initialAssignmentNotes || []);
      setChangeNotes(initialChangeNotes || []);
    } else {
      // Reset original values for new employee
      setOriginalValues({ rank_group: '', position_name: '', department: '' });
      
      form.reset({
        nip: '', name: '', front_title: '', back_title: '',
        birth_place: '', birth_date: '', gender: '', religion: '',
        position_type: '', position_name: '',
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
    }
  }, [employee, profile, form, initialEducation, initialMutationHistory, initialPositionHistory, initialRankHistory, initialCompetencyTestHistory, initialTrainingHistory, initialPlacementNotes, initialAssignmentNotes, initialChangeNotes]);

  const handleSubmit = async (data: z.infer<typeof employeeSchema>) => {
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
    });
  };

  const renderSelectField = (
    label: string, fieldName: keyof z.infer<typeof employeeSchema>,
    options: readonly string[], placeholder: string, required = false, disabled = false, helpText?: string
  ) => {
    const currentValue = form.watch(fieldName) as string;
    
    // Debug logging for gender and religion
    if (fieldName === 'gender' || fieldName === 'religion') {
      console.log(`${fieldName} - currentValue: "${currentValue}"`);
    }
    
    return (
      <div className="space-y-2">
        <Label>{label}{required && ' *'}</Label>
        <Select
          value={currentValue || ''}
          onValueChange={(v) => {
            console.log(`${fieldName} changed to: "${v}"`);
            form.setValue(fieldName, v, { shouldValidate: true, shouldDirty: true });
          }}
          disabled={disabled}
        >
          <SelectTrigger>
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

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight the section briefly
      ref.current.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        ref.current?.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
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
          {/* Identity Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Pribadi</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Opsional)</Label>
                <Input id="nip" placeholder="18 digit NIP" maxLength={18} {...form.register('nip')} />
                {form.formState.errors.nip && <p className="text-xs text-destructive">{form.formState.errors.nip.message}</p>}
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
              
              {/* Locked Field: Golongan/Pangkat */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Golongan/Pangkat
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => scrollToSection(rankHistoryRef)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={form.watch('rank_group') || '-'}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Untuk mengubah pangkat, tambahkan entry di Riwayat Kenaikan Pangkat
                </p>
              </div>

              {/* Normal Field: Jenis Jabatan */}
              {renderSelectField('Jenis Jabatan', 'position_type', POSITION_TYPES, 'Pilih jenis jabatan')}

              {/* Locked Field: Nama Jabatan */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Nama Jabatan
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => scrollToSection(positionHistoryRef)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={form.watch('position_name') || '-'}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Untuk mengubah nama jabatan, tambahkan entry di Riwayat Jabatan
                </p>
              </div>

              {/* Locked Field: Unit Kerja */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Unit Kerja *
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => scrollToSection(mutationHistoryRef)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={form.watch('department') || '-'}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {!isAdminPusat && (
                  <p className="text-xs text-muted-foreground">Unit kerja otomatis sesuai dengan unit Anda</p>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    💡 Untuk mutasi unit kerja, tambahkan entry di Riwayat Mutasi
                  </p>
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

          <Separator />

          {/* Education Section */}
          <EducationHistoryForm entries={educationEntries} onChange={setEducationEntries} />

          <Separator />

          {/* Mutation History */}
          <div ref={mutationHistoryRef} className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Mutasi"
              fields={MUTATION_FIELDS}
              entries={mutationEntries}
              onChange={setMutationEntries}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Unit kerja asal akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
          </div>

          <Separator />

          {/* Position History */}
          <div ref={positionHistoryRef} className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Jabatan"
              fields={POSITION_HISTORY_FIELDS}
              entries={positionHistoryEntries}
              onChange={setPositionHistoryEntries}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Jabatan lama akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
          </div>

          <Separator />

          {/* Rank History */}
          <div ref={rankHistoryRef} className="scroll-mt-4 transition-all duration-300">
            <EmployeeHistoryForm
              title="Riwayat Kenaikan Pangkat"
              fields={RANK_HISTORY_FIELDS}
              entries={rankHistoryEntries}
              onChange={setRankHistoryEntries}
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              💡 Pangkat lama akan otomatis terisi dari riwayat sebelumnya atau data saat ini
            </p>
          </div>

          <Separator />

          {/* Competency Test History */}
          <EmployeeHistoryForm
            title="Riwayat Uji Kompetensi"
            fields={COMPETENCY_TEST_FIELDS}
            entries={competencyEntries}
            onChange={setCompetencyEntries}
          />

          <Separator />

          {/* Training History */}
          <EmployeeHistoryForm
            title="Riwayat Diklat"
            fields={TRAINING_FIELDS}
            entries={trainingEntries}
            onChange={setTrainingEntries}
          />

          <Separator />

          {/* Keterangan Penempatan */}
          <NotesForm
            title="Keterangan Penempatan"
            entries={placementNotes}
            onChange={setPlacementNotes}
            placeholder="Contoh: Ditempatkan di Subbag Kepegawaian sejak 2020"
          />

          <Separator />

          {/* Keterangan Penugasan Tambahan */}
          <NotesForm
            title="Keterangan Penugasan Tambahan"
            entries={assignmentNotes}
            onChange={setAssignmentNotes}
            placeholder="Contoh: Sertigas sebagai Koordinator Bidang X tgl 24 Oktober 2025"
          />

          <Separator />

          {/* Keterangan Perubahan */}
          <NotesForm
            title="Keterangan Perubahan"
            entries={changeNotes}
            onChange={setChangeNotes}
            placeholder="Contoh: PPPK TMT 1 Mei 2025, Mutasi dari Unit A ke Unit B"
          />

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
