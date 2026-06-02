/**
 * Status Badge Component
 * Task 5.1: StatusBadge component with color coding
 * Created: 2026-06-02
 */

import { Badge } from '@/components/ui/badge';
import { STATUS_BADGE_COLORS, STATUS_LABELS, type UsulanStatus } from '@/lib/usulan-ujikom/types';

interface StatusBadgeProps {
  status: UsulanStatus;
  className?: string;
}

const badgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  gray: 'secondary',
  yellow: 'outline',
  blue: 'default',
  purple: 'outline',
  orange: 'outline',
  green: 'default',
  red: 'destructive',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorKey = STATUS_BADGE_COLORS[status];
  const label = STATUS_LABELS[status];
  const variant = badgeVariants[colorKey] || 'default';

  // Custom color styles
  const colorStyles: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-300',
    orange: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-300',
  };

  const customClass = colorStyles[colorKey] || '';

  return (
    <Badge variant={variant} className={`${customClass} ${className || ''}`}>
      {label}
    </Badge>
  );
}
