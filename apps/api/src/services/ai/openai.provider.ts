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
 * OpenAI API Provider
 *
 * Supports GPT-4, GPT-4o, GPT-4o-mini, and other OpenAI models.
 * Requires OPENAI_API_KEY environment variable.
 *
 * @see https://platform.openai.com/docs/api-reference
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly models = ['gpt-4', 'gpt-4o', 'gpt-4o-mini'];

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
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

    const response = (await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? 'gpt-4',
        messages,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      }),
    })) as AIHttpResponse;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
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
      throw new Error('No response from OpenAI API');
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
