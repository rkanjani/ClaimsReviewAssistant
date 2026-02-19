import { useEffect, useCallback } from 'react';
import { useClaimsStore, useUIStore } from '@/stores';
import type { ClaimStatus } from '@/types/claim';

const statusShortcuts: Record<string, ClaimStatus | 'all'> = {
  '1': 'denied',
  '2': 'rejected',
  '3': 'pending',
  '4': 'underpaid',
};

export function useKeyboardShortcuts() {
  const { getFilteredClaims, selectedClaimId, selectClaim, setFilter } = useClaimsStore();
  const { openDetailPanel, closeDetailPanel, isDetailPanelOpen, setChatFocused } = useUIStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Cmd/Ctrl + K - Focus chat input
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setChatFocused(true);
      const chatInput = document.querySelector('textarea[placeholder*="Ask about claims"]') as HTMLTextAreaElement;
      chatInput?.focus();
      return;
    }

    // Escape - Close panels
    if (e.key === 'Escape') {
      if (isDetailPanelOpen) {
        closeDetailPanel();
      }
      return;
    }

    // Skip other shortcuts if input is focused
    if (isInputFocused) return;

    const claims = getFilteredClaims();

    // J/K - Navigate claims
    if (e.key === 'j' || e.key === 'k') {
      e.preventDefault();
      if (claims.length === 0) return;

      const currentIndex = selectedClaimId
        ? claims.findIndex((c) => c.id === selectedClaimId)
        : -1;

      let newIndex: number;
      if (e.key === 'j') {
        // Next
        newIndex = currentIndex < claims.length - 1 ? currentIndex + 1 : 0;
      } else {
        // Previous
        newIndex = currentIndex > 0 ? currentIndex - 1 : claims.length - 1;
      }

      selectClaim(claims[newIndex].id);
      return;
    }

    // Enter - Open detail panel for selected claim
    if (e.key === 'Enter' && selectedClaimId) {
      e.preventDefault();
      openDetailPanel();
      return;
    }

    // 1-4 - Quick filter by status
    if (statusShortcuts[e.key]) {
      e.preventDefault();
      setFilter({ status: statusShortcuts[e.key] });
      return;
    }

    // 0 - Clear filters
    if (e.key === '0') {
      e.preventDefault();
      setFilter({ status: 'all' });
      return;
    }
  }, [
    getFilteredClaims,
    selectedClaimId,
    selectClaim,
    setFilter,
    openDetailPanel,
    closeDetailPanel,
    isDetailPanelOpen,
    setChatFocused,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
