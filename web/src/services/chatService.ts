/**
 * 채팅 서비스: counselor 엔진 + Privacy Router + LLM 프로바이더 연결
 * architecture.md 5장(Privacy Router)·7장(counselor) 흐름 구현.
 */
import {
  generateCounselorResponse,
  OllamaProvider, OpenAIProvider, AnthropicProvider, RuleBasedProvider,
} from '@jinam/engine';
import type { LLMProvider, CounselorOutput, AdviceMode } from '@jinam/engine';
import type { UserProfile, UserSettings } from '../stores/userStore.js';
import { selectProvider, sanitizeMessages } from './privacyRouter.js';
import { computeSajuFromProfile } from './engineService.js';

export interface ChatServiceResult extends CounselorOutput {
  providerName: string;
  routedLocally: boolean;
}

function buildProviders(apiKeys: { openai?: string; anthropic?: string }): LLMProvider[] {
  const providers: LLMProvider[] = [new OllamaProvider()];
  if (apiKeys.openai) providers.push(new OpenAIProvider({ apiKey: apiKeys.openai }));
  if (apiKeys.anthropic) providers.push(new AnthropicProvider({ apiKey: apiKeys.anthropic }));
  providers.push(new RuleBasedProvider());
  return providers;
}

function buildProfileSummary(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.mbti) parts.push(`MBTI ${profile.mbti}`);
  if (profile.gender) parts.push(profile.gender === 'male' ? '남성' : '여성');
  if (profile.healthContexts.length) parts.push(`건강 관심사: ${profile.healthContexts.join(', ')}`);
  return parts.join(', ') || '프로필 미입력';
}

export async function sendChatMessage(params: {
  userMessage: string;
  profile: UserProfile;
  settings: UserSettings;
  apiKeys: { openai?: string; anthropic?: string };
  history: { role: 'user' | 'assistant'; content: string }[];
  assessmentMode?: AdviceMode;
}): Promise<ChatServiceResult> {
  const { userMessage, profile, settings, apiKeys, history, assessmentMode } = params;

  const providers = buildProviders(apiKeys);

  // Privacy Router: 프라이버시 모드/민감 정보 포함 시 로컬 우선
  let provider: LLMProvider;
  try {
    provider = selectProvider(
      providers,
      [{ role: 'user', content: userMessage }],
      {
        privacyMode: settings.privacyMode,
        preferredProviderId: settings.preferredLLM,
        cloudConsent: settings.cloudConsent,
      },
      profile
    );
  } catch {
    provider = new RuleBasedProvider();
  }

  // 로컬(Ollama) 선택 시 서버 접속 불가면 규칙 기반 폴백
  if (provider instanceof OllamaProvider && !(await provider.isAvailable(2500))) {
    provider = providers.find(p => p.id === 'rule-based')!;
  }

  // 클라우드로 나가는 경우 민감 정보 마스킹
  const shouldSanitize = !provider.supportsPrivacyMode;
  const saju = computeSajuFromProfile(profile) ?? undefined;

  const wrappedProvider: LLMProvider = shouldSanitize
    ? {
        id: provider.id,
        name: provider.name,
        supportsPrivacyMode: provider.supportsPrivacyMode,
        chat: (messages, options) => provider.chat(sanitizeMessages(messages, profile), options),
        getCostEstimate: (messages, options) => provider.getCostEstimate(sanitizeMessages(messages, profile), options),
      }
    : provider;

  const context = {
    nickname: shouldSanitize ? '친구' : profile.nickname || '친구',
    profileSummary: shouldSanitize ? '클라우드 전송 제외' : buildProfileSummary(profile),
    saju: shouldSanitize ? undefined : saju,
    activeTools: settings.activeModules,
    toolWeights: settings.moduleWeights,
    privacyMode: settings.privacyMode,
    crisisRegion: settings.crisisRegion,
  };

  try {
    const output = await generateCounselorResponse({
      userMessage,
      context,
      llm: wrappedProvider,
      history: history.slice(-10),
      assessmentMode,
    });
    return {
      ...output,
      providerName: provider.name,
      routedLocally: provider.supportsPrivacyMode,
    };
  } catch (err) {
    // LLM 호출 실패(서버 오류/키 오류/네트워크) 시 규칙 기반 폴백으로 재시도
    const fallback = new RuleBasedProvider();
    const output = await generateCounselorResponse({
      userMessage,
      context,
      llm: fallback,
      history: history.slice(-10),
      assessmentMode,
    });
    return {
      ...output,
      providerName: fallback.name,
      routedLocally: true,
    };
  }
}
