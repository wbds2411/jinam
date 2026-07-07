import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setMasterKey, clearMasterKey } from '../services/secureStorage.js';

interface AuthState {
  pinHash: string | null;
  authenticated: boolean;
  setPin: (pin: string) => void;
  authenticate: (pin: string) => Promise<boolean>;
  lock: () => void;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      authenticated: false,
      setPin: async (pin) => {
        const pinHash = await hashPin(pin);
        setMasterKey(pin);
        set({ pinHash, authenticated: true });
      },
      authenticate: async (pin) => {
        const pinHash = await hashPin(pin);
        if (pinHash === get().pinHash) {
          setMasterKey(pin);
          set({ authenticated: true });
          return true;
        }
        return false;
      },
      lock: () => {
        clearMasterKey();
        set({ authenticated: false });
      },
    }),
    {
      name: 'jinam-auth',
      partialize: (state) => ({ pinHash: state.pinHash }),
    }
  )
);
