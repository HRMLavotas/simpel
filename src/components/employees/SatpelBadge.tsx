import { cn } from '@/lib/utils';

interface SatpelBadgeProps {
  satpelName: string;
  className?: string;
}

export function SatpelBadge({ satpelName, className }: SatpelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
        "bg-amber-100 text-amber-800 border border-amber-200",
        className
      )}
    >
      {satpelName}
    </span>
  );
}
