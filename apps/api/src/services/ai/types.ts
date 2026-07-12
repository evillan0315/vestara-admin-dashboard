/**
 * AI Provider Interface
 *
 * Abstract interface for AI completion providers.
 * Implement this interface to add support for new AI providers.
 *
 * Built-in providers:
 * - MockAIProvider: Smart mock for development/testing
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
export function getAvailableModels(): typeof AI_MODELS[number][] {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // Always include mock as fallback
  return AI_MODELS.filter((m) => {
    if (m.provider === 'mock') return true;
    if (m.provider === 'openai') return hasOpenAI;
    if (m.provider === 'anthropic') return hasAnthropic;
    return false;
  });
}
