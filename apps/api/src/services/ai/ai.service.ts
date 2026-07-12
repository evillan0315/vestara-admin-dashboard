import type { AIProvider, AICompletionRequest, AICompletionResponse } from './types.js';
import { MockAIProvider } from './mock.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { OpenCodeProvider } from './opencode.provider.js';

/**
 * AI Service
 *
 * Manages AI providers and routes completion requests.
 * Falls back to the mock provider if no API keys are configured.
 *
 * Provider priority:
 * 1. OpenCode (if OPENCODE_API_KEY is set)
 * 2. OpenAI (if OPENAI_API_KEY is set)
 * 3. Anthropic (if ANTHROPIC_API_KEY is set)
 * 4. Mock (always available as fallback)
 */
export class AIService {
  private readonly providers = new Map<string, AIProvider>();
  private readonly mockProvider: MockAIProvider;

  constructor() {
    // Initialize providers
    this.mockProvider = new MockAIProvider();
    const openCodeProvider = new OpenCodeProvider();
    const openaiProvider = new OpenAIProvider();
    const anthropicProvider = new AnthropicProvider();

    this.providers.set('mock', this.mockProvider);
    if (openCodeProvider.isAvailable()) {
      this.providers.set('opencode', openCodeProvider);
    }
    if (openaiProvider.isAvailable()) {
      this.providers.set('openai', openaiProvider);
    }
    if (anthropicProvider.isAvailable()) {
      this.providers.set('anthropic', anthropicProvider);
    }
  }

  /**
   * Get the provider for a given model.
   */
  private getProviderForModel(model: string): AIProvider {
    // Map model IDs to provider names
    const modelProviderMap: Record<string, string> = {
      'mimo-v2.5-free': 'opencode',
      'deepseek-v4-flash-free': 'opencode',
      'nemotron-3-ultra-free': 'opencode',
      'north-mini-code-free': 'opencode',
      'gpt-4': 'openai',
      'gpt-4o': 'openai',
      'gpt-4o-mini': 'openai',
      'claude-sonnet-4-20250514': 'anthropic',
      'claude-haiku-3.5': 'anthropic',
      'mock': 'mock',
    };

    const providerName = modelProviderMap[model] ?? 'opencode';
    const provider = this.providers.get(providerName);

    if (!provider) {
      // Fall back to mock if requested provider isn't configured
      return this.mockProvider;
    }

    return provider;
  }

  /**
   * Generate a completion using the appropriate provider.
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const model = request.model ?? 'mimo-v2.5-free';
    const provider = this.getProviderForModel(model);

    // If the resolved provider isn't available, fall back to mock
    if (!provider.isAvailable()) {
      return this.mockProvider.complete({
        ...request,
        model: 'mock',
      });
    }

    return provider.complete(request);
  }

  /**
   * Get list of available providers.
   */
  getAvailableProviders(): Array<{ name: string; models: string[] }> {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      models: p.models,
    }));
  }

  /**
   * Check if a specific model is available.
   */
  isModelAvailable(model: string): boolean {
    const provider = this.getProviderForModel(model);
    return provider.isAvailable();
  }
}

// Singleton instance
export const aiService = new AIService();
