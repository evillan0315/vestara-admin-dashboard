const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
}

type RefreshHandler = () => Promise<TokenRefreshResult | null>;
type UnauthorizedHandler = () => void;

let refreshHandler: RefreshHandler | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshPromise: Promise<TokenRefreshResult | null> | null = null;

/**
 * Register the authentication interceptors used to recover from expired
 * sessions. The `refresh` handler should attempt to obtain a new token pair
 * (returning `null` on failure); `onUnauthorized` is invoked when the session
 * can no longer be recovered and the user must be sent back to login.
 */
export function setAuthInterceptors(handlers: {
  refresh: RefreshHandler;
  onUnauthorized: UnauthorizedHandler;
}): void {
  refreshHandler = handlers.refresh;
  unauthorizedHandler = handlers.onUnauthorized;
}

function buildHeaders(options: RequestInit): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = localStorage.getItem('accessToken');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/** Endpoints that must never trigger the refresh/redirect interceptor. */
function shouldAutoRefresh(endpoint: string): boolean {
  return !/^\/auth\/(login|register|refresh)(\/|$)/.test(endpoint);
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isBlob = false,
    attemptedRefresh = false,
  ): Promise<ApiResponse<T> | Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const hadAuth = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');

    const attempt = (): Promise<Response> =>
      fetch(url, { ...options, headers: buildHeaders(options) });

    let response = await attempt();

    if (response.status === 401 && !attemptedRefresh && shouldAutoRefresh(endpoint)) {
      const refreshed = await this.handleUnauthorizedAccess();
      if (refreshed) {
        response = await attempt();
      }
    }

    // If we still have an auth failure after a recovery attempt (or none was
    // possible), the session is genuinely expired — notify the app so it can
    // redirect the user to the login page.
    if (response.status === 401 && hadAuth) {
      unauthorizedHandler?.();
    }

    if (isBlob) {
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.error?.message || 'An unexpected error occurred',
          response.status,
          errorData.error?.code || 'UNKNOWN_ERROR',
          errorData.error?.details,
        );
      }
      return response.blob();
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'An unexpected error occurred',
        response.status,
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.details,
      );
    }

    return data;
  }

  /**
   * Attempt a single-flight token refresh. Returns the new token pair on
   * success, or `null` when no refresh token is available / refresh failed.
   */
  private async handleUnauthorizedAccess(): Promise<TokenRefreshResult | null> {
    if (!refreshHandler) {
      return null;
    }
    if (!localStorage.getItem('refreshToken')) {
      return null;
    }
    try {
      if (!refreshPromise) {
        refreshPromise = refreshHandler().finally(() => {
          refreshPromise = null;
        });
      }
      return await refreshPromise;
    } catch {
      return null;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }) as Promise<ApiResponse<T>>;
  }

  async getBlob(endpoint: string): Promise<Blob> {
    return this.request<never>(endpoint, { method: 'GET' }, true) as Promise<Blob>;
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }) as Promise<ApiResponse<T>>;
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }) as Promise<ApiResponse<T>>;
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }) as Promise<ApiResponse<T>>;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }) as Promise<ApiResponse<T>>;
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
