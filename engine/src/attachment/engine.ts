import type { AttachmentResult, AttachmentStyle } from '../types.js';

const STYLE_KEYWORDS: Record<AttachmentStyle, string> = {
  secure: '안정: 친밀함과 독립의 균형',
  anxious: '불안: 가까워지기를 원하면서 거부를 우려함',
  avoidant: '회피: 독립을 중시하며 과도한 친밀함에 부담을 느낌',
  disorganized: '혼란: 가까움에 대해 동시에 당김과 밀어냄',
};

function clamp(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n)));
}

/**
 * Map two-axis self-ratings (anxiety 1-5, avoidance 1-5) to a four-category
 * attachment style (Bartholomew & Horowitz model).
 *
 * - Low anxiety + low avoidance  -> secure
 * - High anxiety + low avoidance -> anxious
 * - Low anxiety + high avoidance -> avoidant
 * - High anxiety + high avoidance-> disorganized
 *
 * Threshold 3 splits low/high on a 1-5 scale.
 */
export function getAttachmentStyle(anxiety: number, avoidance: number): AttachmentResult {
  const a = clamp(anxiety);
  const v = clamp(avoidance);
  const highAnxiety = a >= 3;
  const highAvoidance = v >= 3;

  let style: AttachmentStyle;
  if (highAnxiety && highAvoidance) style = 'disorganized';
  else if (highAnxiety) style = 'anxious';
  else if (highAvoidance) style = 'avoidant';
  else style = 'secure';

  return {
    style,
    anxietyScore: a,
    avoidanceScore: v,
    keyword: STYLE_KEYWORDS[style],
    note: 'Self-report approximation based on Bartholomew & Horowitz four-category model. Not a clinical assessment.',
  };
}

export function getAttachmentOneStep(result: AttachmentResult): string {
  const steps: Record<AttachmentStyle, string> = {
    secure: '오늘 당신의 안정감을 누군가에게 한 마디로 전달해보세요.',
    anxious: '불안이 올라올 때 "지금 사실인가, 우려인가?" 한 번 스스로에게 물어보세요.',
    avoidant: '오늘 가까운 사람에게 작은 도움을 요청하거나 감정 한 가지를 나눠보세요.',
    disorganized: '혼란이 생기면 잠시 거리를 두고 3번의 긴 호흡으로 몸을 안정시켜보세요.',
  };
  return steps[result.style];
}
