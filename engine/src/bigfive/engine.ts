import type { BigFiveScores, BigFiveDimension } from '../types.js';

const DIMENSION_LABELS: Record<BigFiveDimension, { high: string; low: string }> = {
  openness: { high: '개방성이 높음: 새로운 경험과 아이디어에 호기심이 많음', low: '전통과 익숙함을 선호함' },
  conscientiousness: { high: '성실성이 높음: 계획적이고 꾸준함', low: '유연하고 즉흥적임' },
  extraversion: { high: '외향성이 높음: 사회적 에너지가 풍부함', low: '내향적이며 깊은 집중을 선호함' },
  agreeableness: { high: '친화성이 높음: 협력과 공감을 중시함', low: '직설적이고 비판적 사고를 중시함' },
  neuroticism: { high: '신경성이 높음: 감정 변화에 민감함', low: '정서적 안정감이 높음' },
};

function clamp(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n)));
}

/**
 * Interpret a self-reported Big Five score set (1-5 Likert per dimension).
 * No official NEO-PI-R items are used; this is an IPIP-style self-assessment.
 */
export function interpretBigFive(scores: Partial<BigFiveScores>): BigFiveScores {
  const result: BigFiveScores = {
    openness: clamp(scores.openness ?? 3),
    conscientiousness: clamp(scores.conscientiousness ?? 3),
    extraversion: clamp(scores.extraversion ?? 3),
    agreeableness: clamp(scores.agreeableness ?? 3),
    neuroticism: clamp(scores.neuroticism ?? 3),
    note: 'IPIP-style self-assessment. Not a clinical diagnosis.',
  };
  return result;
}

export function getBigFiveInsight(scores: BigFiveScores, dimension: BigFiveDimension): string {
  const score = scores[dimension];
  const label = DIMENSION_LABELS[dimension];
  return score >= 4 ? label.high : score <= 2 ? label.low : '중간 수준: 상황에 따라 양쪽 성향을 모두 보임';
}

/**
 * Suggest a single "one step" action based on the most salient dimension.
 */
export function getBigFiveOneStep(scores: BigFiveScores): string {
  const dims: BigFiveDimension[] = ['neuroticism', 'conscientiousness', 'extraversion', 'openness', 'agreeableness'];
  // Pick the dimension furthest from the center (3) as the most salient.
  const salient = dims.reduce((a, b) =>
    Math.abs((scores[a] ?? 3) - 3) >= Math.abs((scores[b] ?? 3) - 3) ? a : b
  );

  const steps: Record<BigFiveDimension, string> = {
    neuroticism: '오늘 3분간 호흡에 집중하며 불안 신호 하나를 이름 붙여보세요.',
    conscientiousness: '오늘 해야 할 일 하나를 2분 안에 구체적인 첫 동작으로 쪼개보세요.',
    extraversion: '오늘 한 사람에게 짧은 인사나 감사 한 마디를 걸어보세요.',
    openness: '평소 시도하지 않았던 작은 경험 하나(노래, 길, 음식)를 해보세요.',
    agreeableness: '오늘 자신의 필요를 한 문장으로 먼저 표현해보세요.',
  };

  return steps[salient];
}
