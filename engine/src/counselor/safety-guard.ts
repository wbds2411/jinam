const MEDICAL_PATTERNS = [
  /\b[\w가-힣]+병이다\b/,
  /\b[\w가-힣]+증이다\b/,
  /(진단|처방|약을 먹|약을 드|수술|입원|치료|검사 결과)/,
  /(의사가 아니|전문의|병원에 가)/,
];

const FATALISM_PATTERNS = [
  /(~할 운이다|~할 운세|~할 운|~할 운수|울운|대운|팔자|~할 운이라)/,
  /(네 운세는 .+이다|너는 .+ 운이다)/,
];

const NEGATIVE_PATTERNS = [
  /(흉|대흉|재앙|망한다|실패한다|안 된다|절대 안 돼|포기해)/,
];

const ONE_STEP_PATTERN = /오늘의 한 걸음|오늘 할 일|지금 할 수 있는|첫걸음/;

export interface SafetyCheckResult {
  safe: boolean;
  violations: string[];
  transformed?: string;
}

export function checkSafety(text: string): SafetyCheckResult {
  const violations: string[] = [];

  if (MEDICAL_PATTERNS.some(p => p.test(text))) {
    violations.push('medical_claim');
  }

  if (FATALISM_PATTERNS.some(p => p.test(text))) {
    violations.push('fatalism');
  }

  if (NEGATIVE_PATTERNS.some(p => p.test(text))) {
    violations.push('negative_forecast');
  }

  if (!ONE_STEP_PATTERN.test(text)) {
    violations.push('missing_one_step');
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}

export function transformNegativeToAction(text: string): string {
  let transformed = text;

  // 부정 표현을 행동 제안으로 변환
  transformed = transformed
    .replace(/(하지 마라|안 돼|위험해)/g, '대신 잠시 멈추고 한 깊은 숨을 들이쉬어 보세요.')
    .replace(/(망할|망한다|실패)/g, '지금은 작은 시도로 방향을 점검할 때예요.')
    .replace(/(재앙|큰일)/g, '어려운 흐름이니 한 걸음씩 처리해 보세요.');

  // 오늘의 한 걸음이 없으면 추가
  if (!ONE_STEP_PATTERN.test(transformed)) {
    transformed += '\n\n오늘의 한 걸음: 잠시 앉아서 숨을 고르고, 지금 가장 먼저 할 수 있는 작은 일 하나를 적어보세요.';
  }

  return transformed;
}

export function applySafetyGuard(text: string): { text: string; filtered: boolean; violations: string[] } {
  const check = checkSafety(text);
  if (check.safe) {
    return { text, filtered: false, violations: [] };
  }

  const transformed = transformNegativeToAction(text);
  return { text: transformed, filtered: true, violations: check.violations };
}
