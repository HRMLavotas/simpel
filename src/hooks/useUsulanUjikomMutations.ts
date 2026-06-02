/**
 * React Hook for Usulan Ujikom Mutations (CUD Operations)
 * Task 4.2: useUsulanUjikomMutations hook
 * Created: 2026-06-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type {
  UsulanFormData,
  UsulanUpdateData,
  StatusChangeData,
  UsulanUjikomWithDetails,
} from '@/lib/usulan-ujikom/types';
import {
  createUsulan,
  updateUsulan,
  deleteUsulan,
  changeUsulanStatus,
  submitUsulan,
} from '@/lib/usulan-ujikom/storage';

/**
 * Hook for usulan mutations
 */
export function useUsulanUjikomMutations() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  /**
   * Create usulan mutation
   */
  const createMutation = useMutation({
    mutationFn: async (formData: UsulanFormData) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await createUsulan(formData, profile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      toast({
        title: 'Berhasil',
        description: 'Usulan ujikom berhasil dibuat',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal membuat usulan ujikom',
        variant: 'destructive',
      });
    },
  });

  /**
   * Update usulan mutation
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UsulanUpdateData }) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await updateUsulan(id, updates, profile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      toast({
        title: 'Berhasil',
        description: 'Usulan ujikom berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal memperbarui usulan ujikom',
        variant: 'destructive',
      });
    },
  });

  /**
   * Delete usulan mutation
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteUsulan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      toast({
        title: 'Berhasil',
        description: 'Usulan ujikom berhasil dihapus',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menghapus usulan ujikom',
        variant: 'destructive',
      });
    },
  });

  /**
   * Submit usulan mutation (Draft -> Diajukan/Waiting_List)
   */
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await submitUsulan(id, profile.id);
    },
    onSuccess: (data: UsulanUjikomWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      
      const message = data.status === 'Waiting_List'
        ? 'Formasi penuh. Usulan masuk daftar tunggu.'
        : 'Usulan berhasil diajukan';

      toast({
        title: 'Berhasil',
        description: message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal mengajukan usulan',
        variant: 'destructive',
      });
    },
  });

  /**
   * Change status mutation (for Admin Pusat)
   */
  const changeStatusMutation = useMutation({
    mutationFn: async (statusData: StatusChangeData) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await changeUsulanStatus(statusData, profile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      toast({
        title: 'Berhasil',
        description: 'Status usulan berhasil diubah',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal mengubah status usulan',
        variant: 'destructive',
      });
    },
  });

  /**
   * Cancel usulan mutation
   */
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await changeUsulanStatus(
        {
          usulan_id: id,
          new_status: 'Dibatalkan',
          cancellation_reason: reason,
        },
        profile.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usulan-ujikom'] });
      toast({
        title: 'Berhasil',
        description: 'Usulan berhasil dibatalkan',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal membatalkan usulan',
        variant: 'destructive',
      });
    },
  });

  return {
    createUsulan: createMutation,
    updateUsulan: updateMutation,
    deleteUsulan: deleteMutation,
    submitUsulan: submitMutation,
    changeStatus: changeStatusMutation,
    cancelUsulan: cancelMutation,
  };
}
