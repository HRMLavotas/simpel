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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: () => void;
}

const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit kerja harus diisi').max(255, 'Nama terlalu panjang'),
});

export function DepartmentFormModal({ open, onOpenChange, department, onSuccess }: DepartmentFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name);
    } else {
      setName('');
    }
    setErrors({});
  }, [department, open]);

  const handleClose = () => {
    setName('');
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = departmentSchema.safeParse({ name });
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

    setIsSubmitting(true);

    try {
      if (department) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({ name: name.trim() })
          .eq('id', department.id);

        if (error) {
          if (error.code === '23505') {
            throw new Error('Nama unit kerja sudah digunakan');
          }
          throw error;
        }

        toast({
          title: 'Berhasil',
          description: 'Unit kerja berhasil diperbarui',
        });
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert({ name: name.trim() });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Nama unit kerja sudah digunakan');
          }
          throw error;
        }

        toast({
          title: 'Berhasil',
          description: 'Unit kerja berhasil ditambahkan',
        });
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      logger.error('Error saving department:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan unit kerja',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Unit Kerja' : 'Tambah Unit Kerja'}</DialogTitle>
          <DialogDescription>
            {department ? 'Ubah nama unit kerja' : 'Tambahkan unit kerja baru ke sistem'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Unit Kerja</Label>
            <Input
              id="name"
              placeholder="Contoh: BBPVP Jakarta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
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
