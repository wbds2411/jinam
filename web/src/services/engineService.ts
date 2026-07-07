import {
  saju, astro, zodiac, tojeong, toSolar,
  vedic, ninestar, celtic, bigfive, attachment, enneagram,
} from '@jinam/engine';
import type { BirthInput, BigFiveScores } from '@jinam/engine';
import dayjs from 'dayjs';

export function computeSajuFromProfile(profile: {
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  gender: 'male' | 'female' | '';
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
}) {
  if (!profile.birthDate || !profile.gender) return null;

  let solarDate = dayjs(profile.birthDate).toDate();

  // 음력 입력 시 양력으로 변환
  if (profile.calendarType === 'lunar') {
    const parts = profile.birthDate.split('-').map(Number);
    const converted = toSolar(parts[0], parts[1], parts[2], profile.isLeapMonth);
    solarDate = dayjs(`${converted.year}-${String(converted.month).padStart(2, '0')}-${String(converted.day).padStart(2, '0')}`).toDate();
  }

  const birthTimeInput = profile.birthTimeUnknown || !profile.birthTime
    ? 'unknown'
    : {
        hour: Number(profile.birthTime.split(':')[0]),
        minute: Number(profile.birthTime.split(':')[1]),
      };

  const input: BirthInput = {
    solarDate,
    birthTime: birthTimeInput as BirthInput['birthTime'],
    gender: profile.gender as 'male' | 'female',
  };

  return saju.computeSaju(input);
}

export function computeAstro(birthDate: string) {
  return astro.getZodiacSign(dayjs(birthDate).toDate());
}

export function computeZodiac(birthDate: string, standard: 'lichun' | 'lunarNewYear' = 'lichun') {
  return zodiac.getZodiacAnimal(dayjs(birthDate).year(), standard);
}

export function computeTojeong(lunarDate: { year: number; month: number; day: number }, currentYear: number) {
  return tojeong.calculateTojeong(lunarDate.year, lunarDate.month, lunarDate.day, currentYear);
}

// --- Global astrology / symbolism engines ---

export function computeVedic(birthDate: string) {
  return vedic.getVedicSign(dayjs(birthDate).toDate());
}

export function computeNineStarKi(birthDate: string) {
  return ninestar.calculateNineStarKi(dayjs(birthDate).toDate());
}

export function computeCeltic(birthDate: string) {
  return celtic.getCelticTree(dayjs(birthDate).toDate());
}

// --- Global psychology engines ---

export function computeBigFive(scores: Partial<BigFiveScores>) {
  return bigfive.interpretBigFive(scores);
}

export function computeAttachment(anxiety: number, avoidance: number) {
  return attachment.getAttachmentStyle(anxiety, avoidance);
}

export function computeEnneagram(type: number, wingScores?: Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, number>>) {
  return enneagram.getEnneagramResult(type, { wingScores });
}
