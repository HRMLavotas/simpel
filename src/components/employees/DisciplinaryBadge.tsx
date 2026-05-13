/**
 * DisciplinaryBadge Component
 * Badge to indicate employee has active disciplinary actions
 */

import { Badge } from '@/components/ui/badge';
import { Scale, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisciplinaryBadgeProps {
  count?: number;
  variant?: 'default' | 'compact';
  className?: string;
}

export function DisciplinaryBadge({ 
  count = 1, 
  variant = 'default',
  className 
}: DisciplinaryBadgeProps) {
  if (variant === 'compact') {
    return (
      <Badge 
        variant="destructive" 
        className={cn(
          "flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white",
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        <span className="text-xs font-semibold">HD</span>
      </Badge>
    );
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white",
        className
      )}
    >
      <Scale className="h-3.5 w-3.5" />
      <span>Hukuman Disiplin Aktif</span>
      {count > 1 && (
        <span className="ml-1 px-1.5 py-0.5 bg-red-800 rounded-full text-xs font-bold">
          {count}
        </span>
      )}
    </Badge>
  );
}
