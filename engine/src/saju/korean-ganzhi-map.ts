import type { Stem, Branch } from '../types.js';

// kor-lunar는 간지를 한글 음(세차/월건/일진)으로 반환한다.
// 이를 전통 한자 간지로 변환하는 매핑 테이블.
export const KOREAN_STEM_TO_HANJA: Record<string, Stem> = {
  갑: '甲',
  을: '乙',
  병: '丙',
  정: '丁',
  무: '戊',
  기: '己',
  경: '庚',
  신: '辛',
  임: '壬',
  계: '癸',
};

export const KOREAN_BRANCH_TO_HANJA: Record<string, Branch> = {
  자: '子',
  축: '丑',
  인: '寅',
  묘: '卯',
  진: '辰',
  사: '巳',
  오: '午',
  미: '未',
  신: '申',
  유: '酉',
  술: '戌',
  해: '亥',
};

export function koreanGanzhiToHanja(korean: string): { stem: Stem; branch: Branch } {
  if (korean.length !== 2) {
    throw new Error(`Invalid korean ganzhi: ${korean}`);
  }
  const stem = KOREAN_STEM_TO_HANJA[korean[0]];
  const branch = KOREAN_BRANCH_TO_HANJA[korean[1]];
  if (!stem || !branch) {
    throw new Error(`Cannot map korean ganzhi to hanja: ${korean}`);
  }
  return { stem, branch };
}
