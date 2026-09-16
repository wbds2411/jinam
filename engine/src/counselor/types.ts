import type { LLMProvider } from '../llm/types.js';
import type { SajuChart } from '../types.js';

export type AdviceMode = 'panic' | 'withdrawn' | 'indecisive' | 'reinforce';

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
}

export interface CounselorInput {
  userMessage: string;
  context: UserContext;
  llm: LLMProvider;
  history?: { role: 'user' | 'assistant'; content: string }[];
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
