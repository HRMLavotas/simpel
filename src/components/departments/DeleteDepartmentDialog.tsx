import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface DeleteDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: () => void;
}

export function DeleteDepartmentDialog({ open, onOpenChange, department, onSuccess }: DeleteDepartmentDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!department) return;

    setIsDeleting(true);

    try {
      // Check if department is being used by employees
      const { data: employees, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('department', department.name)
        .limit(1);

      if (checkError) throw checkError;

      if (employees && employees.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak dapat menghapus',
          description: 'Unit kerja ini masih digunakan oleh pegawai. Pindahkan pegawai terlebih dahulu.',
        });
        setIsDeleting(false);
        return;
      }

      // Check if department is being used by profiles
      const { data: profiles, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('department', department.name)
        .limit(1);

      if (profileCheckError) throw profileCheckError;

      if (profiles && profiles.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak dapat menghapus',
          description: 'Unit kerja ini masih digunakan oleh admin. Ubah unit kerja admin terlebih dahulu.',
        });
        setIsDeleting(false);
        return;
      }

      // Delete department
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Unit kerja berhasil dihapus',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      logger.error('Error deleting department:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menghapus',
        description: error.message || 'Terjadi kesalahan saat menghapus unit kerja',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Hapus Unit Kerja</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus unit kerja ini?
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong className="font-semibold">{department?.name}</strong>
            <br />
            Tindakan ini tidak dapat dibatalkan. Unit kerja akan dihapus secara permanen.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
