import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeSaju } from '../saju/engine.js';

type Fixture = {
  id: string;
  source: string;
  independentExternalVerified: boolean;
  verifiedAt: string;
  input: { date: string; time: string; gender: 'male' | 'female'; longitude: number };
  expected: Record<'year' | 'month' | 'day' | 'hour' | 'trueSolarTime', string>;
};

const dataset = JSON.parse(readFileSync(new URL('./fixtures/saju-regression.json', import.meta.url), 'utf8')) as {
  schemaVersion: number;
  policy: Record<string, string>;
  cases: Fixture[];
};

const pillar = (value: { stem: string; branch: string } | undefined) => value ? `${value.stem}${value.branch}` : '';

describe('versioned saju regression dataset', () => {
  it('records source and independent verification status for every case', () => {
    expect(dataset.schemaVersion).toBe(1);
    expect(dataset.cases.length).toBeGreaterThanOrEqual(4);
    dataset.cases.forEach(testCase => {
      expect(testCase.source).not.toBe('');
      expect(testCase.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof testCase.independentExternalVerified).toBe('boolean');
    });
  });

  for (const testCase of dataset.cases) {
    it(testCase.id, () => {
      const [hour, minute] = testCase.input.time.split(':').map(Number);
      const chart = computeSaju({
        solarDate: new Date(`${testCase.input.date}T12:00:00`),
        birthTime: { hour, minute },
        gender: testCase.input.gender,
        location: { lat: 0, lng: testCase.input.longitude, name: 'fixture' },
        timeZoneOffsetMinutes: 540,
        useTrueSolarTime: true,
        trueSolarDateBoundary: 'civil',
      });
      expect(pillar(chart.year)).toBe(testCase.expected.year);
      expect(pillar(chart.month)).toBe(testCase.expected.month);
      expect(pillar(chart.day)).toBe(testCase.expected.day);
      expect(pillar(chart.hour)).toBe(testCase.expected.hour);
      expect(chart.raw.trueSolarTime).toBe(testCase.expected.trueSolarTime);
    });
  }
});
