import { Lightbulb, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ConfirmationCard } from './ConfirmationCard';
import { Badge } from '@/components/ui/badge';
import type { Claim, SuggestedAction } from '@/types/claim';
import type { PendingConfirmation } from '@/types/chat';

interface ActionConfirmationProps {
  confirmation: PendingConfirmation;
  claim: Claim;
  onAction: (
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => void;
}

const confidenceColors = {
  low: 'text-status-rejected',
  medium: 'text-status-pending',
  high: 'text-status-resolved',
};

const urgencyConfig = {
  low: { color: 'bg-status-underpaid/10 text-status-underpaid', icon: Clock },
  medium: { color: 'bg-status-pending/10 text-status-pending', icon: Clock },
  high: { color: 'bg-status-rejected/10 text-status-rejected', icon: AlertTriangle },
  critical: { color: 'bg-status-denied/10 text-status-denied', icon: AlertTriangle },
};

export function ActionConfirmation({ confirmation, claim, onAction }: ActionConfirmationProps) {
  const data = confirmation.data as SuggestedAction;
  const UrgencyIcon = urgencyConfig[data.urgency].icon;

  return (
    <ConfirmationCard
      title={`Recommendation for ${claim.id}`}
      icon={<Lightbulb className="h-5 w-5 text-[#16a34a]" />}
      status={confirmation.status}
      onApprove={() => onAction(confirmation, 'approve')}
      onDismiss={() => onAction(confirmation, 'dismiss')}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={urgencyConfig[data.urgency].color}>
            <UrgencyIcon className="h-3 w-3 mr-1" />
            {data.urgency.charAt(0).toUpperCase() + data.urgency.slice(1)} Urgency
          </Badge>
          <span className={`text-xs flex items-center gap-1 ${confidenceColors[data.confidence]}`}>
            <CheckCircle className="h-3 w-3" />
            {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)} Confidence
          </span>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium text-foreground">{data.recommendedAction}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{data.reasoning}</p>
        </div>

        {data.nextSteps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Next Steps:</p>
            <ul className="space-y-1">
              {data.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ConfirmationCard>
  );
}
