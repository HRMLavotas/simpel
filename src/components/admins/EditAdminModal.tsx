import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS } from '@/lib/constants';
import { z } from 'zod';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
}

interface EditAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  currentUserId: string;
  onSuccess: () => void;
}

const editAdminSchema = z.object({
  full_name: z.string().trim().min(1, 'Nama harus diisi').max(100, 'Nama terlalu panjang'),
  department: z.string().min(1, 'Unit kerja harus dipilih'),
  role: z.enum(['admin_unit', 'admin_pusat', 'admin_pimpinan'], { required_error: 'Role harus dipilih' }),
});

export function EditAdminModal({ open, onOpenChange, admin, currentUserId, onSuccess }: EditAdminModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    role: 'admin_unit' as 'admin_unit' | 'admin_pusat' | 'admin_pimpinan',
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        full_name: admin.full_name,
        department: admin.department,
        role: admin.role as 'admin_unit' | 'admin_pusat' | 'admin_pimpinan',
      });
    }
  }, [admin]);

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    setErrors({});

    const result = editAdminSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check if trying to demote self
    if (admin.id === currentUserId && formData.role !== 'admin_pusat') {
      toast({
        variant: 'destructive',
        title: 'Tidak Diizinkan',
        description: 'Anda tidak dapat menurunkan role diri sendiri',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      logger.debug('=== UPDATING ADMIN ===');
      logger.debug('Admin ID:', admin.id);
      logger.debug('New data:', formData);
      
      // Update profile directly in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department,
        })
        .eq('id', admin.id);

      if (profileError) {
        logger.error('Profile update error:', profileError);
        throw new Error(profileError.message);
      }
      logger.debug('✅ Profile updated successfully');

      // Update role directly in database
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', admin.id);

      if (roleError) {
        logger.error('Role update error:', roleError);
        throw new Error(roleError.message);
      }
      logger.debug('✅ Role updated successfully');

      toast({
        title: 'Berhasil',
        description: `Admin ${formData.full_name} berhasil diperbarui`,
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      logger.error('Error updating admin:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal mengupdate admin',
        description: error.message || 'Terjadi kesalahan saat mengupdate admin',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelf = admin?.id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>
            Ubah informasi admin {admin?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Nama Lengkap</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_department">Unit Kerja</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit kerja" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-sm text-destructive">{errors.department}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin_unit' | 'admin_pusat' | 'admin_pimpinan') => 
                setFormData({ ...formData, role: value })
              }
              disabled={isSubmitting || isSelf}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_unit">Admin Unit</SelectItem>
                <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                <SelectItem value="admin_pimpinan">Admin Pimpinan</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-sm text-muted-foreground">
                Anda tidak dapat mengubah role diri sendiri
              </p>
            )}
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
