import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { DEPARTMENTS, ASN_STATUS_OPTIONS, POSITION_TYPES, RANK_GROUPS_PNS, RANK_GROUPS_PPPK, GENDER_OPTIONS, RELIGION_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { EducationHistoryForm, type EducationEntry } from './EducationHistoryForm';

const employeeSchema = z.object({
  nip: z.string().max(18, 'NIP maksimal 18 digit').optional().or(z.literal('')),
  name: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  front_title: z.string().max(50).optional().or(z.literal('')),
  back_title: z.string().max(50).optional().or(z.literal('')),
  birth_place: z.string().max(100).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  religion: z.string().optional().or(z.literal('')),
  old_position: z.string().max(255).optional().or(z.literal('')),
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
  old_position: string | null;
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
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSubmit,
  isLoading,
  initialEducation,
}: EmployeeFormModalProps) {
  const { profile, isAdminPusat } = useAuth();
  const isEditing = !!employee;
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nip: '', name: '', front_title: '', back_title: '',
      birth_place: '', birth_date: '', gender: '', religion: '',
      old_position: '', position_type: '', position_name: '',
      asn_status: '', rank_group: '', department: profile?.department || '',
      join_date: '', tmt_cpns: '', tmt_pns: '', tmt_pensiun: '',
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        nip: employee.nip || '', name: employee.name,
        front_title: employee.front_title || '', back_title: employee.back_title || '',
        birth_place: employee.birth_place || '', birth_date: employee.birth_date || '',
        gender: employee.gender || '', religion: employee.religion || '',
        old_position: employee.old_position || '', position_type: employee.position_type || '',
        position_name: employee.position_name || '', asn_status: employee.asn_status || '',
        rank_group: employee.rank_group || '', department: employee.department,
        join_date: employee.join_date || '', tmt_cpns: employee.tmt_cpns || '',
        tmt_pns: employee.tmt_pns || '', tmt_pensiun: employee.tmt_pensiun || '',
      });
      setEducationEntries(initialEducation || []);
    } else {
      form.reset({
        nip: '', name: '', front_title: '', back_title: '',
        birth_place: '', birth_date: '', gender: '', religion: '',
        old_position: '', position_type: '', position_name: '',
        asn_status: '', rank_group: '', department: profile?.department || '',
        join_date: '', tmt_cpns: '', tmt_pns: '', tmt_pensiun: '',
      });
      setEducationEntries([]);
    }
  }, [employee, profile, form, initialEducation]);

  const handleSubmit = async (data: z.infer<typeof employeeSchema>) => {
    await onSubmit({ ...data, education_history: educationEntries });
  };

  const renderSelectField = (
    label: string, fieldName: keyof z.infer<typeof employeeSchema>,
    options: readonly string[], placeholder: string, required = false, disabled = false, helpText?: string
  ) => (
    <div className="space-y-2">
      <Label>{label}{required && ' *'}</Label>
      <Select
        value={form.watch(fieldName)}
        onValueChange={(v) => form.setValue(fieldName, v)}
        disabled={disabled}
      >
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
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

  const getRankOptions = () => {
    const status = form.watch('asn_status');
    if (status === 'PPPK') return RANK_GROUPS_PPPK as unknown as string[];
    if (status === 'PNS') return RANK_GROUPS_PNS as unknown as string[];
    return ['Tidak Ada'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              {renderSelectField('Golongan/Pangkat', 'rank_group', getRankOptions(), 'Pilih golongan', false, false,
                form.watch('asn_status') === 'Non ASN' ? 'Non ASN tidak memiliki golongan' : undefined
              )}
              {renderSelectField('Jenis Jabatan', 'position_type', POSITION_TYPES, 'Pilih jenis jabatan')}

              <div className="space-y-2">
                <Label htmlFor="position_name">Nama Jabatan</Label>
                <Input id="position_name" placeholder="Contoh: Analis Kepegawaian" {...form.register('position_name')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="old_position">Jabatan Lama</Label>
                <Input id="old_position" placeholder="Jabatan sebelumnya (opsional)" {...form.register('old_position')} />
              </div>

              <div className="space-y-2">
                <Label>Unit Kerja *</Label>
                <Select
                  value={form.watch('department')}
                  onValueChange={(v) => form.setValue('department', v)}
                  disabled={!isAdminPusat}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih unit kerja" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.filter(d => d !== 'Pusat').map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.department && <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>}
                {!isAdminPusat && <p className="text-xs text-muted-foreground">Unit kerja otomatis sesuai dengan unit Anda</p>}
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
