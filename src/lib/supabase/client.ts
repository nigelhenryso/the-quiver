import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { REMEMBER_COOKIE, REMEMBER_DAYS, applyRememberMe } from "./rememberMe";

// Next.js also renders client components on the server, where `document` doesn't exist.
const isBrowser = typeof document !== "undefined";

const readCookie = (name: string) => isBrowser
    ? parseCookieHeader(document.cookie).find((c) => c.name === name)?.value
    : undefined;

/**
 * Global import for services to use import in building queries
 * Gets 
 */

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll() { // 
        if (!isBrowser) return [];
        return parseCookieHeader(document.cookie).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        if (!isBrowser) return;
        const rememberUntil = readCookie(REMEMBER_COOKIE);
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(
            name,
            value,
            applyRememberMe(value, options, rememberUntil)
          );
        });
      },
    },
  },
);

/**
 * Call BEFORE signing in. `true` keeps the login for 30 days;
 * `false` makes it last only until the browser is closed.
 */
export function setRememberMe(remember: boolean) {
  if (remember) {
    const until = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
    document.cookie = serializeCookieHeader(REMEMBER_COOKIE, String(until), {
      path: "/",
      sameSite: "lax",
      maxAge: REMEMBER_DAYS * 24 * 60 * 60,
    });
  } else {
    clearRememberMe();
  }
}

/** Call on logout. */
export function clearRememberMe() {
  document.cookie = serializeCookieHeader(REMEMBER_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Deletes every Supabase auth cookie (sb-*) in this browser, including chunked ones. */
export function clearAuthCookies() {
  parseCookieHeader(document.cookie)
    .filter(({ name }) => name.startsWith("sb-"))
    .forEach(({ name }) => {
      document.cookie = serializeCookieHeader(name, "", { path: "/", maxAge: 0 });
    });
}
