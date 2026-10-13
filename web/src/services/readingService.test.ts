import { describe, expect, it } from 'vitest';
import { dreamReading, fortuneReading, localDate, lottoNumbers, readingRange } from './readingService.js';
import { computeSajuFromProfile } from './engineService.js';

describe('기간별 해석', () => {
  const now = new Date(2026, 11, 31, 23, 59);
  it('내일은 연도를 넘기며 이번 달과 올해는 전체 범위를 표시한다', () => {
    expect(readingRange('tomorrow', '', now).label).toBe('2027-01-01');
    expect(readingRange('month', '', now).label).toBe('2026-12-01 ~ 2026-12-31');
    expect(readingRange('year', '', now).label).toBe('2026-01-01 ~ 2026-12-31');
    expect(readingRange('month', '', new Date(2024, 1, 10)).label).toBe('2024-02-01 ~ 2024-02-29');
    expect(localDate(readingRange('today', '', now).start)).toBe('2026-12-31');
  });
  it('잘못된 날짜를 보정해서 해석하지 않는다', () => {
    for (const date of ['', '2026-02-30', 'invalid', '1899-01-01', '2101-01-01']) {
      expect(() => readingRange('date', date, now)).toThrow();
    }
    expect(readingRange('date', '2024-02-29', now).label).toBe('2024-02-29');
  });
  it('프로필 유무를 구분하고 사주 십성을 계산한다', () => {
    expect(fortuneReading('today', '', null, now)).toContain('생년월일과 성별');
    const chart = computeSajuFromProfile({ birthDate: '1980-03-19', birthTime: '01:45', birthTimeUnknown: false, gender: 'male', calendarType: 'solar', isLeapMonth: false });
    for (const period of ['today', 'tomorrow', 'month', 'year', 'date'] as const) {
      const result = fortuneReading(period, '2026-10-11', chart, now);
      expect(result).toContain('십성');
      expect(result).not.toContain('undefined');
      expect(result).toContain('예측하는 분석은 아니에요');
    }
  });
});

describe('꿈과 재미용 번호', () => {
  it('꿈 상징과 수비학 연결을 표시하며 일치하지 않으면 명시한다', () => {
    expect(dreamReading('가족과 돼지를 보았다', '1980-03-19').symbolicNumbers).toEqual([12, 2, 4]);
    expect(dreamReading('달 위를 걷는다', '').text).toContain('일치하는 표현이 없어요');
    expect(() => dreamReading('  ', '')).toThrow();
  });
  it('모든 번호는 1~45의 서로 다른 여섯 수이며 정렬된다', () => {
    for (let index = 0; index < 100; index++) {
      const numbers = lottoNumbers();
      expect(numbers).toHaveLength(6);
      expect(new Set(numbers).size).toBe(6);
      expect(numbers.every(number => number >= 1 && number <= 45)).toBe(true);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    }
  });
  it('균등 분포를 위한 제외 구간을 재추첨한다', () => {
    let calls = 0;
    const numbers = lottoNumbers(buffer => { buffer[0] = calls++ === 0 ? 0xffffffff : 0; return buffer; });
    expect(calls).toBe(7);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
