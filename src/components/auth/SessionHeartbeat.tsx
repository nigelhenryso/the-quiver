"use client";

import { useEffect } from "react";
import { serializeCookieHeader } from "@supabase/ssr";
import { HEARTBEAT_MS, LAST_SEEN_COOKIE } from "@/src/lib/supabase/rememberMe";

/** Stamps "a tab is open right now" for the proxy's idle logout (see rememberMe.ts). Renders nothing. */
export default function SessionHeartbeat() {
  useEffect(() => {
    const stamp = () => {
      document.cookie = serializeCookieHeader(LAST_SEEN_COOKIE, String(Date.now()), {
        path: "/",
        sameSite: "lax",
      });
    };
    stamp();
    const timer = setInterval(stamp, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", stamp);
    window.addEventListener("focus", stamp);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", stamp);
      window.removeEventListener("focus", stamp);
    };
  }, []);

  return null;
}
