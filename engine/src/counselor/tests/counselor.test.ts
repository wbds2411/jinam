import { describe, it, expect } from 'vitest';
import { generateCounselorResponse, classifyState, detectCrisis, applySafetyGuard } from '../counselor.js';
import type { LLMProvider, LLMResponse, LLMUsage } from '../../llm/types.js';
import type { UserContext } from '../types.js';

function createMockLLM(fixedText: string): LLMProvider {
  return {
    id: 'mock',
    name: 'Mock LLM',
    supportsPrivacyMode: true,
    async chat() {
      const usage: LLMUsage = { promptTokens: 100, completionTokens: 50, estimatedCostUsd: 0 };
      return { text: fixedText, usage, provider: 'mock', model: 'mock', routedLocally: true };
    },
    async getCostEstimate() {
      return { promptTokens: 100, completionTokens: 50 };
    },
  };
}

const baseContext: UserContext = {
  nickname: '사용자',
  profileSummary: '1980-03-19 대구 남',
  activeTools: ['saju', 'psych'],
  toolWeights: { saju: 60, psych: 40 },
  privacyMode: true,
};

describe('위기 감지 및 안전', () => {
  it('자해 신호가 감지되면 점술 응답을 차단하고 위기 자원으로 연결한다', async () => {
    const llm = createMockLLM('당신의 사주는...');
    const result = await generateCounselorResponse({
      userMessage: '너무 힘들어서 죽고 싶어',
      context: baseContext,
      llm,
    });

    expect(result.crisis?.crisis).toBe(true);
    expect(result.crisis?.type).toBe('suicide');
    expect(result.text).toContain('1577-0199');
    expect(result.text).not.toContain('사주');
    expect(result.safetyFiltered).toBe(true);
  });

  it('자해 키워드가 여러 패턴에서 감지된다', () => {
    expect(detectCrisis('자해하고 싶어').crisis).toBe(true);
    expect(detectCrisis('손목을 베고 싶어').crisis).toBe(true);
    expect(detectCrisis('모두 죽여버릴까').crisis).toBe(true);
    expect(detectCrisis('오늘 날씨 좋다').crisis).toBe(false);
  });
});

describe('상태 분류', () => {
  it('공황 상태', () => {
    expect(classifyState('숨이 막혀, 심장이 너무 빨라')).toBe('panic');
  });

  it('위축 상태', () => {
    expect(classifyState('아무것도 하기 싫고 무기력해')).toBe('withdrawn');
  });

  it('결정 곤란', () => {
    expect(classifyState('이 직장을 그만둘지 말지 고민이야')).toBe('indecisive');
  });

  it('확신 보강', () => {
    expect(classifyState('오늘 운세 어때?')).toBe('reinforce');
  });
});

describe('안전 필터', () => {
  it('의료 단정 표현을 차단한다', () => {
    const result = applySafetyGuard('당신은 우울증이다. 약을 먹어라.');
    expect(result.filtered).toBe(true);
    expect(result.violations).toContain('medical_claim');
  });

  it('단정적 운세 표현을 차단한다', () => {
    const result = applySafetyGuard('너는 큰 운이다. 반드시 성공할 운세야.');
    expect(result.filtered).toBe(true);
    expect(result.violations).toContain('fatalism');
  });

  it('부정 표현은 행동 제안으로 변환한다', () => {
    const result = applySafetyGuard('이 일은 망할 거야. 하지 마.');
    expect(result.text).not.toContain('망할');
    expect(result.text).toContain('오늘의 한 걸음');
  });

  it('오늘의 한 걸음이 없으면 추가한다', () => {
    const result = applySafetyGuard('그냥 힘내세요.');
    expect(result.filtered).toBe(true);
    expect(result.violations).toContain('missing_one_step');
    expect(result.text).toContain('오늘의 한 걸음');
  });
});

describe('상담 응답 생성', () => {
  it('안전한 LLM 응답은 그대로 전달하고 oneStep을 추출한다', async () => {
    const llm = createMockLLM('힘든 하루였네요. 오늘의 한 걸음: 창문을 5분 열고 숨을 내쉬어 보세요.');
    const result = await generateCounselorResponse({
      userMessage: '오늘 머리가 복잡해',
      context: baseContext,
      llm,
    });

    expect(result.mode).toBe('reinforce');
    expect(result.safetyFiltered).toBe(false);
    expect(result.oneStep).toContain('창문을 5분 열고');
  });

  it('LLM 응답에 부정 표현이 있으면 가드가 수정한다', async () => {
    const llm = createMockLLM('이건 망할 운세야. 하지 마.');
    const result = await generateCounselorResponse({
      userMessage: '오늘 운세 어때?',
      context: baseContext,
      llm,
    });

    expect(result.safetyFiltered).toBe(true);
    expect(result.text).not.toContain('망할');
    expect(result.text).toContain('오늘의 한 걸음');
  });
});
