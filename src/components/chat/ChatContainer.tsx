import { useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ActionConfirmation } from '@/components/confirmation/ActionConfirmation';
import { AppealDraftConfirmation } from '@/components/confirmation/AppealDraftConfirmation';
import { StatusUpdateConfirmation } from '@/components/confirmation/StatusUpdateConfirmation';
import { useChatStore, useClaimsStore } from '@/stores';
import { sendChatMessage, type ToolResult } from '@/api/chat';
import type { SuggestedAction, AppealDraft, StatusUpdate, Claim } from '@/types/claim';
import type { PendingConfirmation, LookupClaimResult } from '@/types/chat';
import { generateId, formatCurrency } from '@/lib/utils';

interface ChatContainerProps {
  onClose?: () => void;
}

export function ChatContainer({ onClose }: ChatContainerProps) {
  const {
    messages,
    isLoading,
    pendingConfirmations,
    addMessage,
    updateMessage,
    setLoading,
    addConfirmation,
    updateConfirmation
  } = useChatStore();
  const { claims, updateClaimStatus, getClaim } = useClaimsStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingConfirmations]);

  const formatToolResultMessage = (toolResult: ToolResult, _claim: Claim | undefined): string => {
    if ('error' in toolResult.result) {
      return `\n\n*Error: ${toolResult.result.error}*`;
    }

    switch (toolResult.type) {
      case 'lookupClaim': {
        const result = toolResult.result as LookupClaimResult;
        if (!result.claim) return '';
        const c = result.claim;
        return `\n\n**Claim ${c.id} Details:**\n- Patient: ${c.patientName}\n- Status: ${c.status}\n- Amount: ${formatCurrency(c.amount)}\n- Insurance: ${c.insuranceProvider}\n- Date of Service: ${c.dateOfService}${c.denialReason ? `\n- Denial Reason: ${c.denialReason}` : ''}`;
      }
      default:
        return '';
    }
  };

  const handleSend = useCallback(async (content: string) => {
    addMessage({ role: 'user', content });
    const assistantMessageId = addMessage({ role: 'assistant', content: '', isStreaming: true });
    setLoading(true);

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content },
      ];

      const response = await sendChatMessage({ messages: allMessages, claims });

      let finalContent = response.text;

      // Process tool results
      for (const toolResult of response.toolResults) {
        const claim = getClaim(toolResult.claimId);

        if ('error' in toolResult.result) {
          finalContent += `\n\n*Error: ${toolResult.result.error}*`;
          continue;
        }

        switch (toolResult.type) {
          case 'lookupClaim':
            finalContent += formatToolResultMessage(toolResult, claim);
            break;

          case 'suggestAction':
            addConfirmation({
              toolCallId: generateId(),
              type: 'suggestAction',
              claimId: toolResult.claimId,
              data: toolResult.result as SuggestedAction,
              status: 'pending',
            });
            break;

          case 'draftAppeal':
            addConfirmation({
              toolCallId: generateId(),
              type: 'draftAppeal',
              claimId: toolResult.claimId,
              data: toolResult.result as AppealDraft,
              status: 'pending',
            });
            break;

          case 'updateClaimStatus':
            addConfirmation({
              toolCallId: generateId(),
              type: 'updateClaimStatus',
              claimId: toolResult.claimId,
              data: toolResult.result as StatusUpdate,
              status: 'pending',
            });
            break;
        }
      }

      updateMessage(assistantMessageId, { content: finalContent, isStreaming: false });
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantMessageId, {
        content: 'Sorry, there was an error processing your request. Please reach out to your system administrator.',
        isStreaming: false,
      });
    } finally {
      setLoading(false);
    }
  }, [messages, claims, addMessage, updateMessage, setLoading, addConfirmation, getClaim]);

  const handleConfirmationAction = useCallback((
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => {
    if (action === 'dismiss') {
      updateConfirmation(confirmation.id, 'dismissed');
      return;
    }

    if (action === 'approve' && confirmation.type === 'updateClaimStatus') {
      const data = confirmation.data as StatusUpdate;
      updateClaimStatus(confirmation.claimId, data.newStatus, data.notes, data.actionTaken);
    }

    updateConfirmation(
      confirmation.id,
      action === 'approve' ? 'approved' : 'modified',
      modifiedData as PendingConfirmation['modifiedData']
    );
  }, [updateConfirmation, updateClaimStatus]);

  const renderConfirmation = (confirmation: PendingConfirmation) => {
    const claim = getClaim(confirmation.claimId);
    if (!claim) return null;

    switch (confirmation.type) {
      case 'suggestAction':
        return (
          <ActionConfirmation
            key={confirmation.id}
            confirmation={confirmation}
            claim={claim}
            onAction={handleConfirmationAction}
          />
        );
      case 'draftAppeal':
        return (
          <AppealDraftConfirmation
            key={confirmation.id}
            confirmation={confirmation}
            claim={claim}
            onAction={handleConfirmationAction}
          />
        );
      case 'updateClaimStatus':
        return (
          <StatusUpdateConfirmation
            key={confirmation.id}
            confirmation={confirmation}
            claim={claim}
            onAction={handleConfirmationAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-secondary" />
            <h2 className="font-medium">Claims Assistant</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions about claims, get recommendations, and draft appeals
        </p>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-secondary/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Start a conversation by asking about a claim
              </p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">Try asking:</p>
                <p>"What's the status of CLM-1001?"</p>
                <p>"What should I do with CLM-1002?"</p>
                <p>"Draft an appeal for CLM-1001"</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {pendingConfirmations
                .filter((c) => c.status === 'pending')
                .map(renderConfirmation)}
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSend} isLoading={isLoading} disabled={!hasApiKey} />

      {!hasApiKey && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-secondary">Note:</span> Add your VITE_ANTHROPIC_API_KEY to .env to enable the assistant.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
