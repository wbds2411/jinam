import type { StateStorage } from 'zustand/middleware';
import { encrypt, decrypt } from './cryptoVault.js';

let masterKey: string | null = null;
let queue = Promise.resolve();
const pending = new Map<string, string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let status: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
function publish(next: typeof status) {
  status = next;
  listeners.forEach(listener => listener());
}
export const subscribeStorage = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getStorageStatus = () => status;
export function setMasterKey(key: string) { masterKey = key; }
export function getMasterKey(): string | null { return masterKey; }
export function clearMasterKey() { masterKey = null; }

function save(name: string, value: string) {
  pending.set(name, value);
  publish('saving');
  // Serialize encryption as well as writes so older snapshots cannot overwrite newer input.
  queue = queue.then(async () => {
    try {
      if (!masterKey) throw new Error('Storage is locked');
      const payload = await encrypt(value, masterKey);
      localStorage.setItem(name, JSON.stringify(payload));
      if (pending.get(name) === value) { pending.delete(name); failed.delete(name); }
      publish(failed.size ? 'error' : pending.size ? 'saving' : 'saved');
    } catch {
      failed.add(name);
      publish('error');
    }
  });
  return queue;
}
export async function retryStorage() {
  await Promise.all([...pending].map(([name, value]) => save(name, value)));
}
export async function deleteStoredData() {
  await queue;
  for (const name of ['jinam-user', 'jinam-chat', 'jinam-auth']) localStorage.removeItem(name);
  pending.clear();
  failed.clear();
  clearMasterKey();
  publish('idle');
}
export const secureStorage: StateStorage = {
  getItem: async (name) => {
    const item = localStorage.getItem(name);
    if (!item) return null;
    if (!masterKey) throw new Error('Storage is locked');
    const payload = JSON.parse(item);
    // Read legacy Zustand data explicitly; never treat failed decryption as plaintext.
    if (payload && typeof payload === 'object' && 'state' in payload) {
      await save(name, item);
      return item;
    }
    return decrypt(payload, masterKey);
  },
  setItem: save,
  removeItem: async (name) => { await queue; localStorage.removeItem(name); pending.delete(name); },
};
