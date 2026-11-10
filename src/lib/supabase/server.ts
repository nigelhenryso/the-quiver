import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { REMEMBER_COOKIE, applyRememberMe } from "./rememberMe";

/**
 * Do not make global!
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const rememberUntil = cookieStore.get(REMEMBER_COOKIE)?.value;
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, applyRememberMe(value, options, rememberUntil)),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
