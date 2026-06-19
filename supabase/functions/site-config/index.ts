// Site config: shared admin customization (load / save / AI customize)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_NICKNAME = "adminpannel9282";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-nickname",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function getAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function isAdmin(req: Request) {
  const nick = req.headers.get("x-admin-nickname") || "";
  return nick.trim().toLowerCase() === ADMIN_NICKNAME;
}

const DEFAULT_CONFIG = {
  siteTitle: "", tagline: "", banner: "", bannerColor: "#7c3aed",
  footer: "", welcomeTitle: "", welcomeSubtitle: "",
  accentHex: "", customCSS: "", starters: [], hideHeroSection: false,
};

async function loadConfig() {
  const sb = getAdmin();
  const { data, error } = await sb
    .from("site_config")
    .select("config,updated_at")
    .eq("id", "global")
    .maybeSingle();
  if (error) throw error;
  return { config: { ...DEFAULT_CONFIG, ...(data?.config || {}) }, updated_at: data?.updated_at };
}

async function saveConfig(config: Record<string, unknown>) {
  const sb = getAdmin();
  const merged = { ...DEFAULT_CONFIG, ...config };
  const { error } = await sb
    .from("site_config")
    .upsert({ id: "global", config: merged, updated_at: new Date().toISOString() });
  if (error) throw error;
  return merged;
}

async function aiCustomize(instruction: string, current: Record<string, unknown>) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const sys = `You are the Bloxie Admin AI. The admin wants to change the website. Return ONLY a single JSON object (no markdown, no code fences, no commentary) with the FULL updated site config. Keep existing values unless the instruction asks to change them.

Schema (all fields required, use empty string / empty array / false to clear):
{
  "siteTitle": string,         // header title text
  "tagline": string,           // subtitle under header
  "banner": string,            // top banner message, empty hides it
  "bannerColor": string,       // hex like "#7c3aed"
  "footer": string,            // footer text
  "welcomeTitle": string,      // empty-chat welcome
  "welcomeSubtitle": string,
  "accentHex": string,         // hex color "#xxxxxx" or "" for default
  "customCSS": string,         // raw CSS injected site-wide. Use it to deeply restyle anything: backgrounds, fonts, colors, layout, animations. Target classes like body, .gradient-text, button, etc.
  "starters": [ { "icon": string, "title": string, "prompt": string } ],
  "hideHeroSection": boolean
}

Be creative with customCSS — it's the most powerful field. You can transform the entire look (neon, retro, glassmorphism, gradient backgrounds, custom fonts via @import url(...), animations, etc.). Current config:
${JSON.stringify(current)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: instruction },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(content); } catch { throw new Error("AI returned invalid JSON"); }
  return await saveConfig({ ...current, ...parsed });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const r = await loadConfig();
      return json(r);
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return json({ error: "Forbidden — admin only" }, 403);
      const body = await req.json().catch(() => ({}));
      const action = body.action || "save";

      if (action === "save") {
        const saved = await saveConfig(body.config || {});
        return json({ config: saved });
      }
      if (action === "ai") {
        const current = (await loadConfig()).config;
        const saved = await aiCustomize(String(body.instruction || ""), current);
        return json({ config: saved });
      }
      if (action === "reset") {
        const saved = await saveConfig(DEFAULT_CONFIG);
        return json({ config: saved });
      }
      return json({ error: "Unknown action" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("site-config error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
