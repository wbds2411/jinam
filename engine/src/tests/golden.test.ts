import { describe, it, expect } from 'vitest';
import { computeSaju } from '../saju/engine.js';

describe('골든 케이스: 1980-03-19 01:45 대구 남', () => {
  const input = {
    solarDate: new Date(1980, 2, 19), // 1980-03-19
    birthTime: { hour: 1, minute: 45 } as const,
    gender: 'male' as const,
    location: { lat: 35.8714, lng: 128.6014, name: '대구' },
    timeZoneOffsetMinutes: 540,
    useTrueSolarTime: true,
  };

  it('일간은 辛(辛金)이어야 한다', () => {
    const chart = computeSaju(input);
    expect(chart.dayMaster).toBe('辛');
  });

  it('연주/월주/일주가 예상과 일치해야 한다', () => {
    const chart = computeSaju(input);
    expect(chart.year.stem + chart.year.branch).toBe('庚申');
    expect(chart.month.stem + chart.month.branch).toBe('己卯');
    expect(chart.day.stem + chart.day.branch).toBe('辛卯');
  });

  it('용신은 木(목)이어야 한다', () => {
    const chart = computeSaju(input);
    expect(chart.yongsin).toBe('木');
  });

  it('오행 분포가 골든 케이스와 일치해야 한다', () => {
    const chart = computeSaju(input);
    console.log('오행 분포:', chart.fiveElements);
    expect(chart.fiveElements).toEqual({
      木: 25,
      火: 0,
      土: 37.5,
      金: 37.5,
      水: 0,
    });
  });

  it('대운 정보가 산출되어야 한다', () => {
    const chart = computeSaju(input);
    console.log('대운:', chart.daeun);
    expect(chart.daeun.startAge).toBeGreaterThan(0);
    expect(chart.daeun.startAge).toBeLessThan(10);
    expect(chart.daeun.direction).toBeDefined();
  });

  it('진태양시 보정이 적용되어야 한다', () => {
    const chart = computeSaju(input);
    expect(chart.raw.trueSolarTime).toBeDefined();
    expect(chart.raw.notes.some(n => n.includes('진태양시'))).toBe(true);
  });
});
