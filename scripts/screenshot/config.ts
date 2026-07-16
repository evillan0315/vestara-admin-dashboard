/**
 * Screenshot capture configuration for the Vestara admin dashboard.
 *
 * Routes listed here are captured against the running localhost dev server.
 * The auth credentials are read from environment variables (with sensible
 * defaults that match the local seed data) so the tool works out of the box
 * after `pnpm dev:local`.
 *
 * Override any value via environment variables:
 *   VESTARA_SCREENSHOT_BASE_URL   - dev server origin (default http://localhost:5173)
 *   VESTARA_SCREENSHOT_API_URL     - API origin (default http://localhost:5000/api/v1)
 *   VESTARA_SCREENSHOT_EMAIL       - login email (default admin@vestara.com)
 *   VESTARA_SCREENSHOT_PASSWORD    - login password (default Admin123!)
 *   VESTARA_SCREENSHOT_OUT_DIR     - output directory (default <repo>/screens)
 *   VESTARA_SCREENSHOT_CHROME      - path to a Chromium executable (optional)
 */

export interface CaptureTarget {
  /** Route path appended to the base URL, e.g. "/" or "/users". */
  path: string;
  /** File name (without extension) for the generated PNG. */
  name: string;
  /** Wait for this selector to appear before capturing (ensures data loaded). */
  waitForSelector?: string;
  /** Extra time (ms) to wait after the selector appears (charts/animations). */
  settleMs?: number;
}

export interface ScreenshotConfig {
  baseUrl: string;
  apiUrl: string;
  email: string;
  password: string;
  outDir: string;
  chromeExecutable?: string;
  /** Viewport used for every capture. */
  viewport: { width: number; height: number };
  /** Capture the full scrollable page instead of just the viewport. */
  fullPage: boolean;
  /**
   * Themes to capture. "dark" and "light" are applied by seeding the
   * theme preference in localStorage so the app restores it on load.
   */
  themes: Array<'dark' | 'light'>;
  targets: CaptureTarget[];
}

const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value === 'true' || value === '1';

const repoRoot = process.cwd();

export function loadConfig(): ScreenshotConfig {
  return {
    baseUrl: process.env.VESTARA_SCREENSHOT_BASE_URL ?? 'http://localhost:5173',
    apiUrl: process.env.VESTARA_SCREENSHOT_API_URL ?? 'http://localhost:5000/api/v1',
    email: process.env.VESTARA_SCREENSHOT_EMAIL ?? 'admin@vestara.com',
    password: process.env.VESTARA_SCREENSHOT_PASSWORD ?? 'Admin123!',
    outDir: process.env.VESTARA_SCREENSHOT_OUT_DIR ?? `${repoRoot}/screens`,
    chromeExecutable: process.env.VESTARA_SCREENSHOT_CHROME,
    viewport: { width: 1440, height: 900 },
    fullPage: bool(process.env.VESTARA_SCREENSHOT_FULL_PAGE, true),
    themes: (process.env.VESTARA_SCREENSHOT_THEMES?.split(',') as
      | Array<'dark' | 'light'>
      | undefined) ?? ['dark', 'light'],
    targets: [
      { path: '/', name: 'dashboard', waitForSelector: 'main', settleMs: 1500 },
      {
        path: '/analytics',
        name: 'analytics',
        waitForSelector: 'main',
        settleMs: 1500,
      },
      { path: '/users', name: 'users', waitForSelector: 'table', settleMs: 800 },
      { path: '/settings', name: 'settings', waitForSelector: 'table', settleMs: 800 },
      { path: '/files', name: 'files', waitForSelector: 'main', settleMs: 800 },
      {
        path: '/system-logs',
        name: 'system-logs',
        waitForSelector: 'table',
        settleMs: 800,
      },
      { path: '/reports', name: 'reports', waitForSelector: 'table', settleMs: 800 },
      { path: '/profile', name: 'profile', waitForSelector: 'main', settleMs: 800 },
      {
        path: '/integrations',
        name: 'integrations',
        waitForSelector: 'main',
        settleMs: 800,
      },
      {
        path: '/organizations',
        name: 'organizations',
        waitForSelector: 'table',
        settleMs: 800,
      },
    ],
  };
}

/** localStorage key the web app uses to persist the active theme. */
export const THEME_STORAGE_KEY = 'vestara-theme';
/** localStorage keys the web app reads for the auth session. */
export const AUTH_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
};
