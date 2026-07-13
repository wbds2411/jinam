/**
 * 결정의 나침반 - 계산 엔진 공통 타입
 */

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type Element = '木' | '火' | '土' | '金' | '水';
export type TenGod = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
export type Gender = 'male' | 'female';

export interface Pillar {
  stem: Stem;
  branch: Branch;
}

export interface BirthInput {
  solarDate: Date;
  birthTime: { hour: number; minute: number } | 'unknown';
  gender: Gender;
  location?: { lat: number; lng: number; name: string };
  timeZoneOffsetMinutes?: number; // UTC+9 = 540
  useTrueSolarTime?: boolean;
  trueSolarDateBoundary?: 'civil' | 'adjusted';
  zishiBoundary?: 'standard' | 'early'; // 'early': 23:30~00:30 자시 처리
}

export interface FiveElements {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour?: Pillar;
  dayMaster: Stem;
  fiveElements: FiveElements;
  tenGods: Record<string, TenGod>;
  yongsin: Element;
  daeun: {
    startAge: number;
    direction: 'forward' | 'backward';
    ganZhi: string[];
  };
  raw: {
    solarDate: string;
    lunarDate: string;
    trueSolarTime?: string;
    notes: string[];
  };
}

export interface ZodiacSign {
  sign: string;
  element?: string;
  startDate: string;
  endDate: string;
}

export interface TojeongResult {
  index: number; // 0~143
  name: string;
  keyword: string;
}

export interface ZodiacAnimal {
  animal: string;
  branch: Branch;
  standard: 'lichun' | 'lunarNewYear';
}

// --- Global astrology / symbolism domains ---

export interface VedicSign {
  sign: string; // e.g. Meṣa (Aries) in sidereal
  rashi: string; // Sanskrit rashi name
  nakshatra: string; // dominant nakshatra for sun sign entry
  ayanamsaDeg: number; // Lahiri ayanamsa value for the date
  note: string;
}

export interface NineStarKi {
  yearStar: number; // 1-9
  monthStar: number; // 1-9
  dayStar: number; // 1-9 (approximate)
  yearElement: string;
  yearKeyword: string;
}

export interface CelticTree {
  tree: string;
  ogham?: string;
  keyword: string;
  startDate: string; // MM-DD
  endDate: string; // MM-DD
}

// --- Global psychology domains ---

export type BigFiveDimension = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export interface BigFiveScores {
  openness: number; // 1-5
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  note: string;
}

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface AttachmentResult {
  style: AttachmentStyle;
  anxietyScore: number; // 1-5
  avoidanceScore: number; // 1-5
  keyword: string;
  note: string;
}

export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface EnneagramResult {
  type: EnneagramType;
  wing?: EnneagramType;
  keyword: string;
  note: string;
}
