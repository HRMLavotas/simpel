import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAnnouncements, useDismissAnnouncement, type Announcement } from '@/hooks/useAnnouncements';
import { cn } from '@/lib/utils';

const typeConfig = {
  info: {
    icon: Info,
    className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100',
    iconClassName: 'text-green-600 dark:text-green-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-500/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
};

interface AnnouncementItemProps {
  announcement: Announcement;
  onDismiss: (id: string) => void;
}

function AnnouncementItem({ announcement, onDismiss }: AnnouncementItemProps) {
  const config = typeConfig[announcement.type];
  const Icon = config.icon;

  return (
    <Alert className={cn('relative pr-12', config.className)}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <AlertTitle className="font-semibold">{announcement.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div 
          className="announcement-banner-content text-sm"
          dangerouslySetInnerHTML={{ __html: announcement.message }}
        />
      </AlertDescription>
      <div className="mt-2 text-xs opacity-70">
        Dari: {announcement.created_by_name} • {new Date(announcement.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        onClick={() => onDismiss(announcement.id)}
        aria-label="Tutup pengumuman"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}

/**
 * AnnouncementBanner component displays active announcements at the top of the dashboard
 * Users can dismiss announcements, and they won't see them again
 */
export function AnnouncementBanner() {
  const { data: announcements, isLoading } = useAnnouncements();
  const dismissMutation = useDismissAnnouncement();

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id);
  };

  // Don't render anything if loading or no announcements
  if (isLoading || !announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      {announcements.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
