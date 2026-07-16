import { type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../features/auth/AuthContext';
import { ToastProvider } from '../components/feedback/Toast';
import { WebSocketProvider } from '../websocket/WebSocketProvider';
import { LiveNotificationsProvider } from '../features/realtime/LiveNotificationsProvider';
import { DateRangeProvider } from '../features/calendar';

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
                <WebSocketProvider>
                  <LiveNotificationsProvider>
                    <DateRangeProvider>{children}</DateRangeProvider>
                  </LiveNotificationsProvider>
                </WebSocketProvider>
              </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
