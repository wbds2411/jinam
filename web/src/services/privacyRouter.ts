import type { LLMProvider, LLMMessage } from '@jinam/engine';
import type { UserProfile } from '../stores/userStore.js';

export function containsSensitive(text: string, profile: UserProfile): boolean {
  const checks: string[] = [];
  if (profile.birthDate) checks.push(profile.birthDate);
  if (profile.birthTime) checks.push(profile.birthTime);
  if (profile.nickname) checks.push(profile.nickname);
  if (profile.birthLocation?.name) checks.push(profile.birthLocation.name);
  profile.healthContexts.forEach(h => checks.push(h));

  const lower = text.toLowerCase();
  return checks.some(c => c && lower.includes(c.toLowerCase()));
}

export function sanitizeSensitive(text: string, profile: UserProfile): string {
  let sanitized = text;
  if (profile.birthDate) sanitized = sanitized.split(profile.birthDate).join('[생년월일]');
  if (profile.birthTime) sanitized = sanitized.split(profile.birthTime).join('[시각]');
  if (profile.birthLocation?.name) sanitized = sanitized.split(profile.birthLocation.name).join('[지역]');
  profile.healthContexts.forEach((h) => {
    if (h) sanitized = sanitized.split(h).join('[건강 관심사]');
  });
  return sanitized;
}

export interface PrivacyRouterOptions {
  privacyMode: boolean;
  preferredProviderId: string;
}

export function selectProvider(
  providers: LLMProvider[],
  messages: LLMMessage[],
  options: PrivacyRouterOptions,
  profile: UserProfile
): LLMProvider {
  const hasSensitive = messages.some(m => containsSensitive(m.content, profile));

  if (options.privacyMode || hasSensitive) {
    const local = providers.find(p => p.supportsPrivacyMode);
    if (!local) {
      throw new Error('프라이버시 모드 사용 가능한 로컬 LLM이 없습니다.');
    }
    return local;
  }

  const selected = providers.find(p => p.id === options.preferredProviderId) ?? providers[0];
  return selected;
}

export function sanitizeMessages(messages: LLMMessage[], profile: UserProfile): LLMMessage[] {
  return messages.map(m => ({
    ...m,
    content: sanitizeSensitive(m.content, profile),
  }));
}
