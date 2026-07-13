/**
 * LLMProvider 구현체 (architecture.md 6장)
 * - OllamaProvider: 로컬, 프라이버시 모드 지원
 * - OpenAIProvider / AnthropicProvider: 사용자 키(BYOK)
 * - RuleBasedProvider: 네트워크/모델 없이 동작하는 오프라인 폴백
 * fetch 기반 — 브라우저·Node 18+ 공용.
 */
import type { LLMMessage, LLMOptions, LLMProvider, LLMResponse, LLMUsage } from './types.js';

function approxTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

function estimateUsage(messages: LLMMessage[]): LLMUsage {
  const promptTokens = messages.reduce((acc, m) => acc + approxTokens(m.content), 0);
  return { promptTokens, completionTokens: 0 };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Ollama (로컬)
// ---------------------------------------------------------------------------

export interface OllamaConfig {
  baseUrl?: string; // 기본 http://localhost:11434
  model?: string;   // 기본 qwen2.5:3b-instruct
}

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (로컬)';
  readonly supportsPrivacyMode = true;
  private baseUrl: string;
  private model: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = (config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = config.model ?? 'qwen2.5:3b-instruct';
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const res = await fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 600,
          },
        }),
      },
      options.timeoutMs ?? 60_000
    );
    if (!res.ok) throw new Error(`Ollama 오류 (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as any;
    return {
      text: data.message?.content ?? '',
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        estimatedCostUsd: 0,
      },
      provider: this.id,
      model: this.model,
      routedLocally: true,
    };
  }

  async getCostEstimate(messages: LLMMessage[]): Promise<LLMUsage> {
    return { ...estimateUsage(messages), estimatedCostUsd: 0 };
  }

  /** 로컬 Ollama 서버 접속 가능 여부 */
  async isAvailable(timeoutMs = 3000): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' }, timeoutMs);
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI (사용자 키)
// ---------------------------------------------------------------------------

export interface OpenAIConfig {
  apiKey: string;
  model?: string;   // 기본 gpt-4o-mini
  baseUrl?: string; // 기본 https://api.openai.com/v1
}

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai-user';
  readonly name = 'OpenAI (사용자 키)';
  readonly supportsPrivacyMode = false;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gpt-4o-mini';
    this.baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const res = await fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 600,
        }),
      },
      options.timeoutMs ?? 60_000
    );
    if (!res.ok) throw new Error(`OpenAI 오류 (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as any;
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
      provider: this.id,
      model: this.model,
      routedLocally: false,
    };
  }

  async getCostEstimate(messages: LLMMessage[]): Promise<LLMUsage> {
    const usage = estimateUsage(messages);
    return { ...usage, estimatedCostUsd: (usage.promptTokens / 1_000_000) * 0.15 };
  }
}

// ---------------------------------------------------------------------------
// Anthropic (사용자 키)
// ---------------------------------------------------------------------------

export interface AnthropicConfig {
  apiKey: string;
  model?: string;   // 기본 claude-3-5-haiku-latest
  baseUrl?: string; // 기본 https://api.anthropic.com
}

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic-user';
  readonly name = 'Claude (사용자 키)';
  readonly supportsPrivacyMode = false;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AnthropicConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-3-5-haiku-latest';
    this.baseUrl = (config.baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '');
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const rest = messages.filter(m => m.role !== 'system');
    const res = await fetchWithTimeout(
      `${this.baseUrl}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          system: system || undefined,
          messages: rest,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 600,
        }),
      },
      options.timeoutMs ?? 60_000
    );
    if (!res.ok) throw new Error(`Anthropic 오류 (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as any;
    return {
      text: data.content?.[0]?.text ?? '',
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
      },
      provider: this.id,
      model: this.model,
      routedLocally: false,
    };
  }

  async getCostEstimate(messages: LLMMessage[]): Promise<LLMUsage> {
    const usage = estimateUsage(messages);
    return { ...usage, estimatedCostUsd: (usage.promptTokens / 1_000_000) * 0.8 };
  }
}

// ---------------------------------------------------------------------------
// 규칙 기반 오프라인 폴백 (LLM 불가 시에도 앱이 안전하게 동작)
// ---------------------------------------------------------------------------

const FALLBACK_BY_MODE: Record<string, { body: string; oneStep: string }> = {
  panic: {
    body: '지금 몸의 신호가 크게 울리고 있네요. 먼저 4초 들이쉬고 6초 내쉬는 호흡을 세 번만 해보세요. 발바닥이 바닥에 닿는 감각에 잠시 집중해 보세요.',
    oneStep: '지금 이 자리에서 4-6 호흡 세 번만 해보세요.',
  },
  withdrawn: {
    body: '의욕이 없는 게 아니라 출력이 잠시 멈춘 상태예요. 큰 일 말고, 5분짜리 아주 작은 일 하나면 충분해요.',
    oneStep: '물 한 잔 마시고, 창문을 열어 1분만 바깥 공기를 쐬어 보세요.',
  },
  indecisive: {
    body: '고민이 머릿속에서만 돌면 커져요. 선택지를 글자로 고정해 볼까요? 각 선택지를 한 줄씩 적고, 몸이 편해지는 쪽이 어느 쪽인지 느껴보세요.',
    oneStep: '선택지 두 개를 종이에 한 줄씩 적고, 각각 10분 뒤·10개월 뒤·10년 뒤를 상상해 보세요.',
  },
  reinforce: {
    body: '오늘의 흐름을 확인하고 싶으시군요. 도구가 무엇을 말하든, 결국 중요한 건 오늘 내가 놓는 한 걸음이에요.',
    oneStep: '오늘 가장 먼저 할 수 있는 작은 일 하나를 지금 적어보세요.',
  },
};

/**
 * LLM이 전혀 없을 때 사용하는 규칙 기반 폴백.
 * counselor의 시스템 프롬프트에서 모드를 추출하여 모드별 고정 응답을 낸다.
 */
export class RuleBasedProvider implements LLMProvider {
  readonly id = 'rule-based';
  readonly name = '오프라인 기본 응답';
  readonly supportsPrivacyMode = true;

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const modeMatch = userMsg.match(/현재 모드:\s*(\w+)/);
    const mode = modeMatch?.[1] ?? 'reinforce';
    const preset = FALLBACK_BY_MODE[mode] ?? FALLBACK_BY_MODE.reinforce;
    const text = `${preset.body}\n\n오늘의 한 걸음: ${preset.oneStep}\n\n(로컬 LLM이 연결되지 않아 기본 안내를 드렸어요. 설정에서 LLM을 연결하면 더 깊은 대화가 가능해요.)`;
    return {
      text,
      usage: { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0 },
      provider: this.id,
      model: 'rule-based-v1',
      routedLocally: true,
    };
  }

  async getCostEstimate(): Promise<LLMUsage> {
    return { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0 };
  }
}
