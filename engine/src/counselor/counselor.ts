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
  const { userMessage, context, llm, history = [] } = input;

  // 1. 위기 감지 (최우선)
  const crisis = detectCrisis(userMessage);
  if (crisis.crisis) {
    return {
      text: crisis.message,
      mode: 'panic',
      crisis,
      safetyFiltered: true,
      oneStep: '전문 상담사와 연결하는 것이 오늘의 가장 중요한 한 걸음입니다.',
    };
  }

  // 2. 상태 분류
  const mode = classifyState(userMessage);

  // 3. 프롬프트 구성
  const systemPrompt = buildSystemPrompt(mode, context);
  const userPrompt = buildUserPrompt(userMessage, mode, context, summarizeSaju(context));

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content }) as LLMMessage),
    { role: 'user', content: userPrompt },
  ];

  // 4. LLM 호출
  const response = await llm.chat(messages, { temperature: 0.7, maxTokens: 600 });
  let text = response.text;

  // 5. 안전 가드
  const guard = applySafetyGuard(text);
  text = guard.text;

  // 6. 오늘의 한 걸음 추출 (간단)
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

export { classifyState, detectCrisis, buildSystemPrompt, applySafetyGuard };
