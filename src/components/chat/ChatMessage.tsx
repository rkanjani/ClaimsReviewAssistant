import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
            : 'max-w-fit bg-muted text-foreground'
        )}
      >
        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <div className={cn('text-sm whitespace-pre-wrap', isUser && 'text-[#FFFFFF]')}>{message.content}</div>
        )}
      </div>
    </div>
  );
}
