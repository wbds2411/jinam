import type { NineStarKi } from '../types.js';

const ELEMENTS: Record<number, string> = {
  1: '수(水)',
  2: '토(土)',
  3: '목(木)',
  4: '목(木)',
  5: '토(土)',
  6: '금(金)',
  7: '금(金)',
  8: '토(土)',
  9: '화(火)',
};

const KEYWORDS: Record<number, string> = {
  1: '변화와 직관',
  2: '받침과 공감',
  3: '활력과 도전',
  4: '성장과 조화',
  5: '중심과 균형',
  6: '질서와 완성',
  7: '喜悅과 교류',
  8: '안정과 실천',
  9: '빛과 지도',
};

// Month star table starting from Lichun (approx. Feb 4).
// Index 0 = Jan before Lichun, 1 = Feb-Mar, ..., 12 = Jan next year.
const MONTH_STARS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7, 6];

/**
 * Calculate the yearly Nine Star Ki number.
 * Formula: (11 - ((year - 4) mod 9)) mapped to 1..9.
 */
export function getYearStar(year: number): number {
  const mod = ((year - 4) % 9 + 9) % 9;
  return mod === 0 ? 9 : 11 - mod;
}

/**
 * Calculate the monthly star from a solar date.
 * Uses an approximate lichun-based month (Feb 4 start).
 */
export function getMonthStar(date: Date): number {
  const year = date.getFullYear();
  // Lichun is approximately Feb 4.
  const lichun = new Date(year, 1, 4);
  let monthIndex = date.getMonth();
  if (date < lichun) {
    monthIndex = 0; // Jan before Lichun uses previous year's last index
  } else {
    monthIndex += 1;
  }
  return MONTH_STARS[monthIndex % 13];
}

/**
 * Approximate daily star using a 180-day cycle anchored at Lichun.
 * Several traditions exist; this is a simple reproducible approximation.
 */
export function getDayStar(date: Date): number {
  const year = date.getFullYear();
  const lichun = new Date(year, 1, 4);
  const diffDays = Math.floor((date.getTime() - lichun.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = ((diffDays % 180) + 180) % 180;
  // 180-day table: starts at 1 and alternates through 1..9.
  return (dayIndex % 9) + 1;
}

export function calculateNineStarKi(date: Date): NineStarKi {
  const yearStar = getYearStar(date.getFullYear());
  const monthStar = getMonthStar(date);
  const dayStar = getDayStar(date);

  return {
    yearStar,
    monthStar,
    dayStar,
    yearElement: ELEMENTS[yearStar],
    yearKeyword: KEYWORDS[yearStar],
  };
}
