import type { TenGod } from '../types.js';

export type MBTIType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export type BloodType = 'A' | 'B' | 'O' | 'AB';

export function getMBTIInterpretation(type: MBTIType): { strength: string; caution: string } {
  const map: Record<MBTIType, { strength: string; caution: string }> = {
    ISTJ: { strength: '책임감과 꾸준함', caution: '변화에 대한 유연성' },
    ISFJ: { strength: '배려와 헌신', caution: '자신의 필요 소홀' },
    INFJ: { strength: '통찰과 이상', caution: '완벽주의로 인한 피로' },
    INTJ: { strength: '전략과 독립성', caution: '타인 감정 고려 부족' },
    ISTP: { strength: '실용과 적응력', caution: '장기 계획 부족' },
    ISFP: { strength: '감수성과 현재 집중', caution: '갈등 회피' },
    INFP: { strength: '공감과 창의성', caution: '현실적 실행력 보강' },
    INTP: { strength: '논리와 탐구심', caution: '결정 지연' },
    ESTP: { strength: '행동력과 위기 대응', caution: '충동 조절' },
    ESFP: { strength: '에너지와 사교성', caution: '장기 목표 유지' },
    ENFP: { strength: '열정과 가능성 탐색', caution: '완주 집중력' },
    ENTP: { strength: '창의와 변혁', caution: '끈기와 마무리' },
    ESTJ: { strength: '조직력과 실행력', caution: '타인 의견 수용' },
    ESFJ: { strength: '조화와 협력', caution: '과도한 타인 의식' },
    ENFJ: { strength: '영감과 리더십', caution: '자기 경계' },
    ENTJ: { strength: '비전과 추진력', caution: '감정적 여유' },
  };
  return map[type] ?? { strength: '자기 이해의 출발점', caution: '유형에 갇히지 않기' };
}

export function getBloodTypeInterpretation(type: BloodType): { keyword: string; note: string } {
  const map: Record<BloodType, { keyword: string; note: string }> = {
    A: { keyword: '꼼꼼함과 조화', note: '과학적 근거는 약함. 재미/자기투사용으로만 참고하세요.' },
    B: { keyword: '자유로움과 창의', note: '과학적 근거는 약함. 재미/자기투사용으로만 참고하세요.' },
    O: { keyword: '활력과 주도성', note: '과학적 근거는 약함. 재미/자기투사용으로만 참고하세요.' },
    AB: { keyword: '융통성과 독특함', note: '과학적 근거는 약함. 재미/자기투사용으로만 참고하세요.' },
  };
  return map[type] ?? { keyword: '미지정', note: '과학적 근거는 약함.' };
}

export function mapSajuToTenGodDescription(tenGod: TenGod): { theme: string; oneStep: string } {
  const map: Record<TenGod, { theme: string; oneStep: string }> = {
    비견: { theme: '나와 닮은 힘', oneStep: '동료와 함께 한 가지 작은 목표를 세우세요.' },
    겁재: { theme: '경쟁과 도전', oneStep: '오늘은 남과 비교하지 말고 나만의 기준 하나를 세우세요.' },
    식신: { theme: '표현과 여유', oneStep: '좋아하는 음식이나 취미로 10분만 쉬어가세요.' },
    상관: { theme: '창의와 변화', oneStep: '평소와 다른 방식으로 한 가지 일을 시도필보세요.' },
    편재: { theme: '기회와 유연성', oneStep: '작은 기회 하나를 놓치지 말고 메모필두세요.' },
    정재: { theme: '안정과 관리', oneStep: '오늘 지출이나 시간 중 하나를 5분 정리필보세요.' },
    편관: { theme: '도전과 규율', oneStep: '미루고 있던 일 하나를 5분만 시작필보세요.' },
    정관: { theme: '질서와 책임', oneStep: '오늘의 우선순위 하나를 명확히 적어보세요.' },
    편인: { theme: '배움과 통찰', oneStep: '궁금했던 주제를 10분만 읽어보세요.' },
    정인: { theme: '보호와 지원', oneStep: '스스로에게 한 마디 따뜻한 말을 걸네보세요.' },
  };
  return map[tenGod];
}
