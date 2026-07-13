import { describe, it, expect } from 'vitest';
import { computeSaju, getHourPillar, applyTrueSolarTime } from '../saju/engine.js';
import { toLunar } from 'kor-lunar';

describe('시간/지역 경계 테스트', () => {
  it('00:30는 standard 자시(子) 처리', () => {
    const p = getHourPillar('辛', 0, 30, { zishiBoundary: 'standard' });
    expect(p.branch).toBe('子');
  });

  it('01:30는 standard 축시(丑) 처리', () => {
    const p = getHourPillar('辛', 1, 30, { zishiBoundary: 'standard' });
    expect(p.branch).toBe('丑');
  });

  it('early 자시: 23:30~00:30 = 子', () => {
    const p = getHourPillar('辛', 23, 45, { zishiBoundary: 'early' });
    expect(p.branch).toBe('子');
    const p2 = getHourPillar('辛', 0, 15, { zishiBoundary: 'early' });
    expect(p2.branch).toBe('子');
  });

  it('대구 진태양시 경도 보정: 01:45 KST → 약 01:19', () => {
    const t = applyTrueSolarTime(1, 45, 128.6014, 540);
    expect(t.hour).toBe(1);
    expect(t.minute).toBe(19);
    expect(t.adjusted).toBe(true);
  });

  it('서울(약 127도) 진태양시 경도 보정: 01:45 KST → 약 01:13', () => {
    const t = applyTrueSolarTime(1, 45, 127.0, 540);
    expect(t.hour).toBe(1);
    expect(t.minute).toBe(13);
  });

  it('자정 이전으로 넘어가는 보정도 24시간 범위로 정규화한다', () => {
    const t = applyTrueSolarTime(0, 10, 127.0, 540);
    expect(t.hour).toBe(23);
    expect(t.minute).toBe(38);
  });
  it('날짜 경계 정책에 따라 일주 적용 여부를 선택한다', () => {
    const base = {
      solarDate: new Date(2026, 0, 2),
      birthTime: { hour: 0, minute: 10 },
      gender: 'male' as const,
      location: { lat: 37.5665, lng: 126.978, name: '서울' },
      timeZoneOffsetMinutes: 540,
      useTrueSolarTime: true,
    };
    const civil = computeSaju({ ...base, trueSolarDateBoundary: 'civil' });
    const adjusted = computeSaju({ ...base, trueSolarDateBoundary: 'adjusted' });

    expect(civil.raw.trueSolarTime).toBe('23:38');
    expect(civil.raw.notes).toContain('일주는 출생지 민간시 날짜 유지');
    expect(adjusted.raw.notes).toContain('일주에 진태양시 보정 날짜 적용');
    expect(civil.day).not.toEqual(adjusted.day);
  });
});

describe('음력/윤달 테스트', () => {
  it('1980년은 윤달 없이 2월 3일로 변환', () => {
    const lunar = toLunar(1980, 3, 19);
    expect(lunar.year).toBe(1980);
    expect(lunar.month).toBe(2);
    expect(lunar.day).toBe(3);
    expect(lunar.isLeapMonth).toBe(false);
  });

  it('윤달 변환: 2025-07-25', () => {
    const lunar = toLunar(2025, 7, 25);
    expect(lunar.isLeapMonth).toBe(true);
  });
});

describe('절기 경계 테스트', () => {
  it('입춘 직전(2월 3일)과 직후(2월 5일)의 월주가 다르다', () => {
    const before = computeSaju({
      solarDate: new Date(2024, 1, 3),
      birthTime: 'unknown',
      gender: 'male',
    });
    const after = computeSaju({
      solarDate: new Date(2024, 1, 5),
      birthTime: 'unknown',
      gender: 'male',
    });
    expect(before.month.branch).not.toBe(after.month.branch);
  });

  it('입춘 전후 연주가 같다(입춘 세수는 연도에 영향 없음)', () => {
    const before = computeSaju({
      solarDate: new Date(2024, 1, 3),
      birthTime: 'unknown',
      gender: 'male',
    });
    const after = computeSaju({
      solarDate: new Date(2024, 1, 5),
      birthTime: 'unknown',
      gender: 'male',
    });
    expect(before.year.stem + before.year.branch).toBe(after.year.stem + after.year.branch);
  });
});

describe('시각 모름 처리', () => {
  it('birthTime unknown이면 hour가 undefined', () => {
    const chart = computeSaju({
      solarDate: new Date(1980, 2, 19),
      birthTime: 'unknown',
      gender: 'male',
    });
    expect(chart.hour).toBeUndefined();
    expect(chart.raw.notes.some(n => n.includes('시각 모름'))).toBe(true);
  });
});
