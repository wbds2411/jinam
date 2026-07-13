import type { LLMProvider } from '../llm/types.js';
import type { SajuChart } from '../types.js';

export type AdviceMode = 'panic' | 'withdrawn' | 'indecisive' | 'reinforce' | 'crisis';

export type CrisisType = 'self-harm' | 'harm-others' | 'suicide';

export interface CrisisDetectionResult {
  crisis: boolean;
  type?: CrisisType;
  hotline: string;
  message: string;
}

export interface UserContext {
  nickname: string;
  profileSummary: string;
  saju?: SajuChart;
  activeTools: string[];
  toolWeights: Record<string, number>;
  privacyMode: boolean;
  crisisRegion?: string;
}

export interface CounselorInput {
  userMessage: string;
  context: UserContext;
  llm: LLMProvider;
  history?: { role: 'user' | 'assistant'; content: string }[];
  /** 심리 평가(DCS/WHO-5/GAD-7/PHQ-9/수면)에서 도출된 모드. 키워드 분류보다 우선한다. */
  assessmentMode?: AdviceMode;
}

export interface CounselorOutput {
  text: string;
  mode: AdviceMode;
  crisis?: CrisisDetectionResult;
  safetyFiltered: boolean;
  oneStep: string;
}

export interface Hotline {
  country: string;
  name: string;
  number: string;
}
