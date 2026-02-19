import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ActionConfirmation, StatusUpdateConfirmation, AppealDraftConfirmation } from '@/components/confirmation';
import { useClaimsStore } from '@/stores';
import type { PendingConfirmation } from '@/types/chat';

export interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming: boolean;
  confirmations?: PendingConfirmation[];
}

interface ChatMessageProps {
  message: ChatMessageType;
  onConfirmationAction?: (
    confirmation: PendingConfirmation,
    action: 'approve' | 'dismiss' | 'modify',
    modifiedData?: unknown
  ) => void;
}

function Spinner() {
  return (
    <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
  );
}

export function ChatMessage({ message, onConfirmationAction }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const getClaim = useClaimsStore((state) => state.getClaim);

  return (
    <div className={cn('flex flex-col', isUser && 'items-end')}>
      <span className={cn('text-xs text-muted-foreground mb-1', isUser ? 'pr-2' : 'pl-2')}>
        {isUser ? 'You' : 'Claims Assistant'}
      </span>
      <div
        className={cn(
          'rounded-3xl px-4 py-3',
          isUser
            ? 'max-w-[65%] bg-[#16a34a] text-[#FFFFFF]'
            : 'w-fit max-w-[70%] bg-muted text-foreground'
        )}
      >
        {message.isStreaming && !message.content ? (
          <Spinner />
        ) : isUser ? (
          <div className="text-sm whitespace-pre-wrap text-[#FFFFFF]">{message.content}</div>
        ) : (
          <div className="text-sm prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-medium">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-medium mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-medium mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Render confirmation cards for assistant messages */}
      {!isUser && message.confirmations && message.confirmations.length > 0 && (
        <div className="mt-3 space-y-3 w-full max-w-md">
          {message.confirmations.map((confirmation) => {
            const claim = getClaim(confirmation.claimId);
            if (!claim) return null;

            const handleAction = (
              conf: PendingConfirmation,
              action: 'approve' | 'dismiss' | 'modify',
              modifiedData?: unknown
            ) => {
              onConfirmationAction?.(conf, action, modifiedData);
            };

            switch (confirmation.type) {
              case 'suggestAction':
                return (
                  <ActionConfirmation
                    key={confirmation.id}
                    confirmation={confirmation}
                    claim={claim}
                    onAction={handleAction}
                  />
                );
              case 'updateClaimStatus':
                return (
                  <StatusUpdateConfirmation
                    key={confirmation.id}
                    confirmation={confirmation}
                    claim={claim}
                    onAction={handleAction}
                  />
                );
              case 'draftAppeal':
                return (
                  <AppealDraftConfirmation
                    key={confirmation.id}
                    confirmation={confirmation}
                    claim={claim}
                    onAction={handleAction}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
}
