import { FileText, AlertCircle, Clock, DollarSign, CheckCircle, Scale, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useClaimsStore, useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import type { ClaimStatus } from '@/types/claim';

const statusFilters: { status: ClaimStatus | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'all', label: 'All Claims', icon: LayoutDashboard, color: 'text-muted-foreground' },
  { status: 'denied', label: 'Denied', icon: AlertCircle, color: 'text-status-denied' },
  { status: 'rejected', label: 'Rejected', icon: FileText, color: 'text-status-rejected' },
  { status: 'pending', label: 'Pending', icon: Clock, color: 'text-status-pending' },
  { status: 'underpaid', label: 'Underpaid', icon: DollarSign, color: 'text-status-underpaid' },
  { status: 'appealed', label: 'Appealed', icon: Scale, color: 'text-status-appealed' },
  { status: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-status-resolved' },
];

export function Sidebar() {
  const { filter, setFilter, claims } = useClaimsStore();
  const { isSidebarOpen } = useUIStore();

  const getCountForStatus = (status: ClaimStatus | 'all') => {
    if (status === 'all') return claims.length;
    return claims.filter((c) => c.status === status).length;
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-56 border-r border-border bg-card flex-shrink-0 hidden lg:flex flex-col">
      <div className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Status Filter</h2>
        <nav className="space-y-1">
          {statusFilters.map(({ status, label, icon: Icon, color }) => {
            const count = getCountForStatus(status);
            const isActive = filter.status === status;

            return (
              <Button
                key={status}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 px-3',
                  isActive && 'bg-accent'
                )}
                onClick={() => setFilter({ status })}
              >
                <Icon className={cn('h-4 w-4', color)} />
                <span className="flex-1 text-left text-sm">{label}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              </Button>
            );
          })}
        </nav>
      </div>

      <Separator />

      <div className="p-4 mt-auto">
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-primary">Tip:</span> Use Cmd+K to quickly focus the AI chat.
          </p>
        </div>
      </div>
    </aside>
  );
}
