import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, PendingConfirmation } from '@/types/chat';
import { generateId } from '@/lib/utils';

interface ChatState {
  messages: ChatMessage[];
  pendingConfirmations: PendingConfirmation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addConfirmation: (confirmation: Omit<PendingConfirmation, 'id'>) => string;
  updateConfirmation: (id: string, status: PendingConfirmation['status'], modifiedData?: PendingConfirmation['modifiedData']) => void;
  clearChat: () => void;
  getMessageById: (id: string) => ChatMessage | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      pendingConfirmations: [],
      isLoading: false,
      error: null,

      addMessage: (message) => {
        const id = generateId();
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        return id;
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      addConfirmation: (confirmation) => {
        const id = generateId();
        const newConfirmation: PendingConfirmation = { ...confirmation, id };
        set((state) => ({
          pendingConfirmations: [...state.pendingConfirmations, newConfirmation],
        }));
        return id;
      },

      updateConfirmation: (id, status, modifiedData) => {
        set((state) => ({
          pendingConfirmations: state.pendingConfirmations.map((conf) =>
            conf.id === id ? { ...conf, status, modifiedData } : conf
          ),
        }));
      },

      clearChat: () => set({ messages: [], pendingConfirmations: [], error: null }),

      getMessageById: (id) => get().messages.find((msg) => msg.id === id),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        pendingConfirmations: state.pendingConfirmations,
      }),
    }
  )
);
