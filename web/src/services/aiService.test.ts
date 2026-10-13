import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildFacts, explainedNumbers, formatReading, streamReading, type AIReading } from './aiService.js';
import { useUserStore } from '../stores/userStore.js';
const profile = { ...useUserStore.getState().profile, birthDate: '1980-03-19', birthTime: '01:45', gender: 'male' as const,
  familyMembers: [{ id: 'f1', name: '가족', relation: '배우자', birthDate: '1982-04-10', birthTime: '', birthTimeUnknown: true, gender: 'female' as const, calendarType: 'solar' as const, isLeapMonth: false, context: '공동 지출' }],
  spaces: [{ id: 's1', kind: 'home' as const, name: '우리 집', entranceDirection: '남', deskDirection: '', description: '밝은 창문' }] };
const reading: AIReading = { summary: '해석', sections: [{ title: '가족', text: '자료를 연결함', evidenceIds: ['family-0'] }], numberCandidates: [{ number: 12, reason: '돼지의 임의 상징 대응', evidenceIds: ['dream-symbols'] }, { number: 12, reason: '중복', evidenceIds: [] }, { number: 9, reason: '물 상징', evidenceIds: [] }], followUp: '어떤 기분이었나요?' };
afterEach(() => { vi.unstubAllGlobals(); });
describe('AI 해석 자료와 근거', () => {
  it('실제 본인·가족 사주를 계산하고 공간의 모르는 방향을 명시한다', () => {
    const facts = buildFacts(profile, 'dream', 'today', '', '돼지 꿈', '생활 맥락');
    expect(facts.map(fact => fact.id)).toContain('personal-saju');
    const family = facts.find(fact => fact.id === 'family-0')?.value as { saju: { dayMaster: string } };
    expect(family.saju.dayMaster).toBeTruthy();
    expect(facts.find(fact => fact.id === 'space-0')?.value).toMatchObject({ deskDirection: '모름' });
    expect(JSON.stringify(facts)).not.toContain('1980-03-19');
  });
  it('월운은 일주 표본을, 연운은 열두 달의 월주 흐름을 함께 제공한다', () => {
    for (const period of ['month', 'year'] as const) {
      const facts = buildFacts(profile, 'fortune', period, '', '', '');
      const flow = facts.find(fact => fact.id === 'period-flow')?.value as { date: string; pillar: unknown; relation: string }[];
      expect(flow.length).toBe(period === 'year' ? 12 : Math.ceil(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() / 7));
      expect(flow.every(item => item.date && item.pillar && item.relation)).toBe(true);
    }
  });
  it('선택하지 않은 가족과 공간은 전송 자료에 포함하지 않는다', () => {
    const facts = buildFacts({ ...profile, familyMembers: [], spaces: [] }, 'question', 'year', '', '인생 질문', '');
    expect(facts.some(fact => fact.id.startsWith('family-') || fact.id.startsWith('space-') || fact.id === 'life-context')).toBe(false);
  });
  it('번호 후보 중복을 제거하고 무작위 보완 근거와 자료 출처를 표시한다', () => {
    const numbers = explainedNumbers(reading, [1, 2, 3, 4, 9, 12]);
    expect(numbers).toEqual([1, 2, 3, 4, 9, 12]);
    const text = formatReading(reading, [{ id: 'family-0', label: '가족 사주', value: {} }], numbers);
    expect(text).toContain('참고 자료: 가족 사주');
    expect(text).toContain('12: 돼지의 임의 상징 대응');
    expect(text).toContain('1: 부족한 후보를 무작위 번호로 보완');
  });
  it('NDJSON을 여러 청크로 받아 완료 이벤트까지 읽는다', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ type: 'stage', message: '해석 중' }) + '\n' + JSON.stringify({ type: 'done', result: reading }) + '\n');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes.slice(0, 35)); controller.enqueue(bytes.slice(35)); controller.close(); } }))));
    const progress = vi.fn();
    expect(await streamReading('c1', 'dream', [], new AbortController().signal, progress)).toEqual(reading);
    expect(progress).toHaveBeenCalledWith('해석 중');
  });
  it('완료 없이 스트림이 끝나면 부분 응답을 성공으로 표시하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"type":"progress"}\n')));
    await expect(streamReading('c1', 'dream', [], new AbortController().signal, () => {})).rejects.toThrow('완료되기 전에');
  });
});

describe('실제 접속 주소의 세션 오류', () => {
  it('Host 거부를 서버 중단으로 숨기지 않고 현재 접속 주소와 설정을 안내한다', async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: '허용되지 않은 접속입니다.' }), { status: 403 })));
    const { api } = await import('./aiService.js');
    await expect(api('connections')).rejects.toThrow('JINAM_ALLOWED_HOSTS');
  });
});
