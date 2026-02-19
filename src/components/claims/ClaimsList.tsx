import { useRef, useCallback, useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ClaimCard } from './ClaimCard';
import { ClaimsFilters } from './ClaimsFilters';
import { useClaimsStore, useUIStore } from '@/stores';

export function ClaimsList() {
  const { getFilteredClaims, selectedClaimId, selectClaim, resetFilters } = useClaimsStore();
  const { openDetailPanel } = useUIStore();
  const claims = getFilteredClaims();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isSelectedVisible, setIsSelectedVisible] = useState(true);

  useEffect(() => {
    if (!selectedClaimId) {
      setIsSelectedVisible(true);
      return;
    }

    const element = cardRefs.current[selectedClaimId];
    if (!element) {
      setIsSelectedVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSelectedVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [selectedClaimId, claims]);

  const scrollToSelected = useCallback(() => {
    if (selectedClaimId) {
      resetFilters();
      // Small delay to allow filter reset to render
      setTimeout(() => {
        cardRefs.current[selectedClaimId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 50);
    }
  }, [selectedClaimId, resetFilters]);

  const handleClaimClick = (claimId: string) => {
    // Toggle selection - clicking selected claim unselects it
    if (selectedClaimId === claimId) {
      selectClaim(null);
    } else {
      selectClaim(claimId);
      // Only open the sheet panel on mobile (below md breakpoint)
      if (window.innerWidth < 768) {
        openDetailPanel();
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="p-4 border-b border-border">
        <ClaimsFilters />
      </div>

      {selectedClaimId && !isSelectedVisible && (
        <Button
          size="sm"
          onClick={scrollToSelected}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-10 shadow-md bg-secondary-100 hover:bg-secondary-200 text-secondary-foreground border border-secondary-300"
        >
          Go to selected
        </Button>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {claims.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claims match your filters</p>
            </div>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                ref={(el) => { cardRefs.current[claim.id] = el; }}
              >
                <ClaimCard
                  claim={claim}
                  isSelected={selectedClaimId === claim.id}
                  hasSelection={selectedClaimId !== null}
                  onClick={() => handleClaimClick(claim.id)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
