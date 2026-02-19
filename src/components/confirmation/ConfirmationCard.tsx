import type { ReactNode } from 'react';
import { Check, X, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConfirmationCardProps {
  title: string;
  icon: ReactNode;
  status: 'pending' | 'approved' | 'dismissed' | 'modified';
  onApprove?: () => void;
  onDismiss?: () => void;
  onModify?: () => void;
  showModify?: boolean;
  children: ReactNode;
  className?: string;
}

export function ConfirmationCard({
  title,
  icon,
  status,
  onApprove,
  onDismiss,
  onModify,
  showModify = false,
  children,
  className,
}: ConfirmationCardProps) {
  const isPending = status === 'pending';

  return (
    <Card className={cn(
      'animate-fade-in border-2',
      isPending && 'border-primary/50',
      status === 'approved' && 'border-status-resolved/50 bg-status-resolved/5',
      status === 'dismissed' && 'border-muted opacity-60',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {!isPending && (
            <Badge variant={status === 'approved' ? 'resolved' : 'outline'}>
              {status === 'approved' && 'Approved'}
              {status === 'dismissed' && 'Dismissed'}
              {status === 'modified' && 'Modified'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {children}
      </CardContent>

      {isPending && (
        <CardFooter className="flex gap-2 pt-0">
          <Button onClick={onApprove} size="sm" className="gap-1">
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          {showModify && onModify && (
            <Button onClick={onModify} variant="outline" size="sm" className="gap-1">
              <Edit className="h-3.5 w-3.5" />
              Modify
            </Button>
          )}
          <Button onClick={onDismiss} variant="ghost" size="sm" className="gap-1">
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
