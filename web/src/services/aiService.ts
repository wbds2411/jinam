import { saju } from '@jinam/engine';
import { computeSajuFromProfile } from './engineService.js';
import { dreamReading, readingRange, fortuneReading, localDate, type Period } from './readingService.js';
import type { UserProfile } from '../stores/userStore.js';
export interface Connection { id: string; provider: string; model: string; baseUrl: string; label: string; enabled: boolean; consent: boolean; hasKey: boolean; isDefault?: boolean }
export interface Provider { label: string; group: string; transport: string; base_url?: string; key: string; fixed_base?: boolean; login?: string }
export interface Catalog { groups: Record<string, string>; providers: Record<string, Provider> }
export interface Fact { id: string; label: string; value: unknown }
export interface AIReading { summary: string; sections: { title: string; text: string; evidenceIds: string[] }[]; numberCandidates: { number: number; reason: string; evidenceIds: string[] }[]; followUp: string }
let session: Promise<void> | undefined;
async function ensureSession() {
  if (!session) session = fetch('/api/session', { cache: 'no-store' }).then(async response => {
    if (response.ok) return;
    let message = '';
    try { message = (await response.json()).message || ''; } catch { /* A stopped proxy may return text. */ }
    if (response.status === 403) throw new Error(`현재 접속 주소(${window.location.host})에서 AI 서버 접근이 허용되지 않았어요. 서버의 JINAM_ALLOWED_HOSTS 설정을 확인해 주세요.${message ? ` ${message}` : ''}`);
    throw new Error(message || 'AI 서버에 연결하지 못했어요. 서버 실행 상태를 확인해 주세요.');
  }).catch(error => { session = undefined; throw error; });
  return session;
}
export async function api<T>(path: string, data?: unknown): Promise<T> {
  await ensureSession();
  const response = await fetch(`/api/${path}`, { method: data === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store' });
  if (response.status === 401 || response.status === 403) session = undefined;
  let result;
  try { result = await response.json(); } catch { throw new Error('AI 서버에 연결하지 못했어요. 서버 실행 상태를 확인해 주세요.'); }
  if (!response.ok) throw new Error(result.message || '요청에 실패했어요. 다시 시도해 주세요.');
  return result as T;
}
export async function streamReading(id: string, mode: string, facts: Fact[], signal: AbortSignal, progress: (message: string) => void): Promise<AIReading> {
  await ensureSession();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  let timer = window.setTimeout(abort, 60000);
  try {
    const response = await fetch('/api/reading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, mode, facts }), signal: controller.signal });
    if (!response.ok) { const error = await response.json(); throw new Error(error.message); }
    if (!response.body) throw new Error('해석 응답을 받지 못했어요.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      window.clearTimeout(timer);
      timer = window.setTimeout(abort, 60000);
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === 'stage' || event.type === 'wait') progress(event.message);
        if (event.type === 'error') throw new Error(event.message);
        if (event.type === 'done') { await reader.cancel(); return event.result as AIReading; }
      }
    }
    throw new Error('해석이 완료되기 전에 연결이 끊겼어요. 이 연결만 다시 시도해 주세요.');
  } catch (error) {
    if (controller.signal.aborted) throw new Error(signal.aborted ? '해석을 중지했어요. 입력과 성공한 결과는 유지됩니다.' : '모델이 60초 동안 응답하지 않았어요. 입력과 성공한 결과는 유지됩니다. 다시 시도해 주세요.');
    throw error;
  } finally { window.clearTimeout(timer); signal.removeEventListener('abort', abort); }
}
function chartFact(profile: Parameters<typeof computeSajuFromProfile>[0]) {
  const chart = computeSajuFromProfile(profile);
  return chart ? { pillars: { year: chart.year, month: chart.month, day: chart.day, hour: chart.hour }, dayMaster: chart.dayMaster, fiveElements: chart.fiveElements, yongsin: chart.yongsin, daeun: chart.daeun, notes: chart.raw.notes } : null;
}
export function buildFacts(profile: UserProfile, mode: string, period: Period, date: string, question: string, context: string): Fact[] {
  const range = readingRange(period, date);
  const facts: Fact[] = [{ id: 'period', label: '선택 기간 (양력)', value: { kind: period, range: range.label } }, { id: 'question', label: mode === 'dream' ? '꿈과 감정' : '질문', value: question }];
  const chart = chartFact(profile);
  if (chart) facts.push({ id: 'personal-saju', label: '본인 사주 계산', value: chart });
  if (mode === 'fortune') facts.push({ id: 'period-saju', label: '기간 간지 비교 (월·연은 시작일 기준)', value: fortuneReading(period, date, computeSajuFromProfile(profile)) });
  if (mode === 'fortune' && (period === 'month' || period === 'year')) {
    const samples = period === 'year'
      ? Array.from({ length: 12 }, (_, month) => new Date(range.start.getFullYear(), month, 15, 12))
      : Array.from({ length: Math.ceil(range.end.getDate() / 7) }, (_, index) => new Date(range.start.getFullYear(), range.start.getMonth(), 1 + index * 7, 12));
    facts.push({ id: 'period-flow', label: period === 'year' ? '매월 15일 기준 간지 비교 (절기 전체 분석 아님)' : '7일 간격 일주 비교 (월 전체의 표본)', value: samples.map(date => {
      const year = saju.getYearPillar(date);
      const pillar = period === 'year' ? saju.getMonthPillar(date, year.stem) : saju.getDayPillar(date);
      return { date: localDate(date), pillar, relation: chart ? saju.getTenGod(chart.dayMaster, pillar.stem) : null };
    }) });
  }
  if (mode === 'dream') facts.push({ id: 'dream-symbols', label: '사전 상징·생년월일 표기 기반 수비학 참고', value: dreamReading(question, profile.birthDate) });
  if (context.trim()) facts.push({ id: 'life-context', label: '사용자가 적은 생활 맥락', value: context });
  for (const [index, family] of (profile.familyMembers ?? []).entries()) {
    const chart = chartFact(family);
    facts.push({ id: `family-${index}`, label: `가족: ${family.name} (${family.relation})`, value: { relation: family.relation, context: family.context, saju: chart, missingBirth: !chart } });
  }
  for (const [index, space] of (profile.spaces ?? []).entries()) facts.push({ id: `space-${index}`, label: `${space.kind === 'home' ? '집' : '사무실'}: ${space.name}`, value: { entranceDirection: space.entranceDirection || '모름', deskDirection: space.deskDirection || '모름', description: space.description, note: '사용자 설명 기반이며 현장 감정·주소 기반 지리 분석 없음' } });
  return facts;
}
export function explainedNumbers(reading: AIReading, randomNumbers: number[]) {
  const selected = [...new Set(reading.numberCandidates.map(item => item.number))].slice(0, 6);
  for (const number of randomNumbers) { if (selected.length >= 6) break; if (!selected.includes(number)) selected.push(number); }
  return selected.sort((a, b) => a - b);
}
export function formatReading(reading: AIReading, facts: Fact[], numbers?: number[]) {
  const labels = new Map(facts.map(fact => [fact.id, fact.label]));
  return [reading.summary, ...reading.sections.map(section => `${section.title}\n${section.text}\n참고 자료: ${section.evidenceIds.map(id => labels.get(id) ?? id).join(', ') || '일반적인 상징 해석'}`), ...(numbers ? [`상징 기반 재미용 번호: ${numbers.join(', ')}\n${numbers.map(number => { const candidate = reading.numberCandidates.find(item => item.number === number); return `${number}: ${candidate ? candidate.reason : '부족한 후보를 무작위 번호로 보완'}`; }).join('\n')}\n꿈·사주·풍수·수비학은 당첨 확률을 높이지 않으며 어떤 6개 조합도 같은 확률입니다.`] : []), ...(reading.followUp ? [`더 알아볼 질문: ${reading.followUp}`] : [])].join('\n\n');
}

export interface ModelCatalog { models: string[]; model_choices: { id: string; label: string; is_default: boolean; resolved_model?: string }[]; model_source: string; configured_model: string; access_verified: boolean; model_note: string }
