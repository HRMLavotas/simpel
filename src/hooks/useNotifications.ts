import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [role, profile]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
  }, []);

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

          if (isForAdminPusat || isForAdminUnit) {
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
  // For mutation_in: the new department that receives the employee
  target_department?: string;
}) {
  const notificationsToInsert: Record<string, unknown>[] = [];

  if (params.type === 'mutation_in') {
    // Notify the admin_unit of the receiving department
    if (params.target_department) {
      notificationsToInsert.push({
        recipient_role: 'admin_unit',
        recipient_department: params.target_department,
        type: params.type,
        title: params.title,
        message: params.message,
        employee_id: params.employee_id || null,
        employee_name: params.employee_name || null,
        actor_id: params.actor_id || null,
        actor_name: params.actor_name || null,
        actor_department: params.actor_department || null,
      });
    }
  } else {
    // Notify admin_pusat for all employee changes by admin_unit
    notificationsToInsert.push({
      recipient_role: 'admin_pusat',
      recipient_department: null,
      type: params.type,
      title: params.title,
      message: params.message,
      employee_id: params.employee_id || null,
      employee_name: params.employee_name || null,
      actor_id: params.actor_id || null,
      actor_name: params.actor_name || null,
      actor_department: params.actor_department || null,
    });
  }

  if (notificationsToInsert.length > 0) {
    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
    if (error) console.error('[createNotification] error:', error);
  }
}
