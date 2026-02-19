import { Calendar, Building2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { ClaimPriorityIndicator } from './ClaimPriorityIndicator';
import { formatCurrency, formatShortDate, formatTimeUntil, getDeadlineUrgency, cn } from '@/lib/utils';
import type { Claim } from '@/types/claim';

interface ClaimCardProps {
  claim: Claim;
  isSelected: boolean;
  hasSelection: boolean;
  onClick: () => void;
}

const urgencyColors = {
  normal: 'text-muted-foreground',
  warning: 'text-status-pending',
  urgent: 'text-status-denied',
};

export function ClaimCard({ claim, isSelected, hasSelection, onClick }: ClaimCardProps) {
  const deadlineUrgency = claim.deadlineDate ? getDeadlineUrgency(claim.deadlineDate) : null;
  const timeUntilDeadline = claim.deadlineDate ? formatTimeUntil(claim.deadlineDate) : null;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all outline-none',
        isSelected
          ? 'shadow-lg bg-card relative z-10'
          : hasSelection
            ? 'bg-muted/50 hover:bg-muted/70'
            : 'hover:shadow-md',
        deadlineUrgency === 'urgent' && 'border-l-4 border-l-status-denied'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">
              {claim.patientName}
            </span>
            <ClaimPriorityIndicator priority={claim.priority} />
          </div>
          <p className="text-xs text-muted-foreground">{claim.id}</p>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{formatShortDate(claim.dateOfService)}</span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        <span>{claim.insuranceProvider}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-medium text-foreground">
          {formatCurrency(claim.amount)}
        </span>
        {timeUntilDeadline !== null && deadlineUrgency !== null && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            urgencyColors[deadlineUrgency]
          )}>
            <Clock className="h-3 w-3" />
            <span>{timeUntilDeadline}</span>
          </div>
        )}
      </div>

      {claim.denialReason && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
          {claim.denialReason}
        </p>
      )}
    </Card>
  );
}
