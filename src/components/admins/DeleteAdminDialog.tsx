import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
}

interface DeleteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  currentUserId: string;
  onSuccess: () => void;
}

export function DeleteAdminDialog({ open, onOpenChange, admin, currentUserId, onSuccess }: DeleteAdminDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!admin) return;

    if (admin.id === currentUserId) {
      toast({
        variant: 'destructive',
        title: 'Tidak Diizinkan',
        description: 'Anda tidak dapat menghapus akun diri sendiri',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-admin-user', {
        body: { user_id: admin.id },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Gagal menghapus admin');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Berhasil',
        description: `Admin ${admin.full_name} berhasil dihapus`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menghapus admin',
        description: error.message || 'Terjadi kesalahan saat menghapus admin',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isSelf = admin?.id === currentUserId;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Hapus Admin
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isSelf ? (
              <span className="text-destructive font-medium">
                Anda tidak dapat menghapus akun diri sendiri.
              </span>
            ) : (
              <>
                <span>Apakah Anda yakin ingin menghapus admin berikut?</span>
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="font-medium">{admin?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{admin?.email}</p>
                </div>
                <span className="text-destructive font-medium block mt-3">
                  Tindakan ini tidak dapat dibatalkan. Semua data terkait admin ini akan dihapus.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Batal
          </Button>
          {!isSelf && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
