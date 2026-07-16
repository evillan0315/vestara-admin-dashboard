/**
 * Capture screenshots of the localhost Vestara admin dashboard.
 *
 * Usage:
 *   pnpm screenshot              # capture dark + light themes for every route
 *   pnpm screenshot:dev          # capture only the dark theme (faster preview)
 *
 * The tool logs into the real API to obtain a JWT, seeds it into localStorage
 * (the same storage keys the web app reads), and then navigates each route with
 * a real browser. This guarantees the captured pages reflect authenticated,
 * data-driven UI rather than redirected login screens.
 *
 * A Chromium executable is located automatically (system install, Playwright
 * cache, or an explicit VESTARA_SCREENSHOT_CHROME path). No headless browser
 * download is performed unless one cannot be found.
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTH_KEYS,
  loadConfig,
  THEME_STORAGE_KEY,
  type CaptureTarget,
  type ScreenshotConfig,
} from './config.js';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

/** Obtain a JWT session by calling the real auth endpoint. */
async function login(config: ScreenshotConfig): Promise<LoginResult> {
  const res = await fetch(`${config.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Login failed (${res.status}) for ${config.email}. ` +
        `Is the API running at ${config.apiUrl}? ${body}`,
    );
  }

  const json = (await res.json()) as {
    success: boolean;
    data?: { tokens?: LoginResult };
  };

  const tokens = json.data?.tokens;
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error('Login response did not contain tokens.');
  }
  return tokens;
}

/** Find a usable Chromium executable without forcing a download. */
async function resolveChromium(config: ScreenshotConfig): Promise<string | undefined> {
  if (config.chromeExecutable && existsSync(config.chromeExecutable)) {
    return config.chromeExecutable;
  }
  // Common system locations (Linux snaps, Debian/Ubuntu, macOS, Windows).
  const candidates = [
    '/snap/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Fall back to Playwright's bundled browser if it is already installed.
  try {
    const executablePath = chromium.executablePath();
    if (executablePath && existsSync(executablePath)) return executablePath;
  } catch {
    /* Playwright browser not installed — handled by caller. */
  }
  return undefined;
}

async function captureRoute(
  context: BrowserContext,
  config: ScreenshotConfig,
  target: CaptureTarget,
  theme: 'dark' | 'light',
): Promise<string> {
  const page = await context.newPage();
  try {
    await page.goto(`${config.baseUrl}${target.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    if (target.waitForSelector) {
      await page
        .waitForSelector(target.waitForSelector, { timeout: 30_000 })
        .catch(() => {
          // If the selector never appears (e.g. slow data fetch), still capture.
          console.warn(
            `  ⚠ "${target.waitForSelector}" not found on ${target.path} (${theme})`,
          );
        });
    }

    if (target.settleMs) {
      await page.waitForTimeout(target.settleMs);
    }

    const fileName = `${target.name}-${theme}.png`;
    const outPath = join(config.outDir, fileName);
    await page.screenshot({
      path: outPath,
      fullPage: config.fullPage,
    });
    return outPath;
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  if (!existsSync(config.outDir)) mkdirSync(config.outDir, { recursive: true });

  console.log(`🔐 Logging in as ${config.email}…`);
  const tokens = await login(config);

  const executablePath = await resolveChromium(config);
  console.log(
    executablePath
      ? `🌐 Using Chromium at ${executablePath}`
      : '🌐 Using Playwright-managed Chromium',
  );

  const launchOptions = executablePath
    ? { executablePath, headless: true }
    : { headless: true };

  const browser: Browser = await chromium.launch(launchOptions);

  const captured: string[] = [];
  try {
    for (const theme of config.themes) {
      // One context per theme: seeds the theme preference + auth tokens in
      // localStorage before any app script runs on the page.
      const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: 2,
      });

      await context.addInitScript(
        ({ theme, tokens, themeKey, authKeys }) => {
          localStorage.setItem(themeKey, JSON.stringify({ mode: theme }));
          localStorage.setItem(authKeys.accessToken, tokens.accessToken);
          localStorage.setItem(authKeys.refreshToken, tokens.refreshToken);
        },
        {
          theme,
          tokens,
          themeKey: THEME_STORAGE_KEY,
          authKeys: AUTH_KEYS,
        },
      );

      console.log(`\n🎨 Theme: ${theme}`);
      for (const target of config.targets) {
        const outPath = await captureRoute(context, config, target, theme);
        console.log(`  ✓ ${target.path} → ${outPath}`);
        captured.push(outPath);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n✅ Captured ${captured.length} screenshot(s) to ${config.outDir}`);
}

main().catch((error) => {
  console.error('\n❌ Screenshot capture failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
