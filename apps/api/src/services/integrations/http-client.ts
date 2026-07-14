/**
 * Shared outbound HTTP helper for integrations.
 *
 * Wraps the global `fetch` with a timeout (via AbortController) and normalizes
 * JSON parsing + error handling. Reuses the `AIHttpResponse`-style cast pattern
 * used across the AI providers and OAuth routes (the API tsconfig does not expose
 * Node's global fetch/Response types).
 */

interface HttpJsonResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export interface FetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export async function fetchJson(url: string, options: FetchOptions = {}): Promise<unknown> {
  const { method = 'GET', headers, body, timeoutMs = 15000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = (await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })) as unknown as HttpJsonResponse;

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `External API request failed (${response.status} ${response.statusText}): ${text.slice(0, 500)}`,
      );
    }

    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('External API response is not valid JSON');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`External API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
