import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { secureStorage, setMasterKey, clearMasterKey, getStorageStatus, retryStorage, deleteStoredData } from './secureStorage.js';

beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto);
  const records = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
    clear: () => records.clear(),
  });
  await deleteStoredData();
  localStorage.clear();
  setMasterKey('123456');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('encrypted local records and recovery', () => {
  it('encrypts data and restores the latest of rapid edits', async () => {
    await Promise.all([secureStorage.setItem('jinam-user', 'first'), secureStorage.setItem('jinam-user', 'latest')]);
    expect(localStorage.getItem('jinam-user')).not.toContain('latest');
    expect(await secureStorage.getItem('jinam-user')).toBe('latest');
    expect(getStorageStatus()).toBe('saved');
  });
  it('keeps unsaved input available for retry without a plaintext fallback', async () => {
    clearMasterKey();
    await secureStorage.setItem('jinam-user', 'private input');
    expect(localStorage.getItem('jinam-user')).toBeNull();
    expect(getStorageStatus()).toBe('error');
    setMasterKey('123456');
    await retryStorage();
    expect(await secureStorage.getItem('jinam-user')).toBe('private input');
  });
  it('recovers from a full browser storage area', async () => {
    const failure = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    await secureStorage.setItem('jinam-chat', 'kept in memory');
    expect(getStorageStatus()).toBe('error');
    failure.mockRestore();
    await retryStorage();
    expect(await secureStorage.getItem('jinam-chat')).toBe('kept in memory');
  });
  it('does not interpret damaged ciphertext as a usable record', async () => {
    await secureStorage.setItem('jinam-chat', 'private');
    setMasterKey('654321');
    await expect(secureStorage.getItem('jinam-chat')).rejects.toThrow();
    expect(localStorage.getItem('jinam-chat')).not.toBeNull();
  });
  it('migrates legacy plaintext to encryption on read', async () => {
    const legacy = JSON.stringify({ state: { messages: [] }, version: 0 });
    localStorage.setItem('jinam-chat', legacy);
    expect(await secureStorage.getItem('jinam-chat')).toBe(legacy);
    expect(localStorage.getItem('jinam-chat')).not.toContain('messages');
  });
  it('waits for in-flight saves before deleting all app data, preserving unrelated data', async () => {
    localStorage.setItem('other-app', 'keep');
    localStorage.setItem('jinam-auth', 'pin hash');
    const saving = secureStorage.setItem('jinam-user', 'pending profile');
    await deleteStoredData();
    await saving;
    expect(localStorage.getItem('jinam-user')).toBeNull();
    expect(localStorage.getItem('jinam-auth')).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
    await retryStorage();
    expect(localStorage.getItem('jinam-user')).toBeNull();
  });
});
