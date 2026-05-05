import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface Notification {
  id: string;
  recipient_role: string;
  recipient_department: string | null;
  type: 'employee_created' | 'employee_updated' | 'employee_deleted' | 'mutation_in';
  title: string;
  message: string;
  employee_id: string | null;
  employee_name: string | null;
  actor_name: string | null;
  actor_department: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { profile, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!role || !profile) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter eksplisit berdasarkan role (defense in depth, RLS juga sudah handle ini)
      if (role === 'admin_unit') {
        query = query
          .eq('recipient_role', 'admin_unit')
          .eq('recipient_department', profile.department);
      } else if (role === 'admin_pusat') {
        query = query.eq('recipient_role', 'admin_pusat');
      } else if (role === 'admin_pimpinan') {
        query = query.eq('recipient_role', 'admin_pimpinan');
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (err) {
      logger.error('[useNotifications] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [role, profile]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) {
      // Revert optimistic update on failure
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
    if (error) {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: false } : n)
      );
    }
  }, [notifications]);

  // Real-time subscription
  useEffect(() => {
    if (!role || !profile) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Only add if relevant to current user
          const isForAdminPusat = role === 'admin_pusat' && newNotif.recipient_role === 'admin_pusat';
          const isForAdminUnit =
            role === 'admin_unit' &&
            newNotif.recipient_role === 'admin_unit' &&
            newNotif.recipient_department === profile.department;
          const isForAdminPimpinan = role === 'admin_pimpinan' && newNotif.recipient_role === 'admin_pimpinan';

          if (isForAdminPusat || isForAdminUnit || isForAdminPimpinan) {
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, profile, fetchNotifications]);

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}

// Helper to create notifications - called from Employees.tsx
export async function createNotification(params: {
  type: Notification['type'];
  title: string;
  message: string;
  employee_id?: string;
  employee_name?: string;
  actor_id?: string;
  actor_name?: string;
  actor_department?: string;
  target_department?: string;
}) {
  type NotifInsert = {
    recipient_role: string;
    recipient_department: string | null;
    type: string;
    title: string;
    message: string;
    employee_id: string | null;
    employee_name: string | null;
    actor_id: string | null;
    actor_name: string | null;
    actor_department: string | null;
  };

  const notificationsToInsert: NotifInsert[] = [];

  const base: Omit<NotifInsert, 'recipient_role' | 'recipient_department'> = {
    type: params.type,
    title: params.title,
    message: params.message,
    employee_id: params.employee_id || null,
    employee_name: params.employee_name || null,
    actor_id: params.actor_id || null,
    actor_name: params.actor_name || null,
    actor_department: params.actor_department || null,
  };

  if (params.type === 'mutation_in') {
    if (params.target_department) {
      notificationsToInsert.push({ ...base, recipient_role: 'admin_unit', recipient_department: params.target_department });
    }
  } else {
    notificationsToInsert.push({ ...base, recipient_role: 'admin_pusat', recipient_department: null });
    // Also notify admin_pimpinan for all non-mutation_in events
    notificationsToInsert.push({ ...base, recipient_role: 'admin_pimpinan', recipient_department: null });
  }

  if (notificationsToInsert.length > 0) {
    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
    if (error) console.error('[createNotification] error:', error);
  }
}
