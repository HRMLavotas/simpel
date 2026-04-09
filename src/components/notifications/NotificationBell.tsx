import { useState } from 'react';
import { Bell, Check, CheckCheck, Users, UserPlus, UserMinus, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const TYPE_CONFIG: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  employee_created: { icon: UserPlus,       color: 'text-green-600',  bg: 'bg-green-50' },
  employee_updated: { icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50'  },
  employee_deleted: { icon: UserMinus,      color: 'text-red-600',    bg: 'bg-red-50'   },
  mutation_in:      { icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50'},
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = (val: boolean) => {
    setOpen(val);
  };

  const handleMarkAsRead = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifikasi</p>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai semua
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map(notif => {
              const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.employee_updated;
              const Icon = config.icon;
              return (
                <button
                  key={notif.id}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50',
                    !notif.is_read && 'bg-blue-50/50'
                  )}
                  onClick={() => handleMarkAsRead(notif)}
                >
                  {/* Icon */}
                  <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-xs font-medium leading-snug', !notif.is_read && 'font-semibold')}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: localeId })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <p className="text-center text-xs text-muted-foreground">
              Menampilkan {notifications.length} notifikasi terbaru
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
