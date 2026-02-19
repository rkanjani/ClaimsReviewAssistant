import { ScrollArea } from '@/components/ui/scroll-area';
import { ClaimCard } from './ClaimCard';
import { ClaimsFilters } from './ClaimsFilters';
import { useClaimsStore, useUIStore } from '@/stores';

export function ClaimsList() {
  const { getFilteredClaims, selectedClaimId, selectClaim } = useClaimsStore();
  const { openDetailPanel } = useUIStore();
  const claims = getFilteredClaims();

  const handleClaimClick = (claimId: string) => {
    selectClaim(claimId);
    openDetailPanel();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <ClaimsFilters />
        <p className="text-sm text-muted-foreground mt-3">
          {claims.length} claim{claims.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {claims.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claims match your filters</p>
            </div>
          ) : (
            claims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                isSelected={selectedClaimId === claim.id}
                onClick={() => handleClaimClick(claim.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
