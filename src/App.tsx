import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { ClaimsList, ClaimDetailPanel } from '@/components/claims';
import { ChatContainer } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks';
import { cn } from '@/lib/utils';

function App() {
  useKeyboardShortcuts();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  return (
    <AppShell>
      <div className="h-full flex relative">
        {/* Claims List Panel */}
        <div className={cn(
          "w-full md:w-[400px] lg:w-[450px] border-r border-border flex-shrink-0",
          isMobileChatOpen && "hidden md:block"
        )}>
          <ClaimsList />
        </div>

        {/* Chat Panel - Desktop */}
        <div className="hidden md:flex flex-1 flex-col">
          <ChatContainer />
        </div>

        {/* Chat Panel - Mobile Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden animate-fade-in">
            <ChatContainer />
          </div>
        )}

        {/* Mobile Chat Toggle Button */}
        <Button
          className={cn(
            "fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden z-40",
            isMobileChatOpen && "z-[60]"
          )}
          onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
        >
          {isMobileChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Claim Detail Sheet */}
      <ClaimDetailPanel />
    </AppShell>
  );
}

export default App;
