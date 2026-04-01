import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS, type Department } from '@/lib/constants';

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
}

const GENDER_OPTIONS = ['Laki-laki', 'Perempuan'];

const RELIGION_OPTIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
];

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
}: NonAsnFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    }
  }, [editData, userDepartment, open]);

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

        toast({
          title: 'Berhasil',
          description: 'Data Non-ASN berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Data Non-ASN berhasil ditambahkan',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving Non-ASN:', error);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NIK */}
          <div className="space-y-2">
            <Label htmlFor="nip">NIK <span className="text-red-500">*</span></Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              placeholder="Masukkan NIK"
              required
            />
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
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Pilih agama" />
              </SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((religion) => (
                  <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          {/* Type Non ASN */}
          <div className="space-y-2">
            <Label htmlFor="rank_group">Type Non ASN <span className="text-red-500">*</span></Label>
            <Select value={formData.rank_group} onValueChange={(value) => setFormData({ ...formData, rank_group: value })}>
              <SelectTrigger>
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
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="keterangan_perubahan">Catatan</Label>
            <Textarea
              id="keterangan_perubahan"
              value={formData.keterangan_perubahan}
              onChange={(e) => setFormData({ ...formData, keterangan_perubahan: e.target.value })}
              placeholder="Contoh: Pindahan dari unit lain, mengikuti pimpinan, dll"
              rows={2}
            />
          </div>

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
