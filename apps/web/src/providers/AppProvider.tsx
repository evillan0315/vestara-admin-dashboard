import { type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../features/auth/AuthContext';
import { ToastProvider } from '../components/feedback/Toast';
import { WebSocketProvider } from '../websocket/WebSocketProvider';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <WebSocketProvider>{children}</WebSocketProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
