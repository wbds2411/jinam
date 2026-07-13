/**
 * 검증(verified) 심리 도구 점수화 엔진
 * technical-application-guide.md 3장(심리학), 5장(수면), 9장(통합 상태 엔진) 기준
 *
 * 주의: 모든 도구는 선별(screening) 도구이며 임상 진단을 대체하지 않는다.
 */

export type AssessmentAdviceMode = 'reinforce' | 'indecisive' | 'withdrawn' | 'panic' | 'crisis';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ---------------------------------------------------------------------------
// DCS (Decisional Conflict Scale)
// ---------------------------------------------------------------------------

export interface DCSResult {
  total: number; // 0~100
  level: 'low' | 'moderate' | 'high';
  /** DCS >= 25 → 의사결정 지원 활성화 */
  needsDecisionSupport: boolean;
}

/**
 * DCS 점수화. 항목당 1~5 Likert(강하게 동의=1 ~ 강하게 반대=5).
 * 변환식: (합 - 문항수) / (문항수 × 4) × 100 → 0~100 (높을수록 갈등 큼)
 */
export function scoreDCS(answers: number[]): DCSResult {
  if (answers.length === 0) throw new Error('DCS 응답이 비어 있습니다.');
  answers.forEach(a => {
    if (a < 1 || a > 5) throw new Error(`DCS 응답은 1~5여야 합니다: ${a}`);
  });
  const n = answers.length;
  const sum = answers.reduce((acc, v) => acc + v, 0);
  const total = Math.round(((sum - n) / (n * 4)) * 1000) / 10;
  const level = total > 37.5 ? 'high' : total >= 26 ? 'moderate' : 'low';
  return { total, level, needsDecisionSupport: total >= 25 };
}

// ---------------------------------------------------------------------------
// WHO-5 Well-Being Index
// ---------------------------------------------------------------------------

export interface WHO5Result {
  raw: number;   // 0~25
  total: number; // 0~100 (raw × 4)
  /** <= 50: 웰빙 저하 가능성 */
  lowWellBeing: boolean;
  /** <= 28: 임상적 우울 선별 → 심리 건강 가드 강화 */
  depressionScreen: boolean;
}

/** WHO-5: 5문항, 각 0~5 */
export function scoreWHO5(answers: number[]): WHO5Result {
  if (answers.length !== 5) throw new Error('WHO-5는 5문항입니다.');
  answers.forEach(a => {
    if (a < 0 || a > 5) throw new Error(`WHO-5 응답은 0~5여야 합니다: ${a}`);
  });
  const raw = answers.reduce((acc, v) => acc + v, 0);
  const total = raw * 4;
  return { raw, total, lowWellBeing: total <= 50, depressionScreen: total <= 28 };
}

// ---------------------------------------------------------------------------
// GAD-7
// ---------------------------------------------------------------------------

export type Gad7Severity = 'minimal' | 'mild' | 'moderate' | 'severe';

export interface GAD7Result {
  total: number; // 0~21
  severity: Gad7Severity;
  /** >= 10 → grounding/ACT 기법 제안 */
  needsGrounding: boolean;
}

/** GAD-7: 7문항, 각 0~3 */
export function scoreGAD7(answers: number[]): GAD7Result {
  if (answers.length !== 7) throw new Error('GAD-7은 7문항입니다.');
  answers.forEach(a => {
    if (a < 0 || a > 3) throw new Error(`GAD-7 응답은 0~3이어야 합니다: ${a}`);
  });
  const total = answers.reduce((acc, v) => acc + v, 0);
  const severity: Gad7Severity =
    total >= 15 ? 'severe' : total >= 10 ? 'moderate' : total >= 5 ? 'mild' : 'minimal';
  return { total, severity, needsGrounding: total >= 10 };
}

// ---------------------------------------------------------------------------
// PHQ-9
// ---------------------------------------------------------------------------

export type Phq9Severity = 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';

export interface PHQ9Result {
  total: number; // 0~27
  severity: Phq9Severity;
  /** 9번 문항(자해/자살 사고) >= 1 → 즉시 위기 프로토콜, 점술 중단 */
  suicidalityFlag: boolean;
}

/** PHQ-9: 9문항, 각 0~3. answers[8]이 9번(자해) 문항. */
export function scorePHQ9(answers: number[]): PHQ9Result {
  if (answers.length !== 9) throw new Error('PHQ-9는 9문항입니다.');
  answers.forEach(a => {
    if (a < 0 || a > 3) throw new Error(`PHQ-9 응답은 0~3이어야 합니다: ${a}`);
  });
  const total = answers.reduce((acc, v) => acc + v, 0);
  const severity: Phq9Severity =
    total >= 20 ? 'severe'
    : total >= 15 ? 'moderately-severe'
    : total >= 10 ? 'moderate'
    : total >= 5 ? 'mild'
    : 'minimal';
  return { total, severity, suicidalityFlag: answers[8] >= 1 };
}

// ---------------------------------------------------------------------------
// 간이 수면 점수 (0~100, PSQI 참고 가중 모델)
// ---------------------------------------------------------------------------

export interface SleepInput {
  hours: number;        // 수면 시간
  efficiency: number;   // 수면 효율 % (침대에 있는 시간 대비)
  latencyMin: number;   // 잠들기까지 걸린 분
  quality: number;      // 주관적 질 1~5
  awakenings: number;   // 중간에 깬 횟수
  deepPct?: number;     // 깊은 수면 비율 % (웨어러블)
}

export type SleepStatus = 'normal' | 'mild' | 'moderate' | 'severe';

export interface SleepResult {
  score: number; // 0~100
  status: SleepStatus;
  oneStep: string;
}

export function scoreSleep(input: SleepInput): SleepResult {
  const duration = clamp((input.hours - 5) / 4, 0, 1) * 25;
  const efficiency = clamp((input.efficiency - 65) / 20, 0, 1) * 25;
  const latency = clamp(1 - (input.latencyMin - 15) / 45, 0, 1) * 15;
  const quality = (clamp(input.quality, 1, 5) / 5) * 20;
  const awakenings = clamp(1 - input.awakenings / 5, 0, 1) * 10;
  const deep = input.deepPct !== undefined
    ? clamp(1 - Math.abs(input.deepPct - 17.5) / 7.5, 0, 1) * 5
    : 2.5;
  const score = Math.round(duration + efficiency + latency + quality + awakenings + deep);

  let status: SleepStatus;
  let oneStep: string;
  if (score >= 80) {
    status = 'normal';
    oneStep = '지금의 수면 루틴을 오늘도 유지해 보세요.';
  } else if (score >= 60) {
    status = 'mild';
    oneStep = '오늘은 취침을 15분만 앞당기고, 오후엔 디카페인으로 바꿔보세요.';
  } else if (score >= 40) {
    status = 'moderate';
    oneStep = '수면이 회복될 때까지 중요한 결정은 잠시 미뤄두세요. 매일 같은 시각에 일어나는 것부터 시작해 보세요.';
  } else {
    status = 'severe';
    oneStep = '수면 문제가 이어진다면 전문의 상담을 권해요. 오늘은 잠들기 1시간 전 화면을 끄는 것 하나만 해보세요.';
  }
  return { score, status, oneStep };
}

// ---------------------------------------------------------------------------
// 통합 상태 엔진
// ---------------------------------------------------------------------------

export interface PsychologicalAssessment {
  dcs?: DCSResult;
  who5?: WHO5Result;
  gad7?: GAD7Result;
  phq9?: PHQ9Result;
  sleep?: SleepResult;
  updatedAt?: number;
}

/**
 * 상태 → 조언 모드 결정 (technical-application-guide.md 3.4/9.1)
 * 우선순위: crisis > panic > withdrawn > indecisive > reinforce
 */
export function deriveAdviceMode(a: PsychologicalAssessment): AssessmentAdviceMode {
  if (a.phq9 && (a.phq9.suicidalityFlag || a.phq9.total >= 15)) return 'crisis';
  if (a.gad7 && a.gad7.total >= 10) return 'panic';
  if ((a.who5 && a.who5.total <= 50) || (a.sleep && a.sleep.score < 40)) return 'withdrawn';
  if (a.dcs && a.dcs.total >= 25) return 'indecisive';
  return 'reinforce';
}

export interface StateVector {
  sleepScore: number;       // 0~100
  stressLevel: number;      // 0~100
  activityLevel: number;    // 0~100
  decisionConflict: number; // DCS total 0~100
  anxiety: number;          // GAD-7 0~21
  depression: number;       // PHQ-9 0~27
  wellBeing: number;        // WHO-5 0~100
}

export function determineAdviceMode(state: StateVector): AssessmentAdviceMode {
  if (state.depression >= 15) return 'crisis';
  if (state.anxiety >= 10) return 'panic';
  if (state.wellBeing <= 50 || state.sleepScore < 40) return 'withdrawn';
  if (state.decisionConflict >= 25) return 'indecisive';
  return 'reinforce';
}
