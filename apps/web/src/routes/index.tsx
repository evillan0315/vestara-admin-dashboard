import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicRoute } from '../components/PublicRoute';
import { PageLoading } from '../components/feedback/Loading';

/**
 * Lazily load a page module and resolve either its named export (`name`) or
 * its default export, so both export styles work uniformly.
 */
const lazyPage = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(() =>
    loader().then((mod) => ({
      default: (mod[name] as React.ComponentType) ?? (mod.default as React.ComponentType),
    })),
  );

const DashboardPage = lazyPage(() => import('../pages/DashboardPage'), 'DashboardPage');
const AnalyticsPage = lazyPage(() => import('../pages/AnalyticsPage'), 'AnalyticsPage');
const UsersPage = lazyPage(() => import('../pages/UsersPage'), 'UsersPage');
const SettingsPage = lazyPage(() => import('../pages/SettingsPage'), 'SettingsPage');
const SystemLogsPage = lazyPage(() => import('../pages/SystemLogsPage'), 'SystemLogsPage');
const OrganizationsPage = lazyPage(() => import('../pages/OrganizationsPage'), 'OrganizationsPage');
const FileManagerPage = lazyPage(() => import('../pages/FileManagerPage'), 'FileManagerPage');
const ChatPage = lazyPage(() => import('../pages/ChatPage'), 'ChatPage');
const ReportsPage = lazyPage(() => import('../pages/ReportsPage'), 'ReportsPage');
const IntegrationsPage = lazyPage(() => import('../pages/IntegrationsPage'), 'IntegrationsPage');
const DataExplorerPage = lazyPage(() => import('../pages/DataExplorerPage'), 'DataExplorerPage');
const DocsPage = lazyPage(() => import('../pages/DocsPage'), 'DocsPage');
const ProfilePage = lazyPage(() => import('../pages/ProfilePage'), 'ProfilePage');
const AdminPage = lazyPage(() => import('../pages/AdminPage'), 'AdminPage');
const MonitoringPage = lazyPage(() => import('../pages/MonitoringPage'), 'MonitoringPage');
const LoginPage = lazyPage(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyPage(
  () => import('../pages/ForgotPasswordPage'),
  'ForgotPasswordPage',
);
const ResetPasswordPage = lazyPage(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage');
const OAuthCallbackPage = lazyPage(() => import('../pages/OAuthCallbackPage'), 'OAuthCallbackPage');

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* OAuth callback — no layout, standalone page */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Public routes — redirect to dashboard if already authenticated */}
        <Route element={<PublicRoute />}>
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            }
          />
        </Route>

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/files" element={<FileManagerPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/system-logs" element={<SystemLogsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/integrations/:id" element={<DataExplorerPage />} />
            <Route path="/data-explorer" element={<IntegrationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/personal" element={<ProfilePage />} />
            <Route path="/profile/address" element={<ProfilePage />} />
            <Route path="/profile/privacy" element={<ProfilePage />} />
            <Route path="/profile/identity" element={<ProfilePage />} />
            <Route path="/security" element={<ProfilePage />} />
            <Route path="/permissions" element={<ProfilePage />} />
            <Route path="/activity" element={<ProfilePage />} />
            <Route path="/preferences" element={<ProfilePage />} />
            <Route path="/sessions" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
