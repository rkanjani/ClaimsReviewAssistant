import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isDetailPanelOpen: boolean;
  isChatFocused: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  setChatFocused: (focused: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,
  isDetailPanelOpen: false,
  isChatFocused: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  openDetailPanel: () => set({ isDetailPanelOpen: true }),
  closeDetailPanel: () => set({ isDetailPanelOpen: false }),
  setChatFocused: (isChatFocused) => set({ isChatFocused }),
}));
