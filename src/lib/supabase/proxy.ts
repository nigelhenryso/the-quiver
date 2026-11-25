import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { getAccountType } from "@/src/services/accountService";
import { HOME_ROUTE, ORG_ROUTES, STUDENT_ROUTES, isInRoutes } from "@/src/lib/routes";
import { LAST_SEEN_COOKIE, REMEMBER_COOKIE, applyRememberMe, isIdleTooLong, isRemembered } from "./rememberMe";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient( //Do not make global!
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          const rememberUntil = request.cookies.get(REMEMBER_COOKIE)?.value;
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              applyRememberMe(value, options, rememberUntil),
            ),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  let user = data?.claims;

  // "Remember me" unticked and no tab has been open for a while → the browser was closed
  // (and restored its session cookies). Log out here; signOut clears the sb-* cookies via setAll.
  if (
    user &&
    !isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value) &&
    isIdleTooLong(request.cookies.get(LAST_SEEN_COOKIE)?.value)
  ) {
    await supabase.auth.signOut({ scope: "local" });
    user = undefined;
  }

  const pathname = request.nextUrl.pathname;

  // Sends the user to `to`, keeping any refreshed auth cookies.
  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (
    pathname !== "/" &&
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    return redirectTo("/");
  }

  // Keep each account type on its own pages:
  // - organization → org pages only (anything else, including "/", goes to /dashboard)
  // - student      → never on org pages; "/" skips the public landing page
  // - new student  → never on org pages (still completing their profile on "/")
  const isOrgRoute = isInRoutes(pathname, ORG_ROUTES);
  const isStudentRoute = isInRoutes(pathname, STUDENT_ROUTES);

  if (user && (pathname === "/" || isOrgRoute || isStudentRoute)) { //checks if an auth is in
    const account = await getAccountType(supabase, user.sub);

    if (account === "organization" && !isOrgRoute) return redirectTo(HOME_ROUTE.organization);
    if (account === "student" && !isStudentRoute) return redirectTo(HOME_ROUTE.student);
    if (account === "new" && isOrgRoute) return redirectTo("/");
  }

  return supabaseResponse;
}
