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

/**
 * Non-remembered logins: browsers that restore the last session ("Continue where you left off",
 * or apps kept running in the background) also restore session cookies, so closing the browser
 * isn't enough to log out. Every open tab stamps LAST_SEEN_COOKIE once a minute (SessionHeartbeat);
 * the proxy logs a non-remembered user out once no tab has stamped it for IDLE_LOGOUT_MS.
 */
export const LAST_SEEN_COOKIE = 'quiver-last-seen';
export const HEARTBEAT_MS = 10 * 1000; // how often an open tab stamps LAST_SEEN_COOKIE
export const IDLE_LOGOUT_MS = 30 * 1000; // must stay a few heartbeats above HEARTBEAT_MS, never 0

/** True while the "Remember me" window is still open. */
export function isRemembered(rememberUntil: string | undefined) {
  const until = Number(rememberUntil);
  return Number.isFinite(until) && until > Date.now();
}

/** True if no tab has been open recently (or the stamp is missing). */
export function isIdleTooLong(lastSeen: string | undefined) {
  const at = Number(lastSeen);
  return !Number.isFinite(at) || at <= 0 || Date.now() - at > IDLE_LOGOUT_MS;
}
