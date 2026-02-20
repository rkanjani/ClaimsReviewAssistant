import { Calendar, Building2, User, FileText, History, Tag, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { ClaimPriorityIndicator } from './ClaimPriorityIndicator';
import { useClaimsStore, useUIStore } from '@/stores';
import { formatCurrency, formatDate, formatTimeUntil, getDeadlineUrgency, cn } from '@/lib/utils';

const urgencyColors = {
  normal: 'text-muted-foreground',
  warning: 'text-status-pending font-medium',
  urgent: 'text-status-denied font-medium',
};

export function ClaimDetailPanel() {
  const { selectedClaimId, getClaim, selectClaim } = useClaimsStore();
  const { isDetailPanelOpen, closeDetailPanel } = useUIStore();

  const claim = selectedClaimId ? getClaim(selectedClaimId) : null;

  const handleClose = () => {
    closeDetailPanel();
    selectClaim(null);
  };

  if (!claim) return null;

  const deadlineUrgency = claim.deadlineDate ? getDeadlineUrgency(claim.deadlineDate) : null;
  const timeUntilDeadline = claim.deadlineDate ? formatTimeUntil(claim.deadlineDate) : null;

  return (
    <Sheet open={isDetailPanelOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{claim.id}</SheetTitle>
            <ClaimStatusBadge status={claim.status} />
          </div>
          <SheetDescription className="flex items-center gap-2">
            {claim.patientName}
            <ClaimPriorityIndicator priority={claim.priority} showLabel />
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Amount Section */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Billed Amount</p>
                  <p className="text-2xl font-medium">{formatCurrency(claim.amount)}</p>
                </div>
                {claim.amountPaid !== undefined && claim.amountPaid > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-lg font-medium text-primary">{formatCurrency(claim.amountPaid)}</p>
                  </div>
                )}
              </div>
              {timeUntilDeadline !== null && deadlineUrgency !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Clock className={cn("h-4 w-4", urgencyColors[deadlineUrgency])} />
                  <span className={urgencyColors[deadlineUrgency]}>
                    {timeUntilDeadline}
                  </span>
                </div>
              )}
            </div>

            {/* Denial Info */}
            {claim.denialReason && (
              <div>
                <h3 className="text-sm font-medium mb-2">Denial Information</h3>
                <div className="rounded-lg border p-3 bg-status-denied/5 border-status-denied/20">
                  <p className="text-sm text-foreground">{claim.denialReason}</p>
                  {claim.denialCode && (
                    <p className="text-xs text-muted-foreground mt-1">Code: {claim.denialCode}</p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Patient & Insurance */}
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Patient</p>
                  <p className="text-sm text-muted-foreground">{claim.patientName}</p>
                  <p className="text-xs text-muted-foreground">{claim.patientId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Insurance</p>
                  <p className="text-sm text-muted-foreground">{claim.insuranceProvider}</p>
                  <p className="text-xs text-muted-foreground">{claim.insurancePolicyNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Dates</p>
                  <p className="text-sm text-muted-foreground">
                    Service: {formatDate(claim.dateOfService)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {formatDate(claim.dateSubmitted)}
                  </p>
                  {claim.deadlineDate && (
                    <p className="text-sm text-muted-foreground">
                      Deadline: {formatDate(claim.deadlineDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Codes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Codes</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Procedure Codes (CPT)</p>
                  <div className="flex flex-wrap gap-1">
                    {claim.procedureCodes.map((code) => (
                      <Badge key={code} variant="outline">{code}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Diagnosis Codes (ICD-10)</p>
                  <div className="flex flex-wrap gap-1">
                    {claim.diagnosisCodes.map((code) => (
                      <Badge key={code} variant="outline">{code}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {claim.notes.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Notes</h3>
                  </div>
                  <ul className="space-y-1">
                    {claim.notes.map((note, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Action History */}
            {claim.actionHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Action History</h3>
                  </div>
                  <div className="space-y-3">
                    {claim.actionHistory.map((action) => (
                      <div key={action.id} className="relative pl-4 border-l-2 border-border">
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(action.timestamp)} • {action.performedBy}
                        </p>
                        {action.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{action.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
