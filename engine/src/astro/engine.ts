import type { ZodiacSign } from '../types.js';

// 12궁 시작일 (근사: 2000년 기준, ±1일 가능)
// 경계일 출생자는 astronomia 태양황경 계산으로 정확도를 높일 수 있음.
const SIGN_BOUNDARIES: Record<string, { month: number; day: number }> = {
  양자리: { month: 3, day: 21 },
  황소자리: { month: 4, day: 20 },
  쌍둥이자리: { month: 5, day: 21 },
  게자리: { month: 6, day: 22 },
  사자자리: { month: 7, day: 23 },
  처녀자리: { month: 8, day: 23 },
  천칭자리: { month: 9, day: 23 },
  전갈자리: { month: 10, day: 23 },
  사수자리: { month: 11, day: 22 },
  염소자리: { month: 12, day: 22 },
  물병자리: { month: 1, day: 20 },
  물고기자리: { month: 2, day: 19 },
};

const SIGNS = [
  '양자리',
  '황소자리',
  '쌍둥이자리',
  '게자리',
  '사자자리',
  '처녀자리',
  '천칭자리',
  '전갈자리',
  '사수자리',
  '염소자리',
  '물병자리',
  '물고기자리',
];

function dateToKey(month: number, day: number): number {
  return month * 100 + day;
}

export function getZodiacSign(solarDate: Date): ZodiacSign {
  const month = solarDate.getMonth() + 1;
  const day = solarDate.getDate();
  const key = dateToKey(month, day);

  for (let i = 0; i < SIGNS.length; i++) {
    const sign = SIGNS[i];
    const nextSign = SIGNS[(i + 1) % SIGNS.length];
    const start = SIGN_BOUNDARIES[sign];
    const end = SIGN_BOUNDARIES[nextSign];

    const startKey = dateToKey(start.month, start.day);
    const endKey = dateToKey(end.month, end.day);

    // 연말~연초 경계(염소/물병/물고기/양) 처리
    if (startKey > endKey) {
      if (key >= startKey || key < endKey) {
        return { sign, startDate: `${start.month}-${start.day}`, endDate: `${end.month}-${end.day}` };
      }
    } else {
      if (key >= startKey && key < endKey) {
        return { sign, startDate: `${start.month}-${start.day}`, endDate: `${end.month}-${end.day}` };
      }
    }
  }

  // fallback
  return { sign: '물고기자리', startDate: '2-19', endDate: '3-21' };
}
