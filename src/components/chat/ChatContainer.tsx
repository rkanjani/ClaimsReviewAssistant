import { useRef, useEffect, useCallback, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, type ChatMessageType } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useClaimsStore } from '@/stores';
import type { PendingConfirmation } from '@/types/chat';

// Regex to detect action markers in the stream
const ACTION_MARKER_REGEX = /\[\[ACTION:(.+?)\]\]/g;
// Regex to detect confirmation markers in the stream
const CONFIRMATION_MARKER_REGEX = /\[\[CONFIRMATION:(.+?)\]\]/g;

interface ParsedConfirmation {
  type: 'suggestAction' | 'draftAppeal' | 'updateClaimStatus';
  claimId: string;
  data: unknown;
  executionPayload?: unknown;
}

// Parse and extract actions and confirmations from content
function parseMarkersFromContent(content: string): {
  cleanContent: string;
  actions: Array<{ type: string; claimId?: string }>;
  confirmations: ParsedConfirmation[];
} {
  const actions: Array<{ type: string; claimId?: string }> = [];
  const confirmations: ParsedConfirmation[] = [];

  let cleanContent = content.replace(ACTION_MARKER_REGEX, (_, jsonStr) => {
    try {
      const action = JSON.parse(jsonStr);
      actions.push(action);
    } catch (e) {
      console.error('Failed to parse action:', e);
    }
    return '';
  });

  cleanContent = cleanContent.replace(CONFIRMATION_MARKER_REGEX, (_, jsonStr) => {
    try {
      const confirmation = JSON.parse(jsonStr);
      confirmations.push(confirmation);
    } catch (e) {
      console.error('Failed to parse confirmation:', e);
    }
    return '';
  });

  return { cleanContent: cleanContent.trim(), actions, confirmations };
}

interface ChatContainerProps {
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatContainer({ onClose }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const { refreshClaims, selectClaim } = useClaimsStore();
  const confirmationIdCounter = useRef(0);
  const sendMessageRef = useRef<((content: string) => Promise<void>) | undefined>(undefined);

  // Handler for confirmation actions (approve/dismiss/modify)
  const handleConfirmationAction = useCallback(async (
    messageId: string,
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => {
    // Update the confirmation status in the message
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.confirmations) return msg;
        return {
          ...msg,
          confirmations: msg.confirmations.map((conf) => {
            if (conf.id !== confirmation.id) return conf;
            return {
              ...conf,
              status: action === 'modify' ? 'modified' : action === 'approve' ? 'approved' : 'dismissed',
              modifiedData: modifiedData as typeof conf.data | undefined,
            };
          }),
        };
      })
    );

    // Execute the action if approved or modified
    if (action === 'approve' || action === 'modify') {
      try {
        const payload = action === 'modify' && modifiedData
          ? { ...confirmation.executionPayload, ...modifiedData }
          : confirmation.executionPayload;

        await fetch('/api/execute-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: confirmation.type,
            payload,
          }),
        });

        // Refresh claims to reflect changes
        refreshClaims();

        // For suggestAction, send a follow-up message to proceed with the recommendation
        if (confirmation.type === 'suggestAction' && sendMessageRef.current) {
          const data = confirmation.data as { recommendedAction: string };
          const claimId = confirmation.claimId;

          // Determine appropriate follow-up based on the recommendation
          const recommendedAction = data.recommendedAction.toLowerCase();
          let followUpMessage = '';

          if (recommendedAction.includes('appeal')) {
            followUpMessage = `Draft an appeal for claim ${claimId}`;
          } else if (recommendedAction.includes('resubmit') || recommendedAction.includes('correct')) {
            followUpMessage = `Update claim ${claimId} status to pending for resubmission`;
          } else if (recommendedAction.includes('reconsideration')) {
            followUpMessage = `Draft an appeal for underpayment on claim ${claimId}`;
          } else {
            followUpMessage = `Proceed with the recommended action for claim ${claimId}: ${data.recommendedAction}`;
          }

          sendMessageRef.current(followUpMessage);
        }
      } catch (err) {
        console.error('Failed to execute action:', err);
      }
    }
  }, [refreshClaims]);

  // Check if we're on desktop (for claim selection behavior)
  const checkIsDesktop = useCallback(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      // Consider "at bottom" if within 50px of the bottom
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      isStreaming: false,
    };

    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }]);
    setIsLoading(true);
    setError(null);

    // Prepare messages for API (convert to simple format)
    const apiMessages: Message[] = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      const processedActions = new Set<string>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Parse actions and confirmations from content
        const { cleanContent, actions } = parseMarkersFromContent(fullContent);

        // Handle actions (only on desktop, and only once per action)
        if (checkIsDesktop()) {
          for (const action of actions) {
            const actionKey = `${action.type}:${action.claimId}`;
            if (!processedActions.has(actionKey)) {
              processedActions.add(actionKey);
              if (action.type === 'SELECT_CLAIM' && action.claimId) {
                selectClaim(action.claimId);
              }
            }
          }
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = cleanContent;
          }
          return newMessages;
        });
      }

      // Final parse to clean up, handle actions, and attach confirmations
      const { cleanContent, actions, confirmations } = parseMarkersFromContent(fullContent);

      // Handle any remaining actions on desktop
      if (checkIsDesktop()) {
        for (const action of actions) {
          const actionKey = `${action.type}:${action.claimId}`;
          if (!processedActions.has(actionKey)) {
            if (action.type === 'SELECT_CLAIM' && action.claimId) {
              selectClaim(action.claimId);
            }
          }
        }
      }

      // Convert parsed confirmations to PendingConfirmation objects
      const pendingConfirmations: PendingConfirmation[] = confirmations.map((conf) => {
        confirmationIdCounter.current += 1;
        return {
          id: `conf-${assistantMessageId}-${confirmationIdCounter.current}`,
          toolCallId: `tool-${confirmationIdCounter.current}`,
          type: conf.type,
          claimId: conf.claimId,
          data: conf.data as PendingConfirmation['data'],
          status: 'pending' as const,
          executionPayload: conf.executionPayload as PendingConfirmation['executionPayload'],
        };
      });

      // Mark as no longer streaming, handle empty response, attach confirmations
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
          lastMessage.content = cleanContent;
          // Attach confirmations to the message
          if (pendingConfirmations.length > 0) {
            lastMessage.confirmations = pendingConfirmations;
          }
          // If response is empty, show error message
          if (!lastMessage.content.trim()) {
            lastMessage.content = "I'm sorry I wasn't able to respond to that. Please contact your system administrator or try again.";
          }
        }
        return newMessages;
      });

      // Refresh claims in case any were updated by tool calls
      refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the empty assistant message if there was an error
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, refreshClaims, selectClaim, checkIsDesktop]);

  // Store sendMessage in ref for use in handleConfirmationAction
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#16a34a]" />
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

      <ScrollArea className="flex-1" viewportRef={viewportRef} onScroll={handleScroll}>
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
                <ChatMessage
                  key={message.id}
                  message={message}
                  onConfirmationAction={(confirmation, action, modifiedData) =>
                    handleConfirmationAction(message.id, confirmation, action, modifiedData)
                  }
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />

      {error && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-xs text-destructive">
              Error: {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
