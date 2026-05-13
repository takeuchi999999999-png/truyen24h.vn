/**
 * Site-wide configuration constants.
 *
 * Always use `getSiteUrl()` instead of hardcoding domains so the value is
 * driven by an environment variable in production and falls back sensibly
 * during local development.
 */

const DEFAULT_DEV_URL = 'http://localhost:3000';
const DEFAULT_PROD_URL = 'https://truyen24h.vn';

/**
 * Returns the canonical site URL without a trailing slash.
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL (recommended)
 *   2. VERCEL_URL (set automatically on Vercel deployments — no protocol)
 *   3. Production default (https://truyen24h.vn) when NODE_ENV === 'production'
 *   4. Local dev default
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  if (process.env.NODE_ENV === 'production') return DEFAULT_PROD_URL;
  return DEFAULT_DEV_URL;
}

/**
 * Builds an absolute URL from a relative path.
 */
export function absoluteUrl(path: string = '/'): string {
  const base = getSiteUrl();
  if (!path.startsWith('/')) path = `/${path}`;
  return `${base}${path}`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

export const SITE_NAME = 'Truyen24h.vn';
export const SITE_DESCRIPTION =
  'Nền tảng đọc truyện online và sáng tác truyện hàng đầu Việt Nam. Đọc truyện miễn phí, truyện VIP bản quyền, ngôn tình, tiên hiệp, đam mỹ, trọng sinh với trải nghiệm vượt trội và AI tóm tắt thông minh.';
export const SITE_LOCALE = 'vi_VN';
export const SITE_PUBLISHER = 'Truyen24h.vn';
export const SITE_LOGO_PATH = '/logo.jpg';
