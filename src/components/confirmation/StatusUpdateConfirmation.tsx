import { RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { ConfirmationCard } from './ConfirmationCard';
import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge';
import type { Claim, StatusUpdate } from '@/types/claim';
import type { PendingConfirmation } from '@/types/chat';

interface StatusUpdateConfirmationProps {
  confirmation: PendingConfirmation;
  claim: Claim;
  onAction: (
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => void;
}

export function StatusUpdateConfirmation({ confirmation, claim, onAction }: StatusUpdateConfirmationProps) {
  const data = confirmation.data as StatusUpdate;

  return (
    <ConfirmationCard
      title={`Update Status for ${claim.id}`}
      icon={<RefreshCw className="h-5 w-5 text-status-underpaid" />}
      status={confirmation.status}
      onApprove={() => onAction(confirmation, 'approve')}
      onDismiss={() => onAction(confirmation, 'dismiss')}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <AlertCircle className="h-4 w-4 text-secondary flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            This action will update the claim status. Please review before confirming.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <ClaimStatusBadge status={data.previousStatus} />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">New</p>
            <ClaimStatusBadge status={data.newStatus} />
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Action Taken</p>
            <p className="text-sm">{data.actionTaken}</p>
          </div>

          {data.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </ConfirmationCard>
  );
}
