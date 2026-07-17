/**
 * AI Provider Interface
 *
 * Abstract interface for AI completion providers.
 * Implement this interface to add support for new AI providers.
 *
 * Built-in providers:
 * - MockAIProvider: Smart mock for development/testing
 * - OpenCodeProvider: OpenCode API via OpenAI-compatible endpoint (requires OPENCODE_API_KEY)
 * - OpenAIProvider: OpenAI GPT models (requires OPENAI_API_KEY)
 * - AnthropicProvider: Anthropic Claude models (requires ANTHROPIC_API_KEY)
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  isAvailable(): boolean;
}

/**
 * Available AI models across all providers.
 */
export const AI_MODELS = [
  {
    id: 'mimo-v2.5-free',
    name: 'MiMo V2.5',
    description: 'OpenCode free model — reasoning, text, and image support',
    maxTokens: 8192,
    provider: 'opencode',
  },
  {
    id: 'deepseek-v4-flash-free',
    name: 'DeepSeek V4 Flash',
    description: 'OpenCode free model — fast coding and general tasks',
    maxTokens: 8192,
    provider: 'opencode',
  },
  {
    id: 'nemotron-3-ultra-free',
    name: 'Nemotron 3 Ultra',
    description: 'OpenCode free model — NVIDIA 1M context',
    maxTokens: 8192,
    provider: 'opencode',
  },
  {
    id: 'north-mini-code-free',
    name: 'North Mini Code',
    description: 'OpenCode free model — compact coding specialist',
    maxTokens: 8192,
    provider: 'opencode',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable OpenAI model for complex tasks',
    maxTokens: 8192,
    provider: 'openai',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and cost-effective for simpler tasks',
    maxTokens: 16384,
    provider: 'openai',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet',
    description: 'Balanced performance and speed by Anthropic',
    maxTokens: 8192,
    provider: 'anthropic',
  },
  {
    id: 'claude-haiku-3.5',
    name: 'Claude Haiku',
    description: 'Fastest Claude model for quick responses',
    maxTokens: 8192,
    provider: 'anthropic',
  },
  {
    id: 'mock',
    name: 'Demo Assistant',
    description: 'Built-in demo mode — no API key required',
    maxTokens: 4096,
    provider: 'mock',
  },
] as const;

/**
 * Get available models based on configured API keys.
 */
export function getAvailableModels(): (typeof AI_MODELS)[number][] {
  const hasOpenCode = !!process.env.OPENCODE_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // Always include mock as fallback
  return AI_MODELS.filter((m) => {
    if (m.provider === 'mock') return true;
    if (m.provider === 'opencode') return hasOpenCode;
    if (m.provider === 'openai') return hasOpenAI;
    if (m.provider === 'anthropic') return hasAnthropic;
    return false;
  });
}
