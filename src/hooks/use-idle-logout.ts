import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IDLE_LIMIT_MS = 40 * 60 * 1000;
const KEY = "tvl:last-activity";

/** Signs the user out after IDLE_LIMIT_MS without activity (shared across tabs via localStorage). */
export function useIdleLogout(queryClient: QueryClient) {
  const navigate = useNavigate();
  useEffect(() => {
    let lastWrite = 0;
    const touch = () => {
      const now = Date.now();
      if (now - lastWrite < 15000) return;
      lastWrite = now;
      localStorage.setItem(KEY, String(now));
    };
    touch();
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(async () => {
      const last = Number(localStorage.getItem(KEY) || Date.now());
      if (Date.now() - last < IDLE_LIMIT_MS) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      localStorage.setItem(KEY, String(Date.now()));
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    }, 30000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [navigate, queryClient]);
}
