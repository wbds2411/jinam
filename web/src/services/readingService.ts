import { saju } from '@jinam/engine';
import type { SajuChart } from '@jinam/engine';

export type Period = 'today' | 'tomorrow' | 'date' | 'month' | 'year';
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function readingRange(period: Period, selected: string, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (period === 'tomorrow') start.setDate(start.getDate() + 1);
  if (period === 'date') {
    const parts = selected.split('-').map(Number);
    start.setFullYear(parts[0], parts[1] - 1, parts[2]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selected) || localDate(start) !== selected) throw new Error('올바른 날짜를 선택해 주세요.');
  }
  if (period === 'month') start.setDate(1);
  if (period === 'year') start.setMonth(0, 1);
  const end = new Date(start);
  if (period === 'month') end.setMonth(end.getMonth() + 1, 0);
  if (period === 'year') end.setMonth(11, 31);
  if (start.getFullYear() < 1900 || start.getFullYear() > 2100) throw new Error('1900년부터 2100년 사이의 날짜를 선택해 주세요.');
  return { start, end, label: localDate(start) === localDate(end) ? localDate(start) : `${localDate(start)} ~ ${localDate(end)}` };
}
const ADVICE: Record<string, string> = {
  비견: '내 기준과 주변 사람의 의견을 나란히 적어 보세요.', 겁재: '공동 지출과 나의 지출을 구분해 확인해 보세요.',
  식신: '꾸준히 해온 일을 작은 결과물로 정리해 보세요.', 상관: '새로운 생각을 말하기 전에 상대가 원하는 것을 확인해 보세요.',
  편재: '새로운 기회는 비용과 감당할 수 있는 손실부터 살펴보세요.', 정재: '수입과 고정 지출을 정리하고 계획을 점검해 보세요.',
  편관: '부담스러운 일의 우선순위를 정하고 도움을 요청해 보세요.', 정관: '약속과 일정에서 지금 지킬 수 있는 것을 골라 보세요.',
  편인: '혼자 고민한 내용을 기록하고 다른 관점도 들어 보세요.', 정인: '배움과 휴식에 시간을 배분해 보세요.',
};
export function fortuneReading(period: Period, selected: string, chart: SajuChart | null, now = new Date()) {
  const range = readingRange(period, selected, now);
  if (!chart) return `${range.label}\n생년월일과 성별을 내 정보에 저장하면 사주 일간과 선택 기간의 간지를 비교할 수 있어요. 지금은 이 기간에 이루고 싶은 일과 필요한 도움을 하나씩 기록해 보세요.`;
  const pillar = period === 'year' ? saju.getYearPillar(range.start) : period === 'month' ? saju.getMonthPillar(range.start, saju.getYearPillar(range.start).stem) : saju.getDayPillar(range.start);
  const relation = saju.getTenGod(chart.dayMaster, pillar.stem);
  return `${range.label}\n내 일간 ${chart.dayMaster} · 기준 간지 ${pillar.stem}${pillar.branch} · 십성 ${relation}\n${ADVICE[relation]}\n${period === 'month' || period === 'year' ? '기간 시작일의 간지를 기준으로 한 간단한 상징 해석이며, 절기별 월운·대운을 종합한 분석은 아니에요.\n' : ''}재물·관계·건강의 실제 결과나 복권 당첨을 예측하는 분석은 아니에요.`;
}
const SYMBOLS = [
  { words: ['돼지'], name: '돼지', meaning: '풍요와 생활의 여유를 떠올리는 상징', number: 12 },
  { words: ['용'], name: '용', meaning: '큰 목표와 변화에 대한 기대를 떠올리는 상징', number: 5 },
  { words: ['물', '바다', '강'], name: '물', meaning: '감정의 흐름과 변화를 돌아보는 상징', number: 9 },
  { words: ['불', '화재'], name: '불', meaning: '열정이나 긴장감을 돌아보는 상징', number: 3 },
  { words: ['집', '방'], name: '집', meaning: '안정감과 생활 공간을 돌아보는 상징', number: 6 },
  { words: ['가족', '엄마', '아빠', '부모'], name: '가족', meaning: '유대감과 돌봄의 필요를 돌아보는 상징', number: 2 },
  { words: ['돈', '금', '보석'], name: '재물', meaning: '가치와 경제적 기대를 돌아보는 상징', number: 8 },
  { words: ['뱀'], name: '뱀', meaning: '변화에 대한 경계와 호기심을 돌아보는 상징', number: 7 },
];
export function dreamReading(dream: string, birthDate: string) {
  if (!dream.trim()) throw new Error('기억나는 꿈을 적어 주세요.');
  const matches = SYMBOLS.filter(symbol => symbol.words.some(word => dream.includes(word)));
  const digits = birthDate.replace(/\D/g, '');
  let number = digits ? [...digits].reduce((sum, digit) => sum + Number(digit), 0) : 0;
  while (number > 9) number = [...String(number)].reduce((sum, digit) => sum + Number(digit), 0);
  return {
    text: `${matches.length ? matches.map(symbol => `${symbol.name}: ${symbol.meaning}`).join('\n') : '등록된 상징과 일치하는 표현이 없어요. 꿈에서 가장 강했던 감정과 최근의 경험을 연결해 보세요.'}\n${number ? `저장된 생년월일 숫자의 합을 한 자리로 줄인 수비학 수: ${number} (전통적 상징 놀이)` : '생년월일이 없어 수비학 연결은 생략했어요.'}\n꿈 사전의 단어 일치 방식이며 AI 해석이나 미래 예측이 아니에요.`,
    symbolicNumbers: [...matches.map(symbol => symbol.number), ...(number ? [number] : [])],
  };
}
// Rejection sampling avoids modulo bias. Symbolic numbers are shown separately, never weighted.
export function lottoNumbers(random: (buffer: Uint32Array) => Uint32Array = buffer => crypto.getRandomValues(buffer)) {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = 0; index < 6; index++) {
    const size = 45 - index;
    const limit = Math.floor(0x100000000 / size) * size;
    let value: number;
    do { value = random(new Uint32Array(1))[0]; } while (value >= limit);
    const swap = index + value % size;
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}
