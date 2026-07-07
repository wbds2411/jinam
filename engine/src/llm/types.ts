/**
 * LLMProvider 추상화 인터페이스
 * architecture.md 6장 기준
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  privacyMode?: boolean;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd?: number;
}

export interface LLMResponse {
  text: string;
  usage: LLMUsage;
  provider: string;
  model: string;
  routedLocally: boolean;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsPrivacyMode: boolean;

  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  getCostEstimate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMUsage>;
}
