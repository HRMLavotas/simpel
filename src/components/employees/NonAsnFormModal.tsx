import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, GENDER_OPTIONS, RELIGION_OPTIONS, type Department } from '@/lib/constants';
import { useEmployeeValidation } from '@/hooks/useEmployeeValidation';
import { EducationHistoryForm, type EducationEntry } from './EducationHistoryForm';
import { EmployeeHistoryForm, type HistoryEntry, POSITION_HISTORY_FIELDS } from './EmployeeHistoryForm';
import { logger } from '@/lib/logger';

interface NonAsnFormData {
  nip: string;  // Using nip field for NIK
  name: string;
  position_name: string;  // Using position_name for jabatan
  birth_place: string;
  birth_date: string;
  gender: string;
  religion: string;
  department: Department;
  rank_group: string;  // Using rank_group for type_non_asn
  keterangan_penugasan: string;  // Using keterangan_penugasan for job_description
  keterangan_perubahan: string;  // Using keterangan_perubahan for notes
}

interface NonAsnFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: any;
  userDepartment?: Department;
  isAdminPusat?: boolean;
  initialEducation?: EducationEntry[];
  initialPositionHistory?: HistoryEntry[];
}

const TYPE_NON_ASN_OPTIONS = [
  'Tenaga Alih Daya',
  'Tenaga Ahli',
];

export function NonAsnFormModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
  userDepartment,
  isAdminPusat = false,
  initialEducation,
  initialPositionHistory,
}: NonAsnFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'education' | 'history'>('main');
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [positionHistoryEntries, setPositionHistoryEntries] = useState<HistoryEntry[]>([]);
  const [formData, setFormData] = useState<NonAsnFormData>({
    nip: '',
    name: '',
    position_name: '',
    birth_place: '',
    birth_date: '',
    gender: '',
    religion: '',
    department: userDepartment || 'Setditjen Binalavotas',
    rank_group: 'Tenaga Alih Daya',
    keterangan_penugasan: '',
    keterangan_perubahan: '',
  });

  const isEditing = !!editData;
  
  // Use validation hook
  const { validateNIK, nikValidation, resetNIKValidation } = useEmployeeValidation({ debounceMs: 500 });

  useEffect(() => {
    if (editData) {
      setFormData({
        nip: editData.nip || '',
        name: editData.name || '',
        position_name: editData.position_name || '',
        birth_place: editData.birth_place || '',
        birth_date: editData.birth_date || '',
        gender: editData.gender || '',
        religion: editData.religion || '',
        department: editData.department || userDepartment || 'Setditjen Binalavotas',
        rank_group: editData.rank_group || 'Tenaga Alih Daya',
        keterangan_penugasan: editData.keterangan_penugasan || '',
        keterangan_perubahan: editData.keterangan_perubahan || '',
      });
      setEducationEntries(initialEducation || []);
      setPositionHistoryEntries(initialPositionHistory || []);
    } else {
      setFormData({
        nip: '',
        name: '',
        position_name: '',
        birth_place: '',
        birth_date: '',
        gender: '',
        religion: '',
        department: userDepartment || 'Setditjen Binalavotas',
        rank_group: 'Tenaga Alih Daya',
        keterangan_penugasan: '',
        keterangan_perubahan: '',
      });
      setEducationEntries([]);
      setPositionHistoryEntries([]);
    }
    
    // Reset validation when modal opens/closes
    if (!open) {
      resetNIKValidation();
      setActiveTab('main');
    }
  }, [editData, userDepartment, open, resetNIKValidation, initialEducation, initialPositionHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.nip || !formData.name || !formData.position_name || !formData.department) {
        toast({
          variant: 'destructive',
          title: 'Data tidak lengkap',
          description: 'NIK, Nama, Jabatan, dan Unit Kerja wajib diisi',
        });
        setLoading(false);
        return;
      }
      
      // Check NIK validation status
      if (nikValidation.isLoading) {
        toast({
          variant: 'destructive',
          title: 'Validasi sedang berjalan',
          description: 'Mohon tunggu validasi NIK selesai',
        });
        setLoading(false);
        return;
      }
      
      if (!nikValidation.isValid) {
        toast({
          variant: 'destructive',
          title: 'NIK tidak valid',
          description: nikValidation.error || 'NIK sudah terdaftar',
        });
        setLoading(false);
        return;
      }

      const dataToSave = {
        nip: formData.nip,
        name: formData.name,
        position_name: formData.position_name,
        birth_place: formData.birth_place || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        religion: formData.religion || null,
        department: formData.department,
        asn_status: 'Non ASN' as const,
        rank_group: formData.rank_group,
        keterangan_penugasan: formData.keterangan_penugasan || null,
        keterangan_perubahan: formData.keterangan_perubahan || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('employees')
          .update(dataToSave)
          .eq('id', editData.id);

        if (error) throw error;

        // Update education history
        if (educationEntries.length > 0) {
          // Delete existing education entries
          await supabase
            .from('education_history')
            .delete()
            .eq('employee_id', editData.id);

          // Insert new education entries
          const educationData = educationEntries.map(entry => ({
            employee_id: editData.id,
            level: entry.level,
            institution_name: entry.institution_name || null,
            major: entry.major || null,
            graduation_year: entry.graduation_year ? parseInt(entry.graduation_year) : null,
            front_title: entry.front_title || null,
            back_title: entry.back_title || null,
          }));

          const { error: eduError } = await supabase
            .from('education_history')
            .insert(educationData);

          if (eduError) {
            logger.error('Error saving education history:', eduError);
            // Don't fail the entire operation if education save fails
          }
        }

        // Update position history
        if (positionHistoryEntries.length > 0) {
          // Delete existing position history entries
          await supabase
            .from('position_history')
            .delete()
            .eq('employee_id', editData.id);

          // Insert new position history entries
          const positionData = positionHistoryEntries.map(entry => ({
            employee_id: editData.id,
            tanggal: entry.tanggal || null,
            jabatan_lama: entry.jabatan_lama || null,
            jabatan_baru: entry.jabatan_baru || null,
            unit_kerja: entry.unit_kerja || null,
            nomor_sk: entry.nomor_sk || null,
            keterangan: entry.keterangan || null,
          }));

          const { error: posError } = await supabase
            .from('position_history')
            .insert(positionData);

          if (posError) {
            logger.error('Error saving position history:', posError);
            // Don't fail the entire operation if position history save fails
          }
        }

        toast({
          title: 'Berhasil',
          description: 'Data Non-ASN berhasil diperbarui',
        });
      } else {
        const { data: newEmployee, error } = await supabase
          .from('employees')
          .insert([dataToSave])
          .select('id')
          .single();

        if (error) throw error;

        // Insert education history if available
        if (newEmployee && educationEntries.length > 0) {
          const educationData = educationEntries.map(entry => ({
            employee_id: newEmployee.id,
            level: entry.level,
            institution_name: entry.institution_name || null,
            major: entry.major || null,
            graduation_year: entry.graduation_year ? parseInt(entry.graduation_year) : null,
            front_title: entry.front_title || null,
            back_title: entry.back_title || null,
          }));

          const { error: eduError } = await supabase
            .from('education_history')
            .insert(educationData);

          if (eduError) {
            logger.error('Error saving education history:', eduError);
            // Don't fail the entire operation if education save fails
          }
        }

        // Insert position history if available
        if (newEmployee && positionHistoryEntries.length > 0) {
          const positionData = positionHistoryEntries.map(entry => ({
            employee_id: newEmployee.id,
            tanggal: entry.tanggal || null,
            jabatan_lama: entry.jabatan_lama || null,
            jabatan_baru: entry.jabatan_baru || null,
            unit_kerja: entry.unit_kerja || null,
            nomor_sk: entry.nomor_sk || null,
            keterangan: entry.keterangan || null,
          }));

          const { error: posError } = await supabase
            .from('position_history')
            .insert(positionData);

          if (posError) {
            logger.error('Error saving position history:', posError);
            // Don't fail the entire operation if position history save fails
          }
        }

        toast({
          title: 'Berhasil',
          description: 'Data Non-ASN berhasil ditambahkan',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Error saving Non-ASN:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Data Non-ASN' : 'Tambah Non-ASN Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah informasi Non-ASN di bawah ini' : 'Lengkapi data Non-ASN baru di bawah ini'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'education' | 'history')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">Data Utama</TabsTrigger>
              <TabsTrigger value="education">Riwayat Pendidikan</TabsTrigger>
              <TabsTrigger value="history">Riwayat Jabatan</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-6">
              {/* Data Pribadi Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Pribadi</h3>
                <div className="grid gap-4 sm:grid-cols-2">
          {/* NIK */}
          <div className="space-y-2">
            <Label htmlFor="nip">NIK <span className="text-red-500">*</span></Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) => {
                const newNik = e.target.value;
                setFormData({ ...formData, nip: newNik });
                // Trigger validation with debounce
                if (newNik.length === 16) {
                  validateNIK(newNik, editData?.id);
                } else {
                  resetNIKValidation();
                }
              }}
              placeholder="Masukkan NIK (16 digit)"
              maxLength={16}
              required
            />
            {nikValidation.isLoading && (
              <p className="text-xs text-muted-foreground">
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                Memeriksa NIK...
              </p>
            )}
            {!nikValidation.isValid && nikValidation.error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{nikValidation.error}</AlertDescription>
              </Alert>
            )}
            {nikValidation.isValid && formData.nip.length === 16 && !nikValidation.isLoading && (
              <p className="text-xs text-green-600">✓ NIK tersedia</p>
            )}
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* Tempat Lahir */}
          <div className="space-y-2">
            <Label htmlFor="birth_place">Tempat Lahir</Label>
            <Input
              id="birth_place"
              value={formData.birth_place}
              onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              placeholder="Masukkan tempat lahir"
            />
          </div>

          {/* Tanggal Lahir */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">Tanggal Lahir</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-2">
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((gender) => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agama */}
          <div className="space-y-2">
            <Label htmlFor="religion">Agama</Label>
            <Select value={formData.religion} onValueChange={(value) => setFormData({ ...formData, religion: value })}>
              <SelectTrigger id="religion">
                <SelectValue placeholder="Pilih agama" />
              </SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((religion) => (
                  <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
                </div>
              </div>

              <Separator />

              {/* Data Kepegawaian Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Kepegawaian</h3>
                <div className="grid gap-4 sm:grid-cols-2">
          {/* Jabatan */}
          <div className="space-y-2">
            <Label htmlFor="position_name">Jabatan <span className="text-red-500">*</span></Label>
            <Input
              id="position_name"
              value={formData.position_name}
              onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              placeholder="Contoh: Pengemudi, Petugas Kebersihan, Pramubakti"
              required
            />
          </div>

          {/* Unit Kerja */}
          <div className="space-y-2">
            <Label htmlFor="department">Unit Kerja <span className="text-red-500">*</span></Label>
            <Select
              value={formData.department}
              onValueChange={(value: Department) => setFormData({ ...formData, department: value })}
              disabled={!isAdminPusat}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isAdminPusat && (
              <p className="text-xs text-muted-foreground">Unit kerja otomatis sesuai dengan unit Anda</p>
            )}
          </div>

          {/* Type Non ASN */}
          <div className="space-y-2">
            <Label htmlFor="rank_group">Type Non ASN <span className="text-red-500">*</span></Label>
            <Select value={formData.rank_group} onValueChange={(value) => setFormData({ ...formData, rank_group: value })}>
              <SelectTrigger id="rank_group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_NON_ASN_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deskripsi Tugas */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="keterangan_penugasan">Deskripsi Tugas</Label>
            <Textarea
              id="keterangan_penugasan"
              value={formData.keterangan_penugasan}
              onChange={(e) => setFormData({ ...formData, keterangan_penugasan: e.target.value })}
              placeholder="Masukkan deskripsi tugas (opsional)"
              rows={3}
            />
          </div>

          {/* Catatan */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="keterangan_perubahan">Catatan</Label>
            <Textarea
              id="keterangan_perubahan"
              value={formData.keterangan_perubahan}
              onChange={(e) => setFormData({ ...formData, keterangan_perubahan: e.target.value })}
              placeholder="Contoh: Pindahan dari unit lain, mengikuti pimpinan, dll"
              rows={2}
            />
          </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-6">
              {/* Education Section */}
              <EducationHistoryForm entries={educationEntries} onChange={setEducationEntries} />
              <p className="text-xs text-muted-foreground italic">
                💡 Data pendidikan akan ditampilkan di dashboard dan laporan
              </p>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Position History Section */}
              <EmployeeHistoryForm
                title="Riwayat Jabatan"
                fields={POSITION_HISTORY_FIELDS}
                entries={positionHistoryEntries}
                onChange={setPositionHistoryEntries}
              />
              <p className="text-xs text-muted-foreground italic">
                💡 Catat perubahan jabatan untuk tracking karir pegawai Non-ASN
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
              ) : (
                isEditing ? 'Simpan Perubahan' : 'Tambah Non-ASN'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
