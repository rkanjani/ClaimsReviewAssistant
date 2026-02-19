import { Calendar, Building2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { ClaimPriorityIndicator } from './ClaimPriorityIndicator';
import { formatCurrency, formatShortDate, getDaysUntil, cn } from '@/lib/utils';
import type { Claim } from '@/types/claim';

interface ClaimCardProps {
  claim: Claim;
  isSelected: boolean;
  onClick: () => void;
}

export function ClaimCard({ claim, isSelected, onClick }: ClaimCardProps) {
  const daysUntilDeadline = claim.deadlineDate ? getDaysUntil(claim.deadlineDate) : null;
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 14;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md',
        isUrgent && 'border-l-4 border-l-status-denied'
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

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          <span className="truncate max-w-[100px]">{claim.insuranceProvider}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatShortDate(claim.dateOfService)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-medium text-foreground">
          {formatCurrency(claim.amount)}
        </span>
        {daysUntilDeadline !== null && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isUrgent ? 'text-status-denied' : 'text-muted-foreground'
          )}>
            <Clock className="h-3 w-3" />
            <span>{daysUntilDeadline} days</span>
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
