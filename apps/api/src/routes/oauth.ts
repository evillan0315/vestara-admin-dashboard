import { Router } from 'express';
import { config } from '../config/index.js';
import { authService } from '../services/index.js';

const router = Router();

// ── Helpers ────────────────────────────────────────

/** Build the frontend callback URL with tokens */
function frontendCallbackUrl(tokens: { accessToken: string; refreshToken: string }) {
  const base = config.client.url;
  const params = new URLSearchParams({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
  return `${base}/auth/callback?${params.toString()}`;
}

/** Redirect to an error page on the frontend */
function frontendErrorUrl(message: string) {
  const base = config.client.url;
  const params = new URLSearchParams({ error: message });
  return `${base}/auth/callback?${params.toString()}`;
}

// ── Google OAuth ───────────────────────────────────

/**
 * GET /auth/oauth/google
 * Redirects the user to Google's consent screen.
 */
router.get('/oauth/google', (_req, res) => {
  const { clientId, callbackUrl } = config.oauth.google;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      error: { code: 'OAUTH_DISABLED', message: 'Google OAuth is not configured' },
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * GET /auth/oauth/google/callback
 * Handles the redirect from Google after user authorization.
 */
router.get('/oauth/google/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error || !code || typeof code !== 'string') {
      return res.redirect(frontendErrorUrl('Google authorization was denied'));
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        redirect_uri: config.oauth.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(frontendErrorUrl('Failed to exchange Google authorization code'));
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // Fetch user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return res.redirect(frontendErrorUrl('Failed to fetch Google user info'));
    }

    const googleUser = (await userRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Parse name into first/last
    const nameParts = (googleUser.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Google';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Find or create user in our database
    const authResult = await authService.oauthLogin({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      firstName,
      lastName,
      avatarUrl: googleUser.picture,
    });

    // Redirect to frontend with tokens
    res.redirect(frontendCallbackUrl(authResult));
  } catch (err) {
    next(err);
  }
});

// ── GitHub OAuth ───────────────────────────────────

/**
 * GET /auth/oauth/github
 * Redirects the user to GitHub's consent screen.
 */
router.get('/oauth/github', (_req, res) => {
  const { clientId, callbackUrl } = config.oauth.github;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      error: { code: 'OAUTH_DISABLED', message: 'GitHub OAuth is not configured' },
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'read:user user:email',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

/**
 * GET /auth/oauth/github/callback
 * Handles the redirect from GitHub after user authorization.
 */
router.get('/oauth/github/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error || !code || typeof code !== 'string') {
      return res.redirect(frontendErrorUrl('GitHub authorization was denied'));
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.oauth.github.clientId,
        client_secret: config.oauth.github.clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(frontendErrorUrl('Failed to exchange GitHub authorization code'));
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token || tokenData.error) {
      return res.redirect(frontendErrorUrl('GitHub authorization failed'));
    }

    // Fetch user info from GitHub
    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }),
    ]);

    if (!userRes.ok) {
      return res.redirect(frontendErrorUrl('Failed to fetch GitHub user info'));
    }

    const githubUser = (await userRes.json()) as {
      id: number;
      login: string;
      name?: string;
      avatar_url?: string;
    };

    const emails = (await emailRes.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    // Find the primary verified email
    const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
    if (!primaryEmail) {
      return res.redirect(frontendErrorUrl('No verified email found on GitHub account'));
    }

    // Parse name into first/last
    const fullName = (githubUser.name || githubUser.login || '').trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || 'GitHub';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Find or create user in our database
    const authResult = await authService.oauthLogin({
      provider: 'github',
      providerId: String(githubUser.id),
      email: primaryEmail.email,
      firstName,
      lastName,
      avatarUrl: githubUser.avatar_url,
    });

    // Redirect to frontend with tokens
    res.redirect(frontendCallbackUrl(authResult));
  } catch (err) {
    next(err);
  }
});

export default router;
