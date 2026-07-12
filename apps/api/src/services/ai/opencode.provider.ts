import type { AIProvider, AICompletionRequest, AICompletionResponse } from './types.js';

/**
 * OpenCode API Provider
 *
 * Uses OpenCode's OpenAI-compatible chat completions endpoint.
 * Requires OPENCODE_API_KEY environment variable.
 * Base URL defaults to https://opencode.ai/zen/go/v1 and can be overridden
 * with OPENCODE_BASE_URL.
 *
 * @see https://opencode.ai
 */
export class OpenCodeProvider implements AIProvider {
  readonly name = 'opencode';
  readonly models = ['mimo-v2.5-free', 'deepseek-v4-flash-free', 'nemotron-3-ultra-free', 'north-mini-code-free'];

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENCODE_API_KEY ?? '';
    this.baseUrl = process.env.OPENCODE_BASE_URL ?? 'https://opencode.ai/zen/go/v1';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenCode API key not configured. Set OPENCODE_API_KEY environment variable.');
    }

    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    // Add conversation messages
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? 'mimo-v2.5-free',
        messages,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenCode API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      model: string;
    };

    const choice = data.choices[0];
    if (!choice) {
      throw new Error('No response from OpenCode API');
    }

    return {
      content: choice.message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }
}
