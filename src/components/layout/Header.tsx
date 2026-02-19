import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores';

export function Header() {
  const { toggleSidebar } = useUIStore();

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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-medium text-sm">JH</span>
          </div>
          <div>
            <h1 className="text-base font-medium text-foreground">Joyful Claims</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Review Assistant</p>
          </div>
        </div>
      </div>

    </header>
  );
}
