import type { CounselorInput, CounselorOutput, AdviceMode, UserContext } from './types.js';
import { buildSystemPrompt, buildUserPrompt } from './persona.js';
import { classifyState, detectCrisis } from './classifier.js';
import { applySafetyGuard } from './safety-guard.js';
import type { LLMMessage } from '../llm/types.js';

function summarizeSaju(context: UserContext): string | undefined {
  if (!context.saju) return undefined;
  const c = context.saju;
  const pillars = `${c.year.stem}${c.year.branch} ${c.month.stem}${c.month.branch} ${c.day.stem}${c.day.branch} ${c.hour ? c.hour.stem + c.hour.branch : '시주 없음'}`;
  return `일간: ${c.dayMaster}, 4주: ${pillars}, 용신: ${c.yongsin}, 오행: 목${c.fiveElements.木}/화${c.fiveElements.火}/토${c.fiveElements.土}/금${c.fiveElements.金}/수${c.fiveElements.水}`;
}

export async function generateCounselorResponse(input: CounselorInput): Promise<CounselorOutput> {
  const { userMessage, context, llm, history = [], assessmentMode } = input;

  // 1. 위기 감지 (최우선)
  const crisis = detectCrisis(userMessage, context.crisisRegion);
  if (crisis.crisis) {
    return {
      text: crisis.message,
      mode: 'crisis',
      crisis,
      safetyFiltered: true,
      oneStep: '전문 상담사와 연결하는 것이 오늘의 가장 중요한 한 걸음입니다.',
    };
  }

  // 2. 심리 평가 기반 위기 모드 (PHQ-9 등) — 점술 중단, 전문 자원 안내
  if (assessmentMode === 'crisis') {
    const crisisResult = detectCrisis('자살', context.crisisRegion);
    return {
      text: `최근 체크에서 마음이 많이 힘든 상태가 보였어요. 지금은 운세보다 당신의 안전이 먼저예요. ${crisisResult.message}\n\n오늘의 한 걸음: 지금 전문 지원에 연락하거나 믿을 수 있는 한 사람에게 메시지를 보내보세요.`,
      mode: 'crisis',
      crisis: crisisResult,
      safetyFiltered: true,
      oneStep: '전문 상담사와 연결하는 것이 오늘의 가장 중요한 한 걸음입니다.',
    };
  }

  // 3. 상태 분류 (심리 평가 모드가 있으면 우선, 단 키워드가 더 급하면 키워드 우선)
  const keywordMode = classifyState(userMessage);
  const mode = assessmentMode && keywordMode === 'reinforce' ? assessmentMode : keywordMode;

  // 4. 프롬프트 구성
  const systemPrompt = buildSystemPrompt(mode, context);
  const userPrompt = buildUserPrompt(userMessage, mode, context, summarizeSaju(context));

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content }) as LLMMessage),
    { role: 'user', content: userPrompt },
  ];

  // 5. LLM 호출
  const response = await llm.chat(messages, { temperature: 0.7, maxTokens: 600 });
  let text = response.text;

  // 6. 안전 가드
  const guard = applySafetyGuard(text);
  text = guard.text;

  // 7. 오늘의 한 걸음 추출 (간단)
  const oneStepMatch = text.match(/오늘의 한 걸음[:：]\s*(.+)/);
  const oneStep = oneStepMatch ? oneStepMatch[1].trim() : text.slice(-80);

  return {
    text,
    mode,
    crisis,
    safetyFiltered: guard.filtered,
    oneStep,
  };
}

export { classifyState, detectCrisis, getCrisisResources } from './classifier.js';
export { buildSystemPrompt, applySafetyGuard };
