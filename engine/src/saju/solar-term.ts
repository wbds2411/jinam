import type { Branch, Pillar, Stem } from '../types.js';
import { BRANCHES, STEMS } from './constants.js';
import astronomia from 'astronomia';

const { julian, solar, base } = astronomia;

const MONTH_BRANCH_ORDER: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

// 연주 천간에 따른 寅월 천간
const YEAR_STEM_TO_MONTH_STEM_START: Record<Stem, Stem> = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '庚', 辛: '庚',
  丁: '壬', 壬: '壬',
  戊: '甲', 癸: '甲',
};

export function getSolarLongitude(date: Date): number {
  const jd = julian.DateToJD(date);
  const T = base.J2000Century(jd);
  const lonRad = solar.apparentLongitude(T);
  const lonDeg = (lonRad * 180) / Math.PI;
  return ((lonDeg % 360) + 360) % 360;
}

export function getMonthBranchBySolarLongitude(longitude: number): Branch {
  // 24절기를 12개월로 그룹화. 시작은 입춘(315°) = 寅.
  const normalized = ((longitude - 315 + 360) % 360);
  const monthIndex = Math.floor(normalized / 30) % 12;
  return MONTH_BRANCH_ORDER[monthIndex];
}

export function getMonthPillarBySolarTerm(yearStem: Stem, date: Date): Pillar {
  const lon = getSolarLongitude(date);
  const branch = getMonthBranchBySolarLongitude(lon);
  const branchIndex = MONTH_BRANCH_ORDER.indexOf(branch);
  const startStem = YEAR_STEM_TO_MONTH_STEM_START[yearStem];
  const startIndex = STEMS.indexOf(startStem);
  const stem = STEMS[(startIndex + branchIndex) % 10];
  return { stem, branch };
}

// 월지별 종료 절기 (다음 절기)의 태양황경
export const MONTH_END_LONGITUDE: Record<Branch, number> = {
  寅: 345, 卯: 15, 辰: 45, 巳: 75, 午: 105, 未: 135,
  申: 165, 酉: 195, 戌: 225, 亥: 255, 子: 285, 丑: 315,
};

export function findSolarTermDate(startDate: Date, targetLongitude: number): Date {
  // targetLongitude는 0~360 사이. startDate보다 미래의 날짜를 찾음.
  const startLon = getSolarLongitude(startDate);
  let normalizedTarget = targetLongitude;
  if (normalizedTarget <= startLon) {
    normalizedTarget += 360;
  }

  let low = startDate.getTime();
  let high = startDate.getTime() + 60 * 24 * 60 * 60 * 1000; // 최대 60일 후

  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const midLon = getSolarLongitude(midDate);
    const normalizedMidLon = midLon <= startLon ? midLon + 360 : midLon;

    if (normalizedMidLon < normalizedTarget) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}
