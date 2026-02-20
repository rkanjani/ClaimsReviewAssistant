import { useState } from 'react';
import { Menu, MoreVertical, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore, useClaimsStore } from '@/stores';

export function Header() {
  const { toggleSidebar } = useUIStore();
  const { fetchClaims } = useClaimsStore();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (isResetting) return;

    const confirmed = window.confirm(
      'This will reset all claims to their original state and clear chat history. Continue?'
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      // Call the reset endpoint
      const response = await fetch('/api/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset');
      }

      // Reload claims data
      await fetchClaims();

      // Reload the page to clear chat history
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-medium text-foreground">Joyful Claims</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Review Assistant</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleReset} disabled={isResetting}>
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reset Experience
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
