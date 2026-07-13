import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setMasterKey, clearMasterKey } from '../services/secureStorage.js';

const PIN_ITERATIONS = 310_000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30_000;
const encoder = new TextEncoder();

interface PinCredential {
  version: 1;
  salt: string;
  verifier: string;
  iterations: number;
}

interface AuthState {
  pinHash: string | null;
  credential: PinCredential | null;
  authenticated: boolean;
  failedAttempts: number;
  lockedUntil: number;
  setPin: (pin: string) => Promise<void>;
  authenticate: (pin: string) => Promise<boolean>;
  lock: () => void;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function randomSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveVerifier(pin: string, salt: string, iterations: number): Promise<string> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt) as BufferSource, iterations },
    material,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

async function legacyHashPin(pin: string): Promise<string> {
  return toBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(pin))));
}

function constantTimeEqual(left: string, right: string): boolean {
  const size = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < size; index++) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function unlockPrivateStores(pin: string): Promise<void> {
  setMasterKey(pin);
  const [{ useUserStore }, { useChatStore }] = await Promise.all([
    import('./userStore.js'),
    import('./chatStore.js'),
  ]);
  await Promise.all([useUserStore.persist.rehydrate(), useChatStore.persist.rehydrate()]);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      credential: null,
      authenticated: false,
      failedAttempts: 0,
      lockedUntil: 0,
      setPin: async (pin) => {
        if (pin.length < 4) throw new Error('PIN은 4자리 이상이어야 합니다.');
        const salt = randomSalt();
        const credential: PinCredential = {
          version: 1,
          salt,
          verifier: await deriveVerifier(pin, salt, PIN_ITERATIONS),
          iterations: PIN_ITERATIONS,
        };
        await unlockPrivateStores(pin);
        set({ credential, pinHash: null, authenticated: true, failedAttempts: 0, lockedUntil: 0 });
      },
      authenticate: async (pin) => {
        const state = get();
        if (state.lockedUntil > Date.now()) return false;

        const valid = state.credential
          ? constantTimeEqual(
              await deriveVerifier(pin, state.credential.salt, state.credential.iterations),
              state.credential.verifier,
            )
          : Boolean(state.pinHash && constantTimeEqual(await legacyHashPin(pin), state.pinHash));

        if (!valid) {
          const failedAttempts = state.failedAttempts + 1;
          set({
            failedAttempts: failedAttempts >= MAX_FAILED_ATTEMPTS ? 0 : failedAttempts,
            lockedUntil: failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : 0,
          });
          return false;
        }

        await unlockPrivateStores(pin);
        if (!state.credential) {
          const salt = randomSalt();
          set({
            credential: {
              version: 1,
              salt,
              verifier: await deriveVerifier(pin, salt, PIN_ITERATIONS),
              iterations: PIN_ITERATIONS,
            },
            pinHash: null,
          });
        }
        set({ authenticated: true, failedAttempts: 0, lockedUntil: 0 });
        return true;
      },
      lock: () => {
        clearMasterKey();
        set({ authenticated: false });
      },
    }),
    {
      name: 'jinam-auth',
      partialize: (state) => ({
        pinHash: state.pinHash,
        credential: state.credential,
        failedAttempts: state.failedAttempts,
        lockedUntil: state.lockedUntil,
      }),
    },
  ),
);
