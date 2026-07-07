import { toLunar } from 'kor-lunar';
import type { BirthInput, Branch, Element, FiveElements, Gender, Pillar, SajuChart, Stem, TenGod } from '../types.js';
import {
  BRANCHES,
  BRANCH_ELEMENT,
  BRANCH_HIDDEN_STEMS,
  HOUR_STEM_START,
  STEMS,
  STEM_ELEMENT,
  getTenGod,
} from './constants.js';
import { koreanGanzhiToHanja } from './korean-ganzhi-map.js';
import { findSolarTermDate, getMonthPillarBySolarTerm, MONTH_END_LONGITUDE } from './solar-term.js';

export { getTenGod };

const KST_LONGITUDE = 135; // 동경 135도
const MINUTES_PER_DEGREE = 4;

// 간지 문자열을 천간/지주로 분리
export function parsePillar(ganzhi: string): Pillar {
  if (ganzhi.length !== 2) throw new Error(`Invalid ganzi: ${ganzhi}`);
  const stem = ganzhi[0] as Stem;
  const branch = ganzhi[1] as Branch;
  if (!STEMS.includes(stem) || !BRANCHES.includes(branch)) {
    throw new Error(`Invalid stem or branch in: ${ganzhi}`);
  }
  return { stem, branch };
}

// 양력 날짜 → 일주 (kor-lunar iljin 사용)
export function getDayPillar(date: Date): Pillar {
  const lunar = toLunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return koreanGanzhiToHanja(lunar.iljin);
}

// 양력 날짜 → 연주 (kor-lunar secha 사용, 입춘 기준 보정 포함)
export function getYearPillar(date: Date): Pillar {
  const lunar = toLunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return koreanGanzhiToHanja(lunar.secha);
}

// 양력 날짜 → 월주 (절기/태양황경 기준)
export function getMonthPillar(date: Date, yearStem?: Stem): Pillar {
  if (!yearStem) {
    const lunar = toLunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return koreanGanzhiToHanja(lunar.wolgeon);
  }
  return getMonthPillarBySolarTerm(yearStem, date);
}

// 진태양시 보정 (간단 버전: 경도 차이만 반영, 균시차 무시)
export function applyTrueSolarTime(
  hour: number,
  minute: number,
  longitude?: number,
  timeZoneOffsetMinutes = 540
): { hour: number; minute: number; adjusted: boolean } {
  if (longitude === undefined) return { hour, minute, adjusted: false };

  const standardLongitude = timeZoneOffsetMinutes / 60 * 15; // UTC+9 → 135
  const diffMinutes = (longitude - standardLongitude) * MINUTES_PER_DEGREE;
  const totalMinutes = hour * 60 + minute - Math.round(diffMinutes);
  const adjustedHour = Math.floor(totalMinutes / 60) % 24;
  const adjustedMinute = totalMinutes % 60;
  return {
    hour: adjustedHour < 0 ? adjustedHour + 24 : adjustedHour,
    minute: adjustedMinute,
    adjusted: diffMinutes !== 0,
  };
}

// 시간 → 시주
export function getHourPillar(
  dayStem: Stem,
  hour: number,
  minute: number,
  options: { zishiBoundary?: 'standard' | 'early' } = {}
): Pillar {
  const boundary = options.zishiBoundary ?? 'standard';
  let branchIndex: number;

  if (boundary === 'early') {
    // 23:30~00:30 = 子, 00:30~02:30 = 丑, ...
    const totalMinutes = hour * 60 + minute;
    const shifted = (totalMinutes + 30) % 1440; // 23:30 → 0
    branchIndex = Math.floor(shifted / 120) % 12;
  } else {
    // 표준: 23:00~01:00 = 子
    const totalMinutes = hour * 60 + minute;
    branchIndex = Math.floor(((totalMinutes + 60) % 1440) / 120) % 12;
  }

  const branch = BRANCHES[branchIndex];
  const startStem = HOUR_STEM_START[dayStem];
  const startIndex = STEMS.indexOf(startStem);
  const stem = STEMS[(startIndex + branchIndex) % 10];

  return { stem, branch };
}

// 천간/지지의 오행 점수 산출 (기본: 천간 1점, 지지 본기 1점)
export function calculateFiveElements(pillars: Pillar[], includeHidden = false): FiveElements {
  const score: FiveElements = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  for (const p of pillars) {
    score[STEM_ELEMENT[p.stem]] += 1;
    score[BRANCH_ELEMENT[p.branch]] += 1;

    if (includeHidden) {
      const hidden = BRANCH_HIDDEN_STEMS[p.branch];
      for (const h of hidden) {
        score[STEM_ELEMENT[h]] += 0.5;
      }
    }
  }

  const total = Object.values(score).reduce((a, b) => a + b, 0);
  if (total === 0) return score;

  for (const k of Object.keys(score) as Element[]) {
    score[k] = Number(((score[k] / total) * 100).toFixed(2));
  }
  return score;
}

// 십성 매핑
export function calculateTenGods(dayStem: Stem, stems: Stem[]): Record<string, TenGod> {
  const result: Record<string, TenGod> = {};
  for (const s of stems) {
    result[s] = getTenGod(dayStem, s);
  }
  return result;
}

// 용신 산출 (간단 규칙)
export function calculateYongsin(dayStem: Stem, fiveElements: FiveElements): Element {
  const dayElement = STEM_ELEMENT[dayStem];
  const dayScore = fiveElements[dayElement];

  // 생하는 관계
  const produces: Record<Element, Element> = {
    木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
  };
  // 극하는 관계 (재성)
  const conquered: Record<Element, Element> = {
    木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
  };
  // 생해주는 관계 (인성)
  const producedBy: Record<Element, Element> = {
    木: '水', 水: '金', 金: '土', 土: '火', 火: '木',
  };

  // 일간 점수가 평균(20%) 이상이면 신강 → 재성(극하는 오행)을 용신
  if (dayScore >= 20) {
    return conquered[dayElement];
  }
  // 신약 → 인성(생해주는 오행)을 용신
  return producedBy[dayElement];
}

// 대운: 순행/역행 및 첫 대운 나이
// 순행: 현재 월지의 종료 절기까지 일수 / 3 (반올림)
// 역행: 현재 월지의 시작 절기까지 일수 / 3 (반올림)
export function calculateDaeun(
  birthDate: Date,
  yearStem: Stem,
  gender: Gender,
  monthBranch: Branch
): { startAge: number; direction: 'forward' | 'backward'; sequence: string[] } {
  const yearStemYang = STEMS.indexOf(yearStem) % 2 === 0; // 甲丙戊庚壬 = 양
  const isForward = gender === 'male' ? yearStemYang : !yearStemYang;

  const monthIndex = BRANCHES.indexOf(monthBranch);
  const sequence: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const idx = isForward
      ? (monthIndex + i) % 12
      : (monthIndex - i + 12) % 12;
    const branch = BRANCHES[idx];
    sequence.push(branch);
  }

  // 대운수 계산
  let daysToTerm: number;
  if (isForward) {
    const targetLon = MONTH_END_LONGITUDE[monthBranch];
    const termDate = findSolarTermDate(birthDate, targetLon);
    daysToTerm = (termDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
  } else {
    // 역행: 월지의 시작 절기까지 (간단화)
    const startLon = MONTH_END_LONGITUDE[monthBranch] - 30;
    const normalizedStartLon = (startLon + 360) % 360;
    const termDate = findSolarTermDate(birthDate, normalizedStartLon);
    daysToTerm = (termDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  const startAge = Math.max(0, Math.round(daysToTerm / 3));

  return { startAge, direction: isForward ? 'forward' : 'backward', sequence };
}

export function computeSaju(input: BirthInput): SajuChart {
  const { solarDate, birthTime, gender, location, useTrueSolarTime, zishiBoundary } = input;

  const notes: string[] = [];
  const lunar = toLunar(solarDate.getFullYear(), solarDate.getMonth() + 1, solarDate.getDate());

  const year = getYearPillar(solarDate);
  const month = getMonthPillar(solarDate, year.stem);
  const day = getDayPillar(solarDate);

  let hour: Pillar | undefined;
  let trueTimeStr: string | undefined;

  if (birthTime !== 'unknown') {
    let { hour: h, minute: m } = birthTime;

    if (useTrueSolarTime && location) {
      const adjusted = applyTrueSolarTime(h, m, location.lng, input.timeZoneOffsetMinutes);
      if (adjusted.adjusted) {
        h = adjusted.hour;
        m = adjusted.minute;
        trueTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        notes.push(`진태양시 보정 적용: ${trueTimeStr}`);
      }
    }

    hour = getHourPillar(day.stem, h, m, { zishiBoundary });
  } else {
    notes.push('출생 시각 모름: 시주 제외');
  }

  const pillars = [year, month, day];
  if (hour) pillars.push(hour);

  // 오행 분포: 천간 + 지지 본기 (골든 케이스 기준)
  const fiveElements = calculateFiveElements(pillars);

  // 십성
  const allStems = pillars.map(p => p.stem);
  const tenGods = calculateTenGods(day.stem, allStems);

  // 용신
  const yongsin = calculateYongsin(day.stem, fiveElements);

  // 대운
  const daeun = calculateDaeun(solarDate, year.stem, gender, month.branch);

  return {
    year,
    month,
    day,
    hour,
    dayMaster: day.stem,
    fiveElements,
    tenGods,
    yongsin,
    daeun: {
      startAge: daeun.startAge,
      direction: daeun.direction,
      ganZhi: daeun.sequence,
    },
    raw: {
      solarDate: solarDate.toISOString().slice(0, 10),
      lunarDate: `${lunar.year}-${String(lunar.month).padStart(2, '0')}-${String(lunar.day).padStart(2, '0')}`,
      trueSolarTime: trueTimeStr,
      notes,
    },
  };
}
