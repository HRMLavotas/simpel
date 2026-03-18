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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", styles.bg)}>
          <Icon className={cn("h-6 w-6", styles.icon)} />
        </div>
      </div>
      <Icon className={cn("stat-card-icon", styles.icon)} />
    </div>
  );
}
