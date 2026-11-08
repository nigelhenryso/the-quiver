import type { CookieOptions } from '@supabase/ssr';

/** Holds the epoch-ms until which the login should be kept. Absent → browser-session login. */
export const REMEMBER_COOKIE = 'quiver-remember-until';
export const REMEMBER_DAYS = 30;

/**
 * Adjusts Supabase auth cookie options to match "Remember me":
 * - remembered → cookie expires exactly when the 30-day window ends (not sliding)
 * - not remembered → session cookie (no maxAge/expires), cleared when the browser closes
 * Deletion cookies (empty value / maxAge 0) are passed through untouched.
 */
export function applyRememberMe(
  value: string,
  options: CookieOptions = {},
  rememberUntil: string | undefined
): CookieOptions {
  if (value === '' || options.maxAge === 0) return options;

  const until = Number(rememberUntil);
  const remainingSec = Math.floor((until - Date.now()) / 1000);

  if (Number.isFinite(until) && remainingSec > 0) {
    return { ...options, maxAge: remainingSec, expires: undefined };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge, expires, ...sessionOnly } = options;
  return sessionOnly;
}
