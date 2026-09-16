import type { VedicSign } from '../types.js';

// Vedic (sidereal) zodiac signs with Sanskrit rashi names.
const SIGNS = [
  { en: 'Aries', sa: 'Meṣa', nakshatra: 'Aśvinī' },
  { en: 'Taurus', sa: 'Vṛṣabha', nakshatra: 'Kṛttikā' },
  { en: 'Gemini', sa: 'Mithuna', nakshatra: 'Mṛgaśīrṣa' },
  { en: 'Cancer', sa: 'Karkaṭa', nakshatra: 'Punarvasu' },
  { en: 'Leo', sa: 'Siṃha', nakshatra: 'Maghā' },
  { en: 'Virgo', sa: 'Kanyā', nakshatra: 'Uttara Phālgunī' },
  { en: 'Libra', sa: 'Tulā', nakshatra: 'Chitrā' },
  { en: 'Scorpio', sa: 'Vṛścika', nakshatra: 'Anurādhā' },
  { en: 'Sagittarius', sa: 'Dhanuṣa', nakshatra: 'Mūla' },
  { en: 'Capricorn', sa: 'Makara', nakshatra: 'Uttara Aṣāḍhā' },
  { en: 'Aquarius', sa: 'Kumbha', nakshatra: 'Śatabhiṣā' },
  { en: 'Pisces', sa: 'Mīna', nakshatra: 'Pūrva Bhādrapadā' },
];

// Tropical zodiac approximations (month/day start boundaries, 2000 epoch).
const TROPICAL_START: Record<number, { month: number; day: number }> = {
  0: { month: 3, day: 21 }, // Aries
  1: { month: 4, day: 20 }, // Taurus
  2: { month: 5, day: 21 }, // Gemini
  3: { month: 6, day: 21 }, // Cancer
  4: { month: 7, day: 23 }, // Leo
  5: { month: 8, day: 23 }, // Virgo
  6: { month: 9, day: 23 }, // Libra
  7: { month: 10, day: 23 }, // Scorpio
  8: { month: 11, day: 22 }, // Sagittarius
  9: { month: 12, day: 22 }, // Capricorn
  10: { month: 1, day: 20 }, // Aquarius
  11: { month: 2, day: 19 }, // Pisces
};

/**
 * Approximate Lahiri ayanamsa using a linear fit around J2000.
 * Real ayanamsa changes non-linearly by a few arcseconds per year; this is
 * sufficient for sun-sign classification in a self-care/symbolic app.
 * Reference: Lahiri ayanamsa ~23.86° at 2000-01-01, increasing ~50.3"/year.
 */
function approximateAyanamsa(date: Date): number {
  const j2000 = new Date('2000-01-01T12:00:00Z');
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const years = (date.getTime() - j2000.getTime()) / msPerYear;
  return 23.86 + years * (50.3 / 3600);
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function tropicalLongitudeDeg(date: Date): number {
  // Approximate solar longitude using a simple day-of-year mapping.
  // March equinox ≈ day 79, longitude 0°. 365.2422 days = 360°.
  const doy = dayOfYear(date);
  return ((doy - 79 + 365.2422) % 365.2422) * (360 / 365.2422);
}

function getTropicalSignIndex(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const key = month * 100 + day;

  for (let i = 0; i < 12; i++) {
    const start = TROPICAL_START[i];
    const nextIndex = (i + 1) % 12;
    const end = TROPICAL_START[nextIndex];
    const startKey = start.month * 100 + start.day;
    const endKey = end.month * 100 + end.day;

    if (startKey > endKey) {
      // Year boundary signs (Capricorn -> Pisces, Aquarius -> Aries)
      if (key >= startKey || key < endKey) return i;
    } else {
      if (key >= startKey && key < endKey) return i;
    }
  }
  return 11; // Pisces fallback
}

/**
 * Compute sidereal (Vedic) sun sign using Lahiri ayanamsa approximation.
 * Returns the rashi, dominant nakshatra, and ayanamsa value.
 */
export function getVedicSign(date: Date): VedicSign {
  const tropicalIndex = getTropicalSignIndex(date);
  const ayanamsa = approximateAyanamsa(date);
  // Each sign is 30°. Shift tropical index backward by ayanamsa in signs.
  const shift = Math.floor(ayanamsa / 30);
  const siderealIndex = (tropicalIndex - shift + 12) % 12;
  const info = SIGNS[siderealIndex];

  return {
    sign: info.en,
    rashi: info.sa,
    nakshatra: info.nakshatra,
    ayanamsaDeg: Math.round(ayanamsa * 100) / 100,
    note: 'Lahiri ayanamsa approximation; for symbolic/self-reflection use.',
  };
}

/**
 * More accurate solar longitude based Vedic sign (optional fallback).
 */
export function getVedicSignFromLongitude(date: Date): VedicSign {
  const tropicalLon = tropicalLongitudeDeg(date);
  const ayanamsa = approximateAyanamsa(date);
  const siderealLon = (tropicalLon - ayanamsa + 360) % 360;
  const siderealIndex = Math.floor(siderealLon / 30) % 12;
  const info = SIGNS[siderealIndex];

  return {
    sign: info.en,
    rashi: info.sa,
    nakshatra: info.nakshatra,
    ayanamsaDeg: Math.round(ayanamsa * 100) / 100,
    note: 'Computed from approximate tropical solar longitude minus Lahiri ayanamsa.',
  };
}
