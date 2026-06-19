// Shared site config client (talks to the site-config edge function).
// The config is stored in the public.site_config table and is readable by everyone.
import { supabase } from "@/integrations/supabase/client";
import type { AdminConfig } from "@/components/FeaturesPanel";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-config`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function authHeaders(nickname?: string | null) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
  };
  if (nickname) h["x-admin-nickname"] = nickname;
  return h;
}

// Read directly from the table (faster, RLS allows public select).
export async function fetchSharedConfig(): Promise<Partial<AdminConfig> | null> {
  const { data, error } = await supabase
    .from("site_config" as any)
    .select("config")
    .eq("id", "global")
    .maybeSingle();
  if (error) { console.error("fetchSharedConfig", error); return null; }
  return (data?.config as Partial<AdminConfig>) || {};
}

export async function saveSharedConfig(config: AdminConfig, nickname: string) {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: authHeaders(nickname),
    body: JSON.stringify({ action: "save", config }),
  });
  if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Save failed");
  return (await resp.json()).config as AdminConfig;
}

export async function aiCustomizeSite(instruction: string, nickname: string) {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: authHeaders(nickname),
    body: JSON.stringify({ action: "ai", instruction }),
  });
  if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "AI failed");
  return (await resp.json()).config as AdminConfig;
}

export async function resetSharedConfig(nickname: string) {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: authHeaders(nickname),
    body: JSON.stringify({ action: "reset" }),
  });
  if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Reset failed");
  return (await resp.json()).config as AdminConfig;
}

// Subscribe to live changes so every visitor sees admin updates instantly.
export function subscribeSharedConfig(cb: (c: Partial<AdminConfig>) => void) {
  const channel = supabase
    .channel("site_config_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_config", filter: "id=eq.global" },
      (payload: any) => {
        const cfg = payload?.new?.config;
        if (cfg) cb(cfg as Partial<AdminConfig>);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
