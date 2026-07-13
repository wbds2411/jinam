/**
 * 심리 평가 기록 → 조언 모드 도출 (technical-application-guide.md 3.4/9.1)
 * 최근 14일 내 기록만 유효한 것으로 본다.
 */
import type { AdviceMode } from '@jinam/engine';
import type { AssessmentRecord, CheckIn } from '../stores/userStore.js';

const VALID_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function latest(records: AssessmentRecord[], id: AssessmentRecord['id']): AssessmentRecord | undefined {
  const now = Date.now();
  return [...records]
    .reverse()
    .find(r => r.id === id && now - r.takenAt < VALID_WINDOW_MS);
}

/** 저장된 평가 기록에서 현재 조언 모드를 도출한다. 기록이 없으면 undefined. */
export function deriveModeFromRecords(records: AssessmentRecord[]): AdviceMode | undefined {
  const phq9 = latest(records, 'phq9');
  const gad7 = latest(records, 'gad7');
  const who5 = latest(records, 'who5');
  const dcs = latest(records, 'dcs');
  if (!phq9 && !gad7 && !who5 && !dcs) return undefined;

  if (phq9 && (phq9.suicidalityFlag || phq9.total >= 15)) return 'crisis';
  if (gad7 && gad7.total >= 10) return 'panic';
  if (who5 && who5.total <= 50) return 'withdrawn';
  if (dcs && dcs.total >= 25) return 'indecisive';
  return 'reinforce';
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodayCheckIn(checkIns: CheckIn[]): CheckIn | undefined {
  return checkIns.find(c => c.date === todayString());
}
