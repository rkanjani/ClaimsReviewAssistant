import { useState } from 'react';
import { FileText, Paperclip, Copy, Check } from 'lucide-react';
import { ConfirmationCard } from './ConfirmationCard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Claim, AppealDraft } from '@/types/claim';
import type { PendingConfirmation } from '@/types/chat';

interface AppealDraftConfirmationProps {
  confirmation: PendingConfirmation;
  claim: Claim;
  onAction: (
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => void;
}

const appealTypeLabels: Record<string, string> = {
  medical_necessity: 'Medical Necessity',
  coding_correction: 'Coding Correction',
  timely_filing: 'Timely Filing',
  documentation: 'Documentation',
  authorization: 'Authorization',
  other: 'General',
};

export function AppealDraftConfirmation({ confirmation, claim, onAction }: AppealDraftConfirmationProps) {
  const data = confirmation.data as AppealDraft;
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(data.body);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModify = () => {
    setIsEditing(true);
  };

  const handleSaveModification = () => {
    onAction(confirmation, 'modify', { ...data, body: editedBody });
    setIsEditing(false);
  };

  return (
    <ConfirmationCard
      title={`Appeal Draft for ${claim.id}`}
      icon={<FileText className="h-5 w-5 text-primary" />}
      status={confirmation.status}
      onApprove={() => onAction(confirmation, 'approve')}
      onDismiss={() => onAction(confirmation, 'dismiss')}
      onModify={handleModify}
      showModify
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {appealTypeLabels[data.appealType] || data.appealType}
          </Badge>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
          <p className="text-sm bg-muted rounded px-2 py-1">{data.subject}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Letter Body</p>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[200px] text-xs font-mono"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveModification}>Save Changes</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-3 max-h-[200px] overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-sans">{editedBody}</pre>
            </div>
          )}
        </div>

        {data.attachmentsNeeded.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              Attachments Needed
            </p>
            <ul className="space-y-1">
              {data.attachmentsNeeded.map((attachment, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  {attachment}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ConfirmationCard>
  );
}
