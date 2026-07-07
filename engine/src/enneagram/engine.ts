import type { EnneagramResult, EnneagramType } from '../types.js';

const KEYWORDS: Record<EnneagramType, string> = {
  1: '원칙과 개선',
  2: '배려와 연결',
  3: '성취와 적응',
  4: '정체성과 깊이',
  5: '탐구와 경계',
  6: '안전과 충성',
  7: '가능성과 기쁨',
  8: '힘과 보호',
  9: '평화와 통합',
};

function isValidType(n: number): n is EnneagramType {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

/**
 * Map a self-reported Enneagram type (1-9) to result with optional wing.
 * Wing is the adjacent type with higher score. If no score provided, wing is omitted.
 */
export function getEnneagramResult(
  type: number,
  options?: { wingScores?: Partial<Record<EnneagramType, number>> }
): EnneagramResult {
  const core = isValidType(type) ? type : 1;
  const left = (core === 1 ? 9 : core - 1) as EnneagramType;
  const right = (core === 9 ? 1 : core + 1) as EnneagramType;

  const leftScore = options?.wingScores?.[left] ?? 0;
  const rightScore = options?.wingScores?.[right] ?? 0;
  const wing: EnneagramType | undefined = leftScore || rightScore
    ? (leftScore >= rightScore ? left : right)
    : undefined;

  return {
    type: core,
    wing,
    keyword: KEYWORDS[core],
    note: 'Self-reported Enneagram type for reflection. Scientific validation is limited.',
  };
}

export function getEnneagramOneStep(result: EnneagramResult): string {
  const steps: Record<EnneagramType, string> = {
    1: '오늘 한 가지를 "더 완벽하게" 하려기보다 "충분히 좋게" 마무리해보세요.',
    2: '오늘 누군가를 돕기 전에 먼저 자신의 에너지 상태를 1~10으로 점검해보세요.',
    3: '오늘 목표가 아닌, 당신이 진정으로 좋아하는 작은 순간 하나를 의식적으로 느껴보세요.',
    4: '오늘 감정 하나를 길게 끌기보다, 한 문장으로 표현하고 잠시 거리를 둬보세요.',
    5: '오늘 아는 것을 더 모으기보다, 이미 알고 있는 것을 한 사람과 나눠보세요.',
    6: '오늘 불안한 예측 하나를 "지금 실제로 일어난 사실"과 "내 해석"으로 나눠보세요.',
    7: '오늘 즐거운 계획 하나를 줄이고, 남은 한 가지에 깊이 집중해보세요.',
    8: '오늘 힘이 아닌, 한 사람의 의견을 먼저 듣고 3초 기다려보세요.',
    9: '오늘 "둘 다 괜찮아" 하려는 순간, 한 가지에 자신의 선호를 말해보세요.',
  };
  return steps[result.type];
}
