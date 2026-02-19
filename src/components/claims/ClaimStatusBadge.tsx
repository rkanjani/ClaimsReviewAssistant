import { Badge } from '@/components/ui/badge';
import type { ClaimStatus } from '@/types/claim';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
}

const statusLabels: Record<ClaimStatus, string> = {
  denied: 'Denied',
  rejected: 'Rejected',
  pending: 'Pending',
  underpaid: 'Underpaid',
  resolved: 'Resolved',
  appealed: 'Appealed',
};

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  return (
    <Badge variant={status}>
      {statusLabels[status]}
    </Badge>
  );
}
