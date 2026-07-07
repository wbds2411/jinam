import type { Stem, Branch, Element, TenGod } from '../types.js';

export const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  子: '水', 亥: '水',
};

// 지장간 (지지 안에 숨은 천간: 본기, 중기, 정기)
export const BRANCH_HIDDEN_STEMS: Record<Branch, Stem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

// 십성: 일간 기준으로 다른 천간과의 관계
// 기준: 일간의 오행과 상대 천간의 오행, 그리고 음양
export function getTenGod(dayStem: Stem, targetStem: Stem): TenGod {
  const dayEl = STEM_ELEMENT[dayStem];
  const targetEl = STEM_ELEMENT[targetStem];
  const dayYin = STEMS.indexOf(dayStem) % 2 === 1; // 乙丁己辛癸 = 음
  const targetYin = STEMS.indexOf(targetStem) % 2 === 1;
  const samePolarity = dayYin === targetYin;

  // 나와 같은 오행
  if (targetEl === dayEl) {
    return samePolarity ? '비견' : '겁재';
  }

  // 내가 생하는 오행 (식상)
  const producing: Record<Element, Element> = {
    木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
  };
  if (targetEl === producing[dayEl]) {
    return samePolarity ? '식신' : '상관';
  }

  // 내가 극하는 오행 (재성)
  const conquered: Record<Element, Element> = {
    木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
  };
  if (targetEl === conquered[dayEl]) {
    return samePolarity ? '편재' : '정재';
  }

  // 나를 극하는 오행 (관살)
  const conquering: Record<Element, Element> = {
    木: '金', 金: '火', 火: '水', 水: '土', 土: '木',
  };
  if (targetEl === conquering[dayEl]) {
    return samePolarity ? '편관' : '정관';
  }

  // 나를 생하는 오행 (인성)
  return samePolarity ? '편인' : '정인';
}

// 시주 천간: 일간에 따른 자시(子時) 천간
export const HOUR_STEM_START: Record<Stem, Stem> = {
  甲: '甲', 己: '甲',
  乙: '丙', 庚: '丙',
  丙: '戊', 辛: '戊',
  丁: '庚', 壬: '庚',
  戊: '壬', 癸: '壬',
};

// 절기(24절기) 이름과 태양황경 (대략)
export const SOLAR_TERMS = [
  { name: '입춘', longitude: 315 },
  { name: '우수', longitude: 330 },
  { name: '경칩', longitude: 345 },
  { name: '춘분', longitude: 0 },
  { name: '청명', longitude: 15 },
  { name: '곡우', longitude: 30 },
  { name: '입하', longitude: 45 },
  { name: '소만', longitude: 60 },
  { name: '망종', longitude: 75 },
  { name: '하지', longitude: 90 },
  { name: '소서', longitude: 105 },
  { name: '대서', longitude: 120 },
  { name: '입추', longitude: 135 },
  { name: '처서', longitude: 150 },
  { name: '백로', longitude: 165 },
  { name: '추분', longitude: 180 },
  { name: '한로', longitude: 195 },
  { name: '상강', longitude: 210 },
  { name: '입동', longitude: 225 },
  { name: '소설', longitude: 240 },
  { name: '대설', longitude: 255 },
  { name: '동지', longitude: 270 },
  { name: '소한', longitude: 285 },
  { name: '대한', longitude: 300 },
];
