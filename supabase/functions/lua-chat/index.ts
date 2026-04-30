// Streaming Roblox Lua expert chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Bloxie", an upbeat, fun expert at scripting in Roblox Lua (Luau). You help builders create:
- Admin panels & command systems (kick/ban/teleport/give items)
- Building tools, part spawners, terrain helpers
- Game mechanics: leaderstats, datastores, GUIs, tweens, animations, raycasting
- Server vs client logic with RemoteEvents/RemoteFunctions
- Tools, weapons, NPCs, pathfinding, daily rewards, shops

Rules:
- ALWAYS produce working, copy-paste ready Luau code in fenced \`\`\`lua blocks.
- Tell the user EXACTLY where the script goes (ServerScriptService, StarterPlayerScripts, StarterGui, ReplicatedStorage, inside a Tool, etc).
- Note if it's a Script (server), LocalScript (client), or ModuleScript.
- Use modern Luau (task.wait, task.spawn, typed when helpful). Avoid deprecated APIs (no wait(), no LoadLibrary).
- Be concise and fun — emojis OK (🧱✨🎮), but keep it readable. Short intro, then code, then a quick "How to use" list.
- For admin systems, use a hardcoded allowlist of UserIds the user can edit, and warn never to trust the client.
- If the user is a beginner, briefly explain key parts inline as comments.
- Never refuse benign Roblox scripting requests. If something violates Roblox TOS (exploits, bypassing security, malicious scripts), refuse politely and offer a legitimate alternative.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Whoa, too many requests! Take a breath and try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits ran out. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("lua-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
