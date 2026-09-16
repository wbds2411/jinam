import { describe, it, expect } from 'vitest';
import { getZodiacSign } from '../astro/engine.js';
import { getZodiacAnimal } from '../zodiac/engine.js';
import { calculateTojeong } from '../tojeong/engine.js';
import { getMBTIInterpretation, getBloodTypeInterpretation } from '../psych/engine.js';

describe('별자리 엔진', () => {
  it('1980-03-19은 물고기자리', () => {
    const sign = getZodiacSign(new Date(1980, 2, 19));
    expect(sign.sign).toBe('물고기자리');
  });

  it('1980-04-15은 양자리', () => {
    const sign = getZodiacSign(new Date(1980, 3, 15));
    expect(sign.sign).toBe('양자리');
  });
});

describe('띠 엔진', () => {
  it('1980년은 원숭이띠(申)', () => {
    const z = getZodiacAnimal(1980);
    expect(z.animal).toBe('원숭이');
    expect(z.branch).toBe('申');
  });

  it('입춘/음력설 기준 분기 지원', () => {
    const lichun = getZodiacAnimal(2024, 'lichun');
    const lunar = getZodiacAnimal(2024, 'lunarNewYear');
    expect(lichun.branch).toBe('辰');
    expect(lunar.branch).toBe('辰');
  });
});

describe('토정비결 엔진', () => {
  it('결정적 인덱스 반환', () => {
    const result = calculateTojeong(1980, 2, 3, 2024);
    expect(result.index).toBeGreaterThanOrEqual(0);
    expect(result.index).toBeLessThan(144);
    expect(result.name).toBeTruthy();
    expect(result.keyword).toBeTruthy();
  });

  it('같은 입력 → 같은 결과 (결정적)', () => {
    const a = calculateTojeong(1980, 2, 3, 2024);
    const b = calculateTojeong(1980, 2, 3, 2024);
    expect(a.index).toBe(b.index);
  });
});

describe('심리 도구', () => {
  it('MBTI 해석 매핑', () => {
    const r = getMBTIInterpretation('INFJ');
    expect(r.strength).toContain('통찰');
    expect(r.caution).toBeTruthy();
  });

  it('혈액형 해석 경고 포함', () => {
    const r = getBloodTypeInterpretation('A');
    expect(r.note).toContain('과학적 근거는 약함');
  });
});
