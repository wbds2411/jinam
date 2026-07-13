import type { StateStorage } from 'zustand/middleware';
import { encrypt, decrypt } from './cryptoVault.js';

let masterKey: string | null = null;

export function setMasterKey(key: string) {
  masterKey = key;
}

export function getMasterKey(): string | null {
  return masterKey;
}

export function clearMasterKey() {
  masterKey = null;
}

function isEncryptedPayload(value: unknown): value is { iv: string; salt: string; ciphertext: string } {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return ['iv', 'salt', 'ciphertext'].every(key => typeof payload[key] === 'string');
}

export const secureStorage: StateStorage = {
  getItem: async (name) => {
    const item = localStorage.getItem(name);
    if (!item || !masterKey) return null;

    let payload: unknown;
    try {
      payload = JSON.parse(item);
    } catch {
      localStorage.removeItem(name);
      return null;
    }
    if (!isEncryptedPayload(payload)) {
      localStorage.removeItem(name);
      return null;
    }

    try {
      return await decrypt(payload, masterKey);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (!masterKey) {
      throw new Error(`Secure storage is locked: ${name}`);
    }
    const payload = await encrypt(value, masterKey);
    localStorage.setItem(name, JSON.stringify(payload));
  },
  removeItem: (name) => localStorage.removeItem(name),
};
