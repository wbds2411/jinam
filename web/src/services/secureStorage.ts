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

export const secureStorage: StateStorage = {
  getItem: async (name) => {
    const item = localStorage.getItem(name);
    if (!item) return null;
    if (!masterKey) {
      // 복호화 불가: 아직 PIN 입력 전. null 반환하여 기본값 사용.
      return null;
    }
    try {
      const payload = JSON.parse(item);
      return await decrypt(payload, masterKey);
    } catch {
      // 복호화 실패 시 평문으로 시도 (마이그레이션용)
      return item;
    }
  },
  setItem: async (name, value) => {
    if (!masterKey) {
      // PIN이 없으면 평문 저장 (개발/초기). 단, 경고.
      console.warn('[보안] 마스터 키 없이 평문 저장됨');
      localStorage.setItem(name, value);
      return;
    }
    const payload = await encrypt(value, masterKey);
    localStorage.setItem(name, JSON.stringify(payload));
  },
  removeItem: (name) => localStorage.removeItem(name),
};
