import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClaimPriority } from '@/types/claim';

interface ClaimPriorityIndicatorProps {
  priority: ClaimPriority;
  showLabel?: boolean;
}

const priorityConfig: Record<ClaimPriority, { icon: React.ElementType; color: string; label: string }> = {
  urgent: { icon: AlertTriangle, color: 'text-status-denied', label: 'Urgent priority' },
  high: { icon: ArrowUp, color: 'text-status-rejected', label: 'High priority' },
  medium: { icon: Minus, color: 'text-status-pending', label: 'Medium priority' },
  low: { icon: ArrowDown, color: 'text-status-underpaid', label: 'Low priority' },
};

export function ClaimPriorityIndicator({ priority, showLabel = false }: ClaimPriorityIndicatorProps) {
  const { icon: Icon, color, label } = priorityConfig[priority];

  return (
    <div className={cn('flex items-center gap-1', color)}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
