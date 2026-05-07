import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export type AnnouncementType = 'info' | 'warning' | 'success' | 'error';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: number;
  created_at: string;
  created_by_name: string;
}

export interface CreateAnnouncementData {
  title: string;
  message: string;
  type: AnnouncementType;
  priority?: number;
  expires_at?: string | null;
}

/**
 * Hook to fetch active announcements for the current user
 */
export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_announcements');

      if (error) {
        logger.error('Error fetching announcements:', error);
        throw error;
      }

      return (data || []) as Announcement[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

/**
 * Hook to dismiss an announcement
 */
export function useDismissAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('announcement_dismissals')
        .insert({
          announcement_id: announcementId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate announcements query to refetch
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => {
      logger.error('Error dismissing announcement:', error);
      toast({
        title: 'Gagal menutup pengumuman',
        description: 'Terjadi kesalahan saat menutup pengumuman',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create a new announcement (Admin Pusat only)
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 0,
          expires_at: data.expires_at,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({
        title: 'Pengumuman berhasil dibuat',
        description: 'Pengumuman akan muncul di dashboard semua admin unit',
      });
    },
    onError: (error) => {
      logger.error('Error creating announcement:', error);
      toast({
        title: 'Gagal membuat pengumuman',
        description: 'Terjadi kesalahan saat membuat pengumuman',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch all announcements (Admin Pusat only - for management)
 */
export function useAllAnnouncements() {
  return useQuery({
    queryKey: ['all-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching all announcements:', error);
        throw error;
      }

      return data;
    },
  });
}

/**
 * Hook to update an announcement (Admin Pusat only)
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateAnnouncementData> & { is_active?: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({
        title: 'Pengumuman berhasil diperbarui',
      });
    },
    onError: (error) => {
      logger.error('Error updating announcement:', error);
      toast({
        title: 'Gagal memperbarui pengumuman',
        description: 'Terjadi kesalahan saat memperbarui pengumuman',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an announcement (Admin Pusat only)
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      toast({
        title: 'Pengumuman berhasil dihapus',
      });
    },
    onError: (error) => {
      logger.error('Error deleting announcement:', error);
      toast({
        title: 'Gagal menghapus pengumuman',
        description: 'Terjadi kesalahan saat menghapus pengumuman',
        variant: 'destructive',
      });
    },
  });
}
