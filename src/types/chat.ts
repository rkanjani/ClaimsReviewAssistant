import type { SuggestedAction, AppealDraft, StatusUpdate, Claim } from './claim';

export type MessageRole = 'user' | 'assistant';

export interface ToolCallResult {
  toolName: string;
  toolCallId: string;
  result: unknown;
  requiresConfirmation: boolean;
}

export interface PendingConfirmation {
  id: string;
  toolCallId: string;
  type: 'suggestAction' | 'draftAppeal' | 'updateClaimStatus';
  claimId: string;
  data: SuggestedAction | AppealDraft | StatusUpdate;
  status: 'pending' | 'approved' | 'dismissed' | 'modified';
  modifiedData?: SuggestedAction | AppealDraft | StatusUpdate;
  executionPayload?: {
    claimId: string;
    newStatus?: string;
    actionTaken?: string;
    notes?: string;
    appealType?: string;
    body?: string;
    subject?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCallResult[];
  confirmations?: PendingConfirmation[];
  isStreaming?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  pendingConfirmations: PendingConfirmation[];
}

export interface LookupClaimResult {
  claim: Claim;
  summary: string;
}
