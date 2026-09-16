import { describe, it, expect } from 'vitest';
import { vedic, ninestar, celtic, bigfive, attachment, enneagram } from '../index.js';

describe('Global astrology domains', () => {
  it('computes Vedic sun sign for 1990-06-15', () => {
    const result = vedic.getVedicSign(new Date('1990-06-15'));
    expect(result.sign).toBeTypeOf('string');
    expect(result.rashi).toBeTypeOf('string');
    expect(result.ayanamsaDeg).toBeGreaterThan(20);
    expect(result.ayanamsaDeg).toBeLessThan(30);
  });

  it('computes Nine Star Ki year star for 2000', () => {
    expect(ninestar.getYearStar(2000)).toBe(4);
  });

  it('computes Nine Star Ki for a date', () => {
    const result = ninestar.calculateNineStarKi(new Date('2000-03-15'));
    expect(result.yearStar).toBe(4);
    expect(result.monthStar).toBeGreaterThanOrEqual(1);
    expect(result.monthStar).toBeLessThanOrEqual(9);
    expect(result.dayStar).toBeGreaterThanOrEqual(1);
    expect(result.dayStar).toBeLessThanOrEqual(9);
  });

  it('computes Celtic tree for Dec 25', () => {
    const result = celtic.getCelticTree(new Date('2024-12-25'));
    expect(result.tree).toContain('Birch');
    expect(result.ogham).toBe('Beith');
  });
});

describe('Global psychology domains', () => {
  it('interprets Big Five scores', () => {
    const result = bigfive.interpretBigFive({
      openness: 4,
      conscientiousness: 5,
      extraversion: 2,
      agreeableness: 3,
      neuroticism: 4,
    });
    expect(result.openness).toBe(4);
    expect(result.conscientiousness).toBe(5);
    expect(bigfive.getBigFiveInsight(result, 'conscientiousness')).toContain('성실성이 높음');
  });

  it('clamps Big Five scores to 1..5', () => {
    const result = bigfive.interpretBigFive({ openness: 10, neuroticism: -2 });
    expect(result.openness).toBe(5);
    expect(result.neuroticism).toBe(1);
  });

  it('maps attachment axes to secure style', () => {
    const result = attachment.getAttachmentStyle(2, 2);
    expect(result.style).toBe('secure');
    expect(result.anxietyScore).toBe(2);
    expect(result.avoidanceScore).toBe(2);
  });

  it('maps high anxiety + high avoidance to disorganized', () => {
    const result = attachment.getAttachmentStyle(5, 5);
    expect(result.style).toBe('disorganized');
  });

  it('computes Enneagram type and wing', () => {
    const result = enneagram.getEnneagramResult(5, { wingScores: { 4: 4, 6: 2 } });
    expect(result.type).toBe(5);
    expect(result.wing).toBe(4);
  });
});
