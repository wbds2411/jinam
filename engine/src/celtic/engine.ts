import type { CelticTree } from '../types.js';

type TreeEntry = {
  tree: string;
  ogham: string;
  keyword: string;
  start: { month: number; day: number };
  end: { month: number; day: number };
};

// Modern reconstructed Celtic tree calendar (Robert Graves / popular tradition).
const TREES: TreeEntry[] = [
  { tree: '참나무(Birch)', ogham: 'Beith', keyword: '새로운 시작과 정화', start: { month: 12, day: 24 }, end: { month: 1, day: 20 } },
  { tree: '개암나무(Rowan)', ogham: 'Luis', keyword: '직관과 보호', start: { month: 1, day: 21 }, end: { month: 2, day: 17 } },
  { tree: '애쉬(Ash)', ogham: 'Nion', keyword: '연결과 내적 균형', start: { month: 2, day: 18 }, end: { month: 3, day: 17 } },
  { tree: '알더(Alder)', ogham: 'Fearn', keyword: '용기와 회복력', start: { month: 3, day: 18 }, end: { month: 4, day: 14 } },
  { tree: '버드나무(Willow)', ogham: 'Saille', keyword: '감수성과 적응', start: { month: 4, day: 15 }, end: { month: 5, day: 12 } },
  { tree: '오후나무(Hawthorn)', ogham: 'Uath', keyword: '갈등과 변모', start: { month: 5, day: 13 }, end: { month: 6, day: 9 } },
  { tree: '참나무(Oak)', ogham: 'Duir', keyword: '힘과 안정', start: { month: 6, day: 10 }, end: { month: 7, day: 7 } },
  { tree: '등나무(Holly)', ogham: 'Tinne', keyword: '방어와 에너지', start: { month: 7, day: 8 }, end: { month: 8, day: 4 } },
  { tree: '개암(Hazel)', ogham: 'Coll', keyword: '지혜와 창의', start: { month: 8, day: 5 }, end: { month: 9, day: 1 } },
  { tree: '포도나무(Vine)', ogham: 'Muin', keyword: '풍요와 변화', start: { month: 9, day: 2 }, end: { month: 9, day: 29 } },
  { tree: '아이비(Ivy)', ogham: 'Gort', keyword: '끈기와 치유', start: { month: 9, day: 30 }, end: { month: 10, day: 27 } },
  { tree: '갈고리덩굴(Reed)', ogham: 'Ngetal', keyword: '탐구와 진실', start: { month: 10, day: 28 }, end: { month: 11, day: 24 } },
  { tree: '까마귀박달나무(Elder)', ogham: 'Ruis', keyword: '변혁과 통찰', start: { month: 11, day: 25 }, end: { month: 12, day: 23 } },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isInRange(month: number, day: number, entry: TreeEntry): boolean {
  const key = month * 100 + day;
  const startKey = entry.start.month * 100 + entry.start.day;
  const endKey = entry.end.month * 100 + entry.end.day;

  if (startKey > endKey) {
    // Year-boundary range (Dec -> Jan)
    return key >= startKey || key <= endKey;
  }
  return key >= startKey && key <= endKey;
}

export function getCelticTree(date: Date): CelticTree {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const entry of TREES) {
    if (isInRange(month, day, entry)) {
      return {
        tree: entry.tree,
        ogham: entry.ogham,
        keyword: entry.keyword,
        startDate: `${pad(entry.start.month)}-${pad(entry.start.day)}`,
        endDate: `${pad(entry.end.month)}-${pad(entry.end.day)}`,
      };
    }
  }

  // Fallback should not happen because ranges cover the whole year.
  return {
    tree: '참나무(Birch)',
    ogham: 'Beith',
    keyword: '새로운 시작과 정화',
    startDate: '12-24',
    endDate: '01-20',
  };
}
