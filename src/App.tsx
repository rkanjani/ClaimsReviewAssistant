import { useState, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { ClaimsList, ClaimDetailPanel, ClaimDetailView } from '@/components/claims';
import { ChatContainer } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks';
import { useClaimsStore } from '@/stores';
import { cn } from '@/lib/utils';

function App() {
  useKeyboardShortcuts();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const { fetchClaims, isLoading, error, claims } = useClaimsStore();

  // Fetch claims on app startup
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Show loading state
  if (isLoading && claims.length === 0) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading claims...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error && claims.length === 0) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => fetchClaims()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-full flex relative">
        {/* Claims List Panel */}
        <div className={cn(
          "w-full md:w-[280px] lg:w-[350px] border-r border-border flex-shrink-0",
          isMobileChatOpen && "hidden md:block"
        )}>
          <ClaimsList />
        </div>

        {/* Claim Detail View - Desktop only (middle column) */}
        <div className="hidden md:flex md:w-[320px] lg:w-[380px] border-r border-border flex-shrink-0">
          <ClaimDetailView />
        </div>

        {/* Chat Panel - Desktop */}
        <div className="hidden md:flex flex-1 flex-col min-w-0">
          <ChatContainer />
        </div>

        {/* Chat Panel - Mobile Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden animate-fade-in">
            <ChatContainer onClose={() => setIsMobileChatOpen(false)} />
          </div>
        )}

        {/* Mobile Chat Toggle Button - only show when chat is closed */}
        {!isMobileChatOpen && (
          <Button
            variant="secondary"
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden z-40"
            onClick={() => setIsMobileChatOpen(true)}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Claim Detail Sheet - Mobile only */}
      <ClaimDetailPanel />
    </AppShell>
  );
}

export default App;
