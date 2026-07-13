import { describe, it, expect } from 'vitest';
import { containsSensitive, sanitizeSensitive, sanitizeMessages, selectProvider } from './privacyRouter.js';
import type { UserProfile } from '../stores/userStore.js';
import type { LLMProvider } from '@jinam/engine';

const profile: UserProfile = {
  nickname: '사용자',
  gender: 'male',
  birthDate: '1980-03-19',
  birthTime: '01:45',
  birthTimeUnknown: false,
  birthLocation: { lat: 35.87, lng: 128.6, name: '대구', timeZoneOffsetMinutes: 540 },
  useTrueSolarTime: true,
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
  id: 'openai-user',
  name: 'OpenAI',
  supportsPrivacyMode: false,
  chat: async () => ({ text: '', usage: { promptTokens: 0, completionTokens: 0 }, provider: 'openai', model: '', routedLocally: false }),
  getCostEstimate: async () => ({ promptTokens: 0, completionTokens: 0 }),
};

describe('Privacy Router', () => {
  const localOnly = { privacyMode: true, preferredProviderId: 'openai-user', cloudConsent: false };
  const cloudAllowed = { privacyMode: false, preferredProviderId: 'openai-user', cloudConsent: true };

  it('프로필과 구조화 PII 및 건강·사주 문맥을 감지한다', () => {
    expect(containsSensitive('1980-03-19에 태어났어', profile)).toBe(true);
    expect(containsSensitive('대구에서 태어났어', profile)).toBe(true);
    expect(containsSensitive('010-1234-5678로 연락해', profile)).toBe(true);
    expect(containsSensitive('me@example.com으로 보내줘', profile)).toBe(true);
    expect(containsSensitive('일간과 오행을 알려줘', profile)).toBe(true);
    expect(containsSensitive('불안 치료를 받고 있어', profile)).toBe(true);
    expect(containsSensitive('오늘 날씨 어때?', profile)).toBe(false);
  });

  it('프로필 값과 구조화 PII를 마스킹한다', () => {
    const text = '1980-03-19 대구에서 수면 문제가 있고 010-1234-5678, me@example.com이야';
    const sanitized = sanitizeSensitive(text, profile);
    ['1980-03-19', '대구', '수면', '010-1234-5678', 'me@example.com'].forEach(value => {
      expect(sanitized).not.toContain(value);
    });
  });

  it('메시지 배열의 민감정보를 역할을 보존한 채 마스킹한다', () => {
    const sanitized = sanitizeMessages([{ role: 'user', content: '대구 010-1234-5678' }], profile);
    expect(sanitized[0].role).toBe('user');
    expect(sanitized[0].content).toBe('[지역] [전화번호]');
  });

  it('프라이버시 모드면 로컬 LLM만 선택한다', () => {
    expect(selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '안녕' }],
      localOnly,
      profile,
    ).id).toBe('ollama');
  });

  it('클라우드 동의가 없으면 비민감 메시지도 네트워크 제공자를 선택하지 않는다', () => {
    expect(selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '오늘 날씨 어때?' }],
      { privacyMode: false, preferredProviderId: 'openai-user', cloudConsent: false },
      profile,
    ).id).toBe('ollama');
  });

  it('동의가 있어도 민감정보가 있으면 로컬 LLM을 선택한다', () => {
    expect(selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '900101-1234567이고 사주가 궁금해' }],
      cloudAllowed,
      profile,
    ).id).toBe('ollama');
  });

  it('명시 동의 + 민감 없음일 때만 선호 클라우드 LLM을 선택한다', () => {
    expect(selectProvider(
      [localProvider, cloudProvider],
      [{ role: 'user', content: '오늘 날씨 어때?' }],
      cloudAllowed,
      profile,
    ).id).toBe('openai-user');
  });

  it('로컬 LLM이 없고 로컬 라우팅이 필수면 예외가 발생하며 클라우드 호출은 0회다', async () => {
    let cloudCalls = 0;
    const countingCloud = { ...cloudProvider, chat: async (..._args: Parameters<LLMProvider['chat']>) => {
      cloudCalls += 1;
      return cloudProvider.chat([], {});
    } };

    expect(() => selectProvider(
      [countingCloud],
      [{ role: 'user', content: '생년월일은 1990-01-01이야' }],
      cloudAllowed,
      profile,
    )).toThrow();
    expect(cloudCalls).toBe(0);
  });
});
