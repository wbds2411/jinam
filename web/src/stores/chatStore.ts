import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../services/secureStorage.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'safety';
  content: string;
  mode?: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (msg) => {
        const message: ChatMessage = {
          ...msg,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        set({ messages: [...get().messages, message] });
      },
      clearMessages: () => set({ messages: [] }),
    }),
    {
      skipHydration: true,
      name: 'jinam-chat',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ messages: state.messages } as ChatState),
    }
  )
);
