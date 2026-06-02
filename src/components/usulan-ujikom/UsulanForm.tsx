/**
 * Usulan Form Component (Create/Edit)
 * Task 7.1: Form for creating and editing usulan
 * Created: 2026-06-02
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsulanUjikomMutations } from '@/hooks/useUsulanUjikomMutations';
import { usulanFormSchema, type UsulanFormValues } from '@/lib/usulan-ujikom/validation';
import type { UsulanUjikomWithDetails } from '@/lib/usulan-ujikom/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { PetaJabatanSelector } from './PetaJabatanSelector';
import { EmployeeSelector } from './EmployeeSelector';
import { DocumentUpload } from './DocumentUpload';

interface UsulanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usulan?: UsulanUjikomWithDetails | null;
  mode: 'create' | 'edit';
}

export function UsulanForm({ open, onOpenChange, usulan, mode }: UsulanFormProps) {
  const { profile } = useAuth();
  const { createUsulan, updateUsulan } = useUsulanUjikomMutations();

  const form = useForm<UsulanFormValues>({
    resolver: zodResolver(usulanFormSchema),
    defaultValues: {
      employee_id: '',
      position_reference_id: '',
      department_id: profile?.department || '',
      surat_pengantar_file: null,
      link_dokumen_persyaratan: '',
      admin_notes: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && usulan) {
      form.reset({
        employee_id: usulan.employee_id,
        position_reference_id: usulan.position_reference_id,
        department_id: usulan.department.id,
        surat_pengantar_file: null, // Keep existing file
        link_dokumen_persyaratan: usulan.link_dokumen_persyaratan || '',
        admin_notes: usulan.admin_notes || '',
      });
    } else if (mode === 'create') {
      form.reset({
        employee_id: '',
        position_reference_id: '',
        department_id: profile?.department || '',
        surat_pengantar_file: null,
        link_dokumen_persyaratan: '',
        admin_notes: '',
      });
    }
  }, [mode, usulan, form, profile]);

  const onSubmit = async (data: UsulanFormValues) => {
    try {
      if (mode === 'create') {
        await createUsulan.mutateAsync(data);
      } else if (usulan) {
        await updateUsulan.mutateAsync({
          id: usulan.id,
          updates: {
            position_reference_id: data.position_reference_id,
            link_dokumen_persyaratan: data.link_dokumen_persyaratan,
            admin_notes: data.admin_notes,
            surat_pengantar_file: data.surat_pengantar_file,
          },
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving usulan:', error);
    }
  };

  const isLoading = createUsulan.isPending || updateUsulan.isPending;
  const canEdit = !usulan || usulan.status === 'Draft' || usulan.status === 'Waiting_List';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Buat Usulan Ujikom Baru' : 'Edit Usulan Ujikom'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Isi formulir di bawah untuk mengajukan usulan ujikom pegawai.'
              : 'Edit informasi usulan ujikom. Hanya usulan dengan status Draft atau Daftar Tunggu yang dapat diedit.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Selector */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pegawai</FormLabel>
                  <FormControl>
                    <EmployeeSelector
                      value={field.value}
                      onChange={field.onChange}
                      departmentId={form.watch('department_id')}
                      positionReferenceId={form.watch('position_reference_id')}
                      disabled={isLoading || mode === 'edit'}
                      error={form.formState.errors.employee_id?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position Selector */}
            <FormField
              control={form.control}
              name="position_reference_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan Target (dari Peta Jabatan)</FormLabel>
                  <FormControl>
                    <PetaJabatanSelector
                      value={field.value}
                      onChange={field.onChange}
                      departmentId={form.watch('department_id')}
                      disabled={isLoading || !canEdit}
                      error={form.formState.errors.position_reference_id?.message}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Pilih jabatan fungsional target dari Peta Jabatan unit kerja Anda
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Upload */}
            <FormField
              control={form.control}
              name="surat_pengantar_file"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DocumentUpload
                      suratPengantarFile={field.value}
                      onSuratPengantarChange={field.onChange}
                      suratPengantarUrl={usulan?.surat_pengantar_url}
                      linkDokumenPersyaratan={form.watch('link_dokumen_persyaratan')}
                      onLinkDokumenChange={(value) =>
                        form.setValue('link_dokumen_persyaratan', value)
                      }
                      fileError={form.formState.errors.surat_pengantar_file?.message}
                      linkError={form.formState.errors.link_dokumen_persyaratan?.message}
                      disabled={isLoading || !canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Notes */}
            <FormField
              control={form.control}
              name="admin_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tambahkan catatan untuk usulan ini..."
                      rows={3}
                      disabled={isLoading || !canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading || !canEdit}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Simpan Draft' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
