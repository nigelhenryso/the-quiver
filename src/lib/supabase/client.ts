import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { REMEMBER_COOKIE, REMEMBER_DAYS, applyRememberMe } from "./rememberMe";

const readCookie = (name: string) =>
  parseCookieHeader(document.cookie).find((c) => c.name === name)?.value;

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll() {
        return parseCookieHeader(document.cookie).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
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
