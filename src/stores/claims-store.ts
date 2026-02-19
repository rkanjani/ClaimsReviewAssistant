import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Claim, ClaimStatus, ClaimFilter, ClaimSort, ClaimAction, ClaimPriority } from '@/types/claim';
import claimsData from '@/data/claims.json';
import { generateId } from '@/lib/utils';

interface ClaimsState {
  claims: Claim[];
  selectedClaimId: string | null;
  filter: ClaimFilter;
  sort: ClaimSort;

  // Actions
  selectClaim: (id: string | null) => void;
  updateClaimStatus: (id: string, status: ClaimStatus, notes?: string, actionTaken?: string) => void;
  addClaimNote: (id: string, note: string) => void;
  setFilter: (filter: Partial<ClaimFilter>) => void;
  setSort: (sort: ClaimSort) => void;
  resetFilters: () => void;
  getClaim: (id: string) => Claim | undefined;
  getFilteredClaims: () => Claim[];
}

const defaultFilter: ClaimFilter = {
  status: 'all',
  priority: 'all',
  search: '',
  insuranceProvider: 'all',
};

const defaultSort: ClaimSort = {
  field: 'dateSubmitted',
  order: 'desc',
};

const priorityOrder: Record<ClaimPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const useClaimsStore = create<ClaimsState>()(
  persist(
    (set, get) => ({
      claims: claimsData as Claim[],
      selectedClaimId: null,
      filter: defaultFilter,
      sort: defaultSort,

      selectClaim: (id) => set({ selectedClaimId: id }),

      updateClaimStatus: (id, status, notes, actionTaken) => {
        set((state) => ({
          claims: state.claims.map((claim) => {
            if (claim.id !== id) return claim;

            const action: ClaimAction = {
              id: `ACT-${generateId()}`,
              timestamp: new Date().toISOString(),
              action: actionTaken || `Status changed to ${status}`,
              performedBy: 'Claims Specialist',
              previousStatus: claim.status,
              newStatus: status,
              notes,
            };

            return {
              ...claim,
              status,
              notes: notes ? [...claim.notes, notes] : claim.notes,
              actionHistory: [...claim.actionHistory, action],
            };
          }),
        }));
      },

      addClaimNote: (id, note) => {
        set((state) => ({
          claims: state.claims.map((claim) => {
            if (claim.id !== id) return claim;
            return {
              ...claim,
              notes: [...claim.notes, note],
            };
          }),
        }));
      },

      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },

      setSort: (sort) => set({ sort }),

      resetFilters: () => set({ filter: defaultFilter }),

      getClaim: (id) => {
        return get().claims.find((claim) => claim.id === id);
      },

      getFilteredClaims: () => {
        const { claims, filter, sort } = get();

        let filtered = claims.filter((claim) => {
          if (filter.status !== 'all' && claim.status !== filter.status) {
            return false;
          }
          if (filter.priority !== 'all' && claim.priority !== filter.priority) {
            return false;
          }
          if (filter.insuranceProvider !== 'all' && claim.insuranceProvider !== filter.insuranceProvider) {
            return false;
          }
          if (filter.search) {
            const search = filter.search.toLowerCase();
            return (
              claim.id.toLowerCase().includes(search) ||
              claim.patientName.toLowerCase().includes(search) ||
              claim.patientId.toLowerCase().includes(search) ||
              claim.insuranceProvider.toLowerCase().includes(search)
            );
          }
          return true;
        });

        filtered.sort((a, b) => {
          let comparison = 0;

          switch (sort.field) {
            case 'dateSubmitted':
              comparison = new Date(a.dateSubmitted).getTime() - new Date(b.dateSubmitted).getTime();
              break;
            case 'amount':
              comparison = a.amount - b.amount;
              break;
            case 'deadlineDate':
              const aDeadline = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity;
              const bDeadline = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity;
              comparison = aDeadline - bDeadline;
              break;
            case 'priority':
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            case 'patientName':
              comparison = a.patientName.localeCompare(b.patientName);
              break;
          }

          return sort.order === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },
    }),
    {
      name: 'claims-storage',
      partialize: (state) => ({
        claims: state.claims,
        filter: state.filter,
        sort: state.sort,
      }),
    }
  )
);
