import { describe, it, expect } from 'vitest';
import {
  scoreDCS, scoreWHO5, scoreGAD7, scorePHQ9, scoreSleep,
  deriveAdviceMode, determineAdviceMode,
} from '../psych/assessment.js';

describe('DCS 점수화', () => {
  it('모두 강하게 동의(1)이면 0점(갈등 없음)', () => {
    const r = scoreDCS(Array(10).fill(1));
    expect(r.total).toBe(0);
    expect(r.level).toBe('low');
    expect(r.needsDecisionSupport).toBe(false);
  });

  it('모두 강하게 반대(5)이면 100점(갈등 최대)', () => {
    const r = scoreDCS(Array(10).fill(5));
    expect(r.total).toBe(100);
    expect(r.level).toBe('high');
    expect(r.needsDecisionSupport).toBe(true);
  });

  it('중간값(3)이면 50점 → high 경계 위', () => {
    const r = scoreDCS(Array(16).fill(3));
    expect(r.total).toBe(50);
    expect(r.level).toBe('high');
  });

  it('범위 밖 응답은 에러', () => {
    expect(() => scoreDCS([0, 3, 3])).toThrow();
    expect(() => scoreDCS([])).toThrow();
  });
});

describe('WHO-5 점수화', () => {
  it('전부 5이면 100점', () => {
    const r = scoreWHO5([5, 5, 5, 5, 5]);
    expect(r.total).toBe(100);
    expect(r.lowWellBeing).toBe(false);
    expect(r.depressionScreen).toBe(false);
  });

  it('raw 7 → 28점 → 우울 선별 플래그', () => {
    const r = scoreWHO5([2, 2, 1, 1, 1]);
    expect(r.total).toBe(28);
    expect(r.depressionScreen).toBe(true);
    expect(r.lowWellBeing).toBe(true);
  });

  it('5문항이 아니면 에러', () => {
    expect(() => scoreWHO5([1, 2, 3])).toThrow();
  });
});

describe('GAD-7 점수화', () => {
  it('총점과 중증도 구간', () => {
    expect(scoreGAD7([0, 0, 0, 0, 0, 0, 0]).severity).toBe('minimal');
    expect(scoreGAD7([1, 1, 1, 1, 1, 0, 0]).severity).toBe('mild');
    expect(scoreGAD7([2, 2, 2, 2, 2, 0, 0]).severity).toBe('moderate');
    expect(scoreGAD7([3, 3, 3, 3, 3, 0, 0]).severity).toBe('severe');
  });

  it('>= 10 이면 grounding 제안 플래그', () => {
    expect(scoreGAD7([2, 2, 2, 2, 2, 0, 0]).needsGrounding).toBe(true);
    expect(scoreGAD7([1, 1, 1, 1, 1, 0, 0]).needsGrounding).toBe(false);
  });
});

describe('PHQ-9 점수화', () => {
  it('총점과 중증도 구간', () => {
    expect(scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]).severity).toBe('minimal');
    expect(scorePHQ9([1, 1, 1, 1, 1, 0, 0, 0, 0]).severity).toBe('mild');
    expect(scorePHQ9([2, 2, 2, 2, 2, 0, 0, 0, 0]).severity).toBe('moderate');
    expect(scorePHQ9([2, 2, 2, 2, 2, 2, 2, 1, 0]).severity).toBe('moderately-severe');
    expect(scorePHQ9([3, 3, 3, 3, 3, 3, 3, 0, 0]).severity).toBe('severe');
  });

  it('9번 문항 >= 1 이면 자살 위험 플래그', () => {
    expect(scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 1]).suicidalityFlag).toBe(true);
    expect(scorePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 0]).suicidalityFlag).toBe(false);
  });
});

describe('수면 점수', () => {
  it('이상적 수면은 90점 이상', () => {
    const r = scoreSleep({ hours: 8, efficiency: 90, latencyMin: 10, quality: 5, awakenings: 0, deepPct: 17.5 });
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.status).toBe('normal');
  });

  it('열악한 수면은 40점 미만 → severe', () => {
    const r = scoreSleep({ hours: 4, efficiency: 60, latencyMin: 90, quality: 1, awakenings: 6 });
    expect(r.score).toBeLessThan(40);
    expect(r.status).toBe('severe');
  });
});

describe('통합 상태 엔진 deriveAdviceMode', () => {
  it('PHQ-9 자살 문항 >= 1 → crisis (총점 낮아도)', () => {
    const phq9 = scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(deriveAdviceMode({ phq9 })).toBe('crisis');
  });

  it('PHQ-9 >= 15 → crisis', () => {
    const phq9 = scorePHQ9([2, 2, 2, 2, 2, 2, 2, 1, 0]);
    expect(deriveAdviceMode({ phq9 })).toBe('crisis');
  });

  it('GAD-7 >= 10 → panic', () => {
    const gad7 = scoreGAD7([2, 2, 2, 2, 2, 0, 0]);
    expect(deriveAdviceMode({ gad7 })).toBe('panic');
  });

  it('WHO-5 <= 50 → withdrawn', () => {
    const who5 = scoreWHO5([2, 2, 2, 2, 2]);
    expect(deriveAdviceMode({ who5 })).toBe('withdrawn');
  });

  it('DCS >= 25 → indecisive', () => {
    const dcs = scoreDCS(Array(10).fill(3));
    expect(deriveAdviceMode({ dcs })).toBe('indecisive');
  });

  it('모두 정상 → reinforce', () => {
    expect(deriveAdviceMode({
      dcs: scoreDCS(Array(10).fill(1)),
      who5: scoreWHO5([4, 4, 4, 4, 4]),
      gad7: scoreGAD7([0, 0, 0, 0, 0, 0, 0]),
      phq9: scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    })).toBe('reinforce');
  });

  it('determineAdviceMode: StateVector 기반', () => {
    expect(determineAdviceMode({
      sleepScore: 80, stressLevel: 20, activityLevel: 50,
      decisionConflict: 10, anxiety: 2, depression: 16, wellBeing: 80,
    })).toBe('crisis');
    expect(determineAdviceMode({
      sleepScore: 30, stressLevel: 20, activityLevel: 50,
      decisionConflict: 10, anxiety: 2, depression: 2, wellBeing: 80,
    })).toBe('withdrawn');
  });
});
