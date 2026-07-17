import type { AIProvider, AICompletionRequest, AICompletionResponse } from './types.js';

/**
 * Local type for the global `fetch` Response. The API tsconfig does not expose
 * Node's global `fetch`/Response types, so `fetch` resolves to an empty `{}`.
 * Casting to this interface restores `.ok`/`.status`/`.text()`/`.json()`.
 */
interface AIHttpResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

/**
 * Anthropic Claude API Provider
 *
 * Supports Claude Sonnet, Claude Haiku, and other Anthropic models.
 * Requires ANTHROPIC_API_KEY environment variable.
 *
 * @see https://docs.anthropic.com/claude/reference
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly models = ['claude-sonnet-4-20250514', 'claude-haiku-3.5'];

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.',
      );
    }

    // Anthropic requires system prompt as a separate parameter
    const systemPrompt =
      request.systemPrompt ?? 'You are a helpful AI assistant for the Vestara Admin Dashboard.';

    // Convert messages to Anthropic format (exclude system messages)
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = (await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model ?? 'claude-sonnet-4-20250514',
        max_tokens: request.maxTokens ?? 2048,
        system: systemPrompt,
        messages,
      }),
    })) as AIHttpResponse;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: {
        input_tokens: number;
        output_tokens: number;
      };
      model: string;
    };

    const textBlock = data.content.find((c) => c.type === 'text');
    if (!textBlock) {
      throw new Error('No text content in Anthropic response');
    }

    return {
      content: textBlock.text,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }
}
