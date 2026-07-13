import { describe, it, expect } from 'vitest';
import { RuleBasedProvider, OllamaProvider } from '../llm/providers.js';
import { generateCounselorResponse } from '../counselor/counselor.js';
import type { UserContext } from '../counselor/types.js';

const baseContext: UserContext = {
  nickname: '테스트',
  profileSummary: '30대, 이직 고민 중',
  activeTools: ['saju'],
  toolWeights: { saju: 40 },
  privacyMode: true,
};

describe('RuleBasedProvider (오프라인 폴백)', () => {
  it('모드에 맞는 응답과 오늘의 한 걸음을 낸다', async () => {
    const p = new RuleBasedProvider();
    const res = await p.chat([
      { role: 'system', content: 'x' },
      { role: 'user', content: '사용자 메시지: "결정 못 하겠어요"\n\n현재 모드: indecisive. 답변해줘.' },
    ]);
    expect(res.text).toContain('오늘의 한 걸음');
    expect(res.text).toContain('선택지');
    expect(res.routedLocally).toBe(true);
    expect(res.usage.estimatedCostUsd).toBe(0);
  });

  it('counselor와 통합: 위기 메시지는 LLM 호출 없이 차단', async () => {
    const out = await generateCounselorResponse({
      userMessage: '죽고 싶어요',
      context: baseContext,
      llm: new RuleBasedProvider(),
    });
    expect(out.crisis?.crisis).toBe(true);
    expect(out.text).toContain('109');
    expect(out.safetyFiltered).toBe(true);
  });

  it('counselor와 통합: assessmentMode=crisis면 점술 중단', async () => {
    const out = await generateCounselorResponse({
      userMessage: '오늘 운세 봐줘',
      context: baseContext,
      llm: new RuleBasedProvider(),
      assessmentMode: 'crisis',
    });
    expect(out.mode).toBe('crisis');
    expect(out.text).toContain('109');
  });

  it('counselor와 통합: 일반 메시지는 폴백 응답 + 오늘의 한 걸음', async () => {
    const out = await generateCounselorResponse({
      userMessage: '결정 못 하겠어요',
      context: baseContext,
      llm: new RuleBasedProvider(),
    });
    expect(out.mode).toBe('indecisive');
    expect(out.text).toContain('오늘의 한 걸음');
  });
});

describe('OllamaProvider', () => {
  it('서버가 없으면 isAvailable=false', async () => {
    const p = new OllamaProvider({ baseUrl: 'http://127.0.0.1:59999' });
    expect(await p.isAvailable(500)).toBe(false);
  });

  it('비용 추정은 0달러(로컬)', async () => {
    const p = new OllamaProvider();
    const est = await p.getCostEstimate([{ role: 'user', content: '안녕하세요' }]);
    expect(est.estimatedCostUsd).toBe(0);
    expect(est.promptTokens).toBeGreaterThan(0);
  });
});
