import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  description?: string;
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground',
    bg: 'bg-muted/50',
  },
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  success: {
    icon: 'text-success',
    bg: 'bg-success/10',
  },
  warning: {
    icon: 'text-warning',
    bg: 'bg-warning/10',
  },
  info: {
    icon: 'text-info',
    bg: 'bg-info/10',
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default',
  description 
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg flex-shrink-0", styles.bg)}>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", styles.icon)} />
        </div>
      </div>
      <Icon className={cn("stat-card-icon", styles.icon)} />
    </div>
  );
}
