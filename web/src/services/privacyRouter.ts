import type { LLMProvider, LLMMessage } from '@jinam/engine';
import type { UserProfile } from '../stores/userStore.js';

const PII_PATTERNS = [
  /\b(?:19|20)\d{2}[-/.년]\s?(?:0?[1-9]|1[0-2])[-/.월]\s?(?:0?[1-9]|[12]\d|3[01])일?\b/,
  /\b\d{6}\s?[- ]?\s?[1-4]\d{6}\b/,
  /\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/,
  /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/,
];

const SENSITIVE_CONTEXT_PATTERNS = [
  /생년월일|태어난\s*(?:날|시간|곳)|출생(?:일|시|지)/,
  /진단|질환|복용|약물|병력|상담|치료|우울|불안|자해|자살|수면\s*(?:장애|문제)/,
  /사주|팔자|일간|용신|오행|천간|지지|대운|세운/,
];

function profileValues(profile: UserProfile): string[] {
  return [
    profile.birthDate,
    profile.birthTime,
    profile.nickname,
    profile.birthLocation?.name ?? '',
    ...profile.healthContexts,
  ].filter(Boolean);
}

export function containsSensitive(text: string, profile: UserProfile): boolean {
  const lower = text.toLowerCase();
  return profileValues(profile).some(value => lower.includes(value.toLowerCase()))
    || PII_PATTERNS.some(pattern => pattern.test(text))
    || SENSITIVE_CONTEXT_PATTERNS.some(pattern => pattern.test(text));
}

export function sanitizeSensitive(text: string, profile: UserProfile): string {
  let sanitized = text;
  const replacements: Array<[RegExp, string]> = [
    [PII_PATTERNS[0], '[생년월일]'],
    [PII_PATTERNS[1], '[주민등록번호]'],
    [PII_PATTERNS[2], '[전화번호]'],
    [PII_PATTERNS[3], '[이메일]'],
  ];
  replacements.forEach(([pattern, replacement]) => {
    sanitized = sanitized.replace(new RegExp(pattern.source, 'gi'), replacement);
  });
  if (profile.birthDate) sanitized = sanitized.split(profile.birthDate).join('[생년월일]');
  if (profile.birthTime) sanitized = sanitized.split(profile.birthTime).join('[시각]');
  if (profile.nickname) sanitized = sanitized.split(profile.nickname).join('[이름]');
  if (profile.birthLocation?.name) sanitized = sanitized.split(profile.birthLocation.name).join('[지역]');
  profile.healthContexts.forEach((context) => {
    if (context) sanitized = sanitized.split(context).join('[건강 관심사]');
  });
  return sanitized;
}

export interface PrivacyRouterOptions {
  privacyMode: boolean;
  preferredProviderId: string;
  cloudConsent: boolean;
}

export function selectProvider(
  providers: LLMProvider[],
  messages: LLMMessage[],
  options: PrivacyRouterOptions,
  profile: UserProfile
): LLMProvider {
  const hasSensitive = messages.some(message => containsSensitive(message.content, profile));
  const selected = providers.find(provider => provider.id === options.preferredProviderId) ?? providers[0];
  const cloudBlocked = !selected.supportsPrivacyMode && !options.cloudConsent;

  if (options.privacyMode || hasSensitive || cloudBlocked) {
    const local = providers.find(p => p.supportsPrivacyMode);
    if (!local) {
      throw new Error('프라이버시 모드 사용 가능한 로컬 LLM이 없습니다.');
    }
    return local;
  }

  return selected;
}

export function sanitizeMessages(messages: LLMMessage[], profile: UserProfile): LLMMessage[] {
  return messages.map(m => ({
    ...m,
    content: sanitizeSensitive(m.content, profile),
  }));
}
