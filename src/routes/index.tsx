import { createFileRoute } from "@tanstack/react-router";
import ChatPanel from "@/components/ChatPanel";
import { Sparkles, Zap, Code2, Gamepad2 } from "lucide-react";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bloxie — Fun AI for Roblox Lua Scripts" },
      {
        name: "description",
        content: "Ask Bloxie for Roblox Lua scripts: admin panels, building tools, leaderstats, GUIs, and more. Copy-paste ready Luau code in seconds.",
      },
      { property: "og:title", content: "Bloxie — Fun AI for Roblox Lua Scripts" },
      { property: "og:description", content: "Generate working Roblox Luau scripts instantly." },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen grid-bg">
      <Toaster theme="dark" position="top-center" richColors />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-neon">
              <Gamepad2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Bloxie<span className="gradient-text">.lua</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Powered by <span className="font-semibold text-accent">babafarr</span> · Roblox scripting, but fun.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Feature icon={<Zap className="h-4 w-4" />} text="Instant scripts" />
            <Feature icon={<Code2 className="h-4 w-4" />} text="Copy-paste ready" />
            <Feature icon={<Sparkles className="h-4 w-4" />} text="Beginner friendly" />
          </div>
        </header>

        {/* Hero strip */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm shadow-card md:p-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" /> Powered by AI
              </div>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                Build <span className="gradient-text">anything</span> in Roblox.
                <br />
                Just ask for the script.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Admin panels, building tools, GUIs, datastores, weapons, NPCs — Bloxie writes
                clean Luau and tells you exactly where to put it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill>🛡️ Admin</Pill>
              <Pill>🧱 Building</Pill>
              <Pill>💰 Economy</Pill>
              <Pill>⚔️ Combat</Pill>
              <Pill>🎨 GUIs</Pill>
            </div>
          </div>
        </section>

        {/* Chat */}
        <ChatPanel />

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Bloxie writes scripts for use inside Roblox Studio. Always test in a private place first 🎮
        </footer>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {text}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium">
      {children}
    </span>
  );
}
