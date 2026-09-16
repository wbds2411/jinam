import { describe, it, expect } from 'vitest';
import { containsSensitive, sanitizeSensitive, selectProvider } from './privacyRouter.js';
import type { UserProfile } from '../stores/userStore.js';
import type { LLMProvider } from '@jinam/engine';

const profile: UserProfile = {
  nickname: '사용자',
  gender: 'male',
  birthDate: '1980-03-19',
  birthTime: '01:45',
  birthTimeUnknown: false,
  birthLocation: { lat: 35.87, lng: 128.6, name: '대구' },
  calendarType: 'solar',
  isLeapMonth: false,
  mbti: '',
  bloodType: '',
  healthContexts: ['수면'],
};

const localProvider: LLMProvider = {
  id: 'ollama',
  name: 'Ollama',
  supportsPrivacyMode: true,
  chat: async () => ({ text: '', usage: { promptTokens: 0, completionTokens: 0 }, provider: 'ollama', model: '', routedLocally: true }),
  getCostEstimate: async () => ({ promptTokens: 0, completionTokens: 0 }),
};

const cloudProvider: LLMProvider = {
  id: 'openai',
  name: 'OpenAI',
  supportsPrivacyMode: false,
  chat: async () => ({ text: '', usage: { promptTokens: 0, completionTokens: 0 }, provider: 'openai', model: '', routedLocally: false }),
  getCostEstimate: async () => ({ promptTokens: 0, completionTokens: 0 }),
};

describe('Privacy Router', () => {
  it('민감정보 포함 메시지를 감지한다', () => {
    expect(containsSensitive('1980-03-19에 태어났어', profile)).toBe(true);
    expect(containsSensitive('대구에서 태어났어', profile)).toBe(true);
    expect(containsSensitive('수면 문제가 있어', profile)).toBe(true);
    expect(containsSensitive('오늘 날씨 어때?', profile)).toBe(false);
  });

  it('민감정보를 마스킹한다', () => {
    const text = '1980-03-19 대구에서 수면 문제가 있어';
    const sanitized = sanitizeSensitive(text, profile);
    expect(sanitized).not.toContain('1980-03-19');
    expect(sanitized).not.toContain('대구');
    expect(sanitized).not.toContain('수면');
  });

  it('프라이버시 모드 ON이면 로컬 LLM만 선택한다', () => {
    const provider = selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '안녕' }],
      { privacyMode: true, preferredProviderId: 'openai' },
      profile
    );
    expect(provider.id).toBe('ollama');
  });

  it('민감정보 포함 시 자동으로 로컬 LLM을 선택한다', () => {
    const provider = selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '1980-03-19 생일인데 운세 어때?' }],
      { privacyMode: false, preferredProviderId: 'openai' },
      profile
    );
    expect(provider.id).toBe('ollama');
  });

  it('프라이버시 모드 OFF + 민감 없음이면 선호 클라우드 LLM 선택', () => {
    const provider = selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '오늘 날씨 어때?' }],
      { privacyMode: false, preferredProviderId: 'openai' },
      profile
    );
    expect(provider.id).toBe('openai');
  });

  it('로컬 LLM이 없고 프라이버시 모드 ON이면 예외 발생', () => {
    expect(() =>
      selectProvider(
        [cloudProvider],
        [{ role: 'user', content: '안녕' }],
        { privacyMode: true, preferredProviderId: 'openai' },
        profile
      )
    ).toThrow();
  });
});
