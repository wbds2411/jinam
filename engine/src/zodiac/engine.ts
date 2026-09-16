import type { Branch, ZodiacAnimal } from '../types.js';

const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const BRANCH_ORDER: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function getLichunYear(year: number): number {
  // 입춘은 대략 2월 4일. 단순화: 2월 4일 이전이면 전년도로 간주
  // 실제로는 절기 계산 필요
  return year;
}

export function getZodiacAnimal(year: number, standard: 'lichun' | 'lunarNewYear' = 'lichun'): ZodiacAnimal {
  const baseYear = standard === 'lichun' ? getLichunYear(year) : year;
  // 1984년 = 子(쥐)
  const index = ((baseYear - 1984) % 12 + 12) % 12;
  return {
    animal: ANIMALS[index],
    branch: BRANCH_ORDER[index],
    standard,
  };
}
