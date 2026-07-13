import { describe, expect, it } from 'vitest';
import { buildDailyGuidance } from './dailyGuidance.js';

describe('daily guidance', () => {
  it('요청한 날짜와 해당 일주를 안내한다', () => {
    const guidance = buildDailyGuidance(new Date(2026, 6, 13));
    expect(guidance).toContain('7월 13일');
    expect(guidance).toMatch(/일주는 [甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/);
    expect(guidance).toContain('미래를 단정하지 않아요');
  });

  it('날짜가 달라지면 일주 안내도 달라진다', () => {
    expect(buildDailyGuidance(new Date(2026, 6, 13))).not.toBe(buildDailyGuidance(new Date(2026, 6, 14)));
  });
});
