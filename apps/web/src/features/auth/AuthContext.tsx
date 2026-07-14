import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserDTO, AuthResponseDTO } from '@vestara/types';
import { apiClient } from '../../api/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserDTO) => void;
  deleteAccount: () => void;
  oauthRedirect: (provider: 'google' | 'github') => void;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setUser = useCallback((user: UserDTO | null) => {
    setState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    let cancelled = false;

    apiClient
      .get<{ user: UserDTO }>('/auth/me')
      .then((res) => {
        if (!cancelled) {
          if (res.data?.user) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthResponseDTO>('/auth/login', { email, password });
    if (res.data) {
      localStorage.setItem('accessToken', res.data.tokens.accessToken);
      localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
      setUser(res.data.user);
    }
  }, [setUser]);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await apiClient.post<AuthResponseDTO>('/auth/register', data);
    if (res.data) {
      localStorage.setItem('accessToken', res.data.tokens.accessToken);
      localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
      setUser(res.data.user);
    }
  }, [setUser]);

  const updateUser = useCallback((updatedUser: UserDTO) => {
    setState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  }, []);

  const logout = useCallback(async () => {
    const userId = state.user?.id;
    try {
      if (userId) {
        await apiClient.post('/auth/logout', { userId });
      }
    } catch {
      // Clear local state even if API call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, [state.user?.id, setUser]);

  const deleteAccount = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, [setUser]);

  /**
   * Redirect the browser to the backend OAuth authorization endpoint.
   * The backend will redirect to the provider's consent screen.
   */
  const oauthRedirect = useCallback((provider: 'google' | 'github') => {
    // Strip trailing /api/v1 if VITE_API_URL already includes it,
    // then re-add /api/v1 so both localhost and production work.
    const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    window.location.href = `${baseUrl}/api/v1/auth/oauth/${provider}`;
  }, []);

  /**
   * Handle the OAuth callback by storing tokens and fetching the current user.
   * Called from the /auth/callback page after the backend redirects back.
   */
  const handleOAuthCallback = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Fetch the current user with the new token
    const res = await apiClient.get<{ user: UserDTO }>('/auth/me');
    if (res.data?.user) {
      setUser(res.data.user);
    } else {
      // Token was invalid — clean up
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw new Error('Failed to authenticate with OAuth provider');
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, deleteAccount, oauthRedirect, handleOAuthCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
