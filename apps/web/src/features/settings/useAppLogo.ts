/**
 * useAppLogo — hook that reads & writes the `app_logo_url` SystemSetting.
 *
 * The app logo is rendered in the sidebar and can be overridden
 * via a file upload (stored as a URL in the system settings).
 * Falls back to the default `/logo.svg` when unset.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings';

const APP_LOGO_KEY = 'app_logo_url';
const DEFAULT_LOGO = '/logo.svg';

/** Extract the URL string from the setting value (stored as `{ url: "…" }`). */
function extractUrl(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
  }
  return DEFAULT_LOGO;
}

export function useAppLogo() {
  return useQuery({
    queryKey: ['settings', APP_LOGO_KEY],
    queryFn: async () => {
      try {
        const res = await settingsApi.getByKey(APP_LOGO_KEY);
        return extractUrl(res.data?.setting?.value);
      } catch {
        return DEFAULT_LOGO;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateAppLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logoUrl: string) => {
      await settingsApi.upsert({
        key: APP_LOGO_KEY,
        value: { url: logoUrl } as unknown as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', APP_LOGO_KEY] });
    },
  });
}

export function useResetAppLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await settingsApi.delete(APP_LOGO_KEY);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', APP_LOGO_KEY] });
    },
  });
}
