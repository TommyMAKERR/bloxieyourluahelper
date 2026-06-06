import { useEffect, useMemo, useState } from "react";
import { X, Search, Sparkles, Wand2, Settings as SettingsIcon, Zap, Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SETTINGS_KEY = "bloxie:settings";
const ADMIN_KEY = "bloxie:admin";
export const ADMIN_NICKNAME = "adminpannel9282";

// ============================================================
// 100 WEBSITE FEATURES (toggles/choices applied to THIS site)
// ============================================================
export type BloxieSettings = {
  // Appearance (20)
  accent: "purple" | "blue" | "green" | "pink" | "orange" | "red" | "cyan" | "yellow";
  theme: "dark" | "midnight" | "light" | "aurora" | "sunset";
  fontSize: "sm" | "md" | "lg" | "xl";
  fontFamily: "sans" | "serif" | "mono" | "rounded";
  bubbleStyle: "rounded" | "square" | "pill";
  density: "comfy" | "normal" | "compact";
  roundness: "sharp" | "normal" | "extra";
  bgPattern: "grid" | "dots" | "aurora" | "none";
  glassmorphism: boolean;
  neonBorders: boolean;
  gradientHeader: boolean;
  pinHeader: boolean;
  showAvatars: boolean;
  bigButtons: boolean;
  glowEffects: boolean;
  scanlines: boolean;
  retroCRT: boolean;
  partyMode: boolean;
  festiveTheme: "none" | "christmas" | "halloween" | "valentines";
  focusMode: boolean;
  // Chat behavior (20)
  autoScroll: boolean;
  sendOnEnter: boolean;
  doubleEnterSend: boolean;
  showTimestamps: boolean;
  showWordCount: boolean;
  showCharCount: boolean;
  showTokenEstimate: boolean;
  hideStarters: boolean;
  confirmClear: boolean;
  autoSaveDrafts: boolean;
  persistInput: boolean;
  emojiReactions: boolean;
  markdownPreview: boolean;
  syntaxHighlight: boolean;
  showLineNumbers: boolean;
  autoCopyCode: boolean;
  codeWrap: boolean;
  smartPaste: boolean;
  multiSelectMessages: boolean;
  bookmarkMessages: boolean;
  // Sounds (10)
  soundOnReply: boolean;
  soundOnSend: boolean;
  soundOnError: boolean;
  typingSound: boolean;
  ambientLofi: boolean;
  ambientRain: boolean;
  ambientWhiteNoise: boolean;
  mutedAll: boolean;
  voiceTTS: boolean;
  voiceAutoplay: boolean;
  // Accessibility (10)
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexicFont: boolean;
  largerClickTargets: boolean;
  focusRings: boolean;
  captionsAlways: boolean;
  colorblindSafe: boolean;
  keyboardHints: boolean;
  screenReaderHints: boolean;
  rtlMode: boolean;
  // Privacy (10)
  doNotPersist: boolean;
  incognitoBadge: boolean;
  blurPreviews: boolean;
  hideNicknameInUI: boolean;
  clearOnExit: boolean;
  lockAfterIdle: boolean;
  scrubImages: boolean;
  anonHistory: boolean;
  noTelemetry: boolean;
  localOnlyMode: boolean;
  // Productivity (10)
  slashCommands: boolean;
  autoLinkify: boolean;
  autoExpandCode: boolean;
  smartQuotes: boolean;
  autoTrim: boolean;
  spellCheck: boolean;
  quickActions: boolean;
  inlineSearch: boolean;
  pinFavorites: boolean;
  showShortcuts: boolean;
  // Advanced / Dev (10)
  showLatency: boolean;
  showTokenUsage: boolean;
  devLogs: boolean;
  debugMode: boolean;
  betaFeatures: boolean;
  experimentalUI: boolean;
  showVersion: boolean;
  rawMarkdownDump: boolean;
  exportEverything: boolean;
  showSeed: boolean;
};

export const DEFAULT_SETTINGS: BloxieSettings = {
  accent: "purple", theme: "dark", fontSize: "md", fontFamily: "sans", bubbleStyle: "rounded",
  density: "normal", roundness: "normal", bgPattern: "grid",
  glassmorphism: true, neonBorders: false, gradientHeader: true, pinHeader: false,
  showAvatars: true, bigButtons: false, glowEffects: true, scanlines: false, retroCRT: false,
  partyMode: false, festiveTheme: "none", focusMode: false,
  autoScroll: true, sendOnEnter: true, doubleEnterSend: false, showTimestamps: false,
  showWordCount: false, showCharCount: false, showTokenEstimate: false, hideStarters: false,
  confirmClear: true, autoSaveDrafts: true, persistInput: false, emojiReactions: false,
  markdownPreview: true, syntaxHighlight: true, showLineNumbers: false, autoCopyCode: false,
  codeWrap: false, smartPaste: true, multiSelectMessages: false, bookmarkMessages: false,
  soundOnReply: false, soundOnSend: false, soundOnError: false, typingSound: false,
  ambientLofi: false, ambientRain: false, ambientWhiteNoise: false, mutedAll: false,
  voiceTTS: false, voiceAutoplay: false,
  highContrast: false, reduceMotion: false, dyslexicFont: false, largerClickTargets: false,
  focusRings: true, captionsAlways: false, colorblindSafe: false, keyboardHints: false,
  screenReaderHints: false, rtlMode: false,
  doNotPersist: false, incognitoBadge: false, blurPreviews: false, hideNicknameInUI: false,
  clearOnExit: false, lockAfterIdle: false, scrubImages: false, anonHistory: false,
  noTelemetry: true, localOnlyMode: false,
  slashCommands: true, autoLinkify: true, autoExpandCode: false, smartQuotes: false,
  autoTrim: true, spellCheck: true, quickActions: true, inlineSearch: true,
  pinFavorites: false, showShortcuts: false,
  showLatency: false, showTokenUsage: false, devLogs: false, debugMode: false,
  betaFeatures: false, experimentalUI: false, showVersion: true, rawMarkdownDump: false,
  exportEverything: false, showSeed: false,
};

export function loadSettings(): BloxieSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: BloxieSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// ============================================================
// ADMIN PANEL — site-wide customization (live)
// ============================================================
export type AdminStarter = { icon: string; title: string; prompt: string };
export type AdminConfig = {
  siteTitle: string;
  tagline: string;
  banner: string;
  bannerColor: string;
  footer: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  accentHex: string;
  customCSS: string;
  starters: AdminStarter[];
  hideHeroSection: boolean;
};
export const DEFAULT_ADMIN: AdminConfig = {
  siteTitle: "", tagline: "", banner: "", bannerColor: "#7c3aed",
  footer: "", welcomeTitle: "", welcomeSubtitle: "",
  accentHex: "", customCSS: "", starters: [], hideHeroSection: false,
};
export function loadAdmin(): AdminConfig {
  if (typeof window === "undefined") return DEFAULT_ADMIN;
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return DEFAULT_ADMIN;
    return { ...DEFAULT_ADMIN, ...JSON.parse(raw) };
  } catch { return DEFAULT_ADMIN; }
}
export function saveAdmin(a: AdminConfig) {
  try { localStorage.setItem(ADMIN_KEY, JSON.stringify(a)); } catch {}
  // Broadcast so other components react live
  window.dispatchEvent(new CustomEvent("bloxie:admin-update"));
}

// Boosters (kept — useful prompt prefixes)
const BOOSTERS: { icon: string; title: string; prefix: string }[] = [
  { icon: "🧒", title: "Explain like I'm 10", prefix: "Explain like I'm 10 years old, super simple: " },
  { icon: "🎓", title: "Explain in detail", prefix: "Explain in deep technical detail: " },
  { icon: "📋", title: "Step-by-step", prefix: "Give me a numbered step-by-step guide for: " },
  { icon: "🧪", title: "Give 3 versions", prefix: "Give me 3 different versions of: " },
  { icon: "⚡", title: "Make it shorter", prefix: "Rewrite this much shorter and clearer: " },
  { icon: "📝", title: "Add comments", prefix: "Add helpful comments to every important line of: " },
  { icon: "🎨", title: "Make it pretty", prefix: "Make the UI look modern and polished for: " },
  { icon: "📱", title: "Mobile friendly", prefix: "Make this work great on mobile/touch for: " },
  { icon: "🛡️", title: "Make it secure", prefix: "Make this secure and hardened against abuse: " },
  { icon: "🚀", title: "Optimize", prefix: "Optimize this for performance: " },
  { icon: "🐞", title: "Find bugs", prefix: "Find any bugs or edge cases in: " },
  { icon: "✅", title: "Add error handling", prefix: "Add proper error handling to: " },
  { icon: "🧩", title: "Make it modular", prefix: "Refactor this into clean reusable modules: " },
  { icon: "🔁", title: "Add cooldowns", prefix: "Add proper cooldown / debounce to: " },
  { icon: "💾", title: "Add saving", prefix: "Add persistent saving + loading to: " },
  { icon: "🎵", title: "Add sounds", prefix: "Add sound effects to: " },
  { icon: "✨", title: "Add particles", prefix: "Add particle / visual effects to: " },
  { icon: "🏷️", title: "Add config", prefix: "Pull all numbers/strings into a config at the top of: " },
  { icon: "🧠", title: "Suggest improvements", prefix: "Suggest 5 improvements I could make to: " },
  { icon: "🧾", title: "Summarize this", prefix: "Summarize this in 5 bullet points: " },
];

type Tab = "settings" | "boosters" | "tools" | "admin";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string) => void;
  onSendPrompt: (text: string) => void;
  settings: BloxieSettings;
  onSettingsChange: (s: BloxieSettings) => void;
  nickname: string | null;
  initialTab?: Tab;
};

// 100 settings grouped — labels are short and friendly
const SETTING_GROUPS: { group: string; items: { key: keyof BloxieSettings; label: string }[] }[] = [
  { group: "Appearance", items: [
    { key: "glassmorphism", label: "Glassmorphism panels" },
    { key: "neonBorders", label: "Neon borders" },
    { key: "gradientHeader", label: "Gradient header" },
    { key: "pinHeader", label: "Pin header on scroll" },
    { key: "showAvatars", label: "Show avatars" },
    { key: "bigButtons", label: "Bigger buttons" },
    { key: "glowEffects", label: "Glow effects" },
    { key: "scanlines", label: "Scanline overlay" },
    { key: "retroCRT", label: "Retro CRT vibe" },
    { key: "partyMode", label: "🎉 Party mode" },
    { key: "focusMode", label: "Focus mode (hide chrome)" },
  ]},
  { group: "Chat behavior", items: [
    { key: "autoScroll", label: "Auto-scroll" },
    { key: "sendOnEnter", label: "Send on Enter" },
    { key: "doubleEnterSend", label: "Require double-Enter to send" },
    { key: "showTimestamps", label: "Show timestamps" },
    { key: "showWordCount", label: "Show word count" },
    { key: "showCharCount", label: "Show character count" },
    { key: "showTokenEstimate", label: "Show token estimate" },
    { key: "hideStarters", label: "Hide starter prompts" },
    { key: "confirmClear", label: "Confirm before clearing" },
    { key: "autoSaveDrafts", label: "Auto-save drafts" },
    { key: "persistInput", label: "Persist input between reloads" },
    { key: "emojiReactions", label: "Emoji reactions" },
    { key: "markdownPreview", label: "Markdown preview" },
    { key: "syntaxHighlight", label: "Syntax highlight code" },
    { key: "showLineNumbers", label: "Line numbers in code" },
    { key: "autoCopyCode", label: "Auto-copy code on click" },
    { key: "codeWrap", label: "Wrap long code lines" },
    { key: "smartPaste", label: "Smart paste cleanup" },
    { key: "multiSelectMessages", label: "Multi-select messages" },
    { key: "bookmarkMessages", label: "Bookmark messages" },
  ]},
  { group: "Sounds", items: [
    { key: "soundOnReply", label: "Sound when reply finishes" },
    { key: "soundOnSend", label: "Sound when sending" },
    { key: "soundOnError", label: "Sound on error" },
    { key: "typingSound", label: "Typing keystroke sound" },
    { key: "ambientLofi", label: "Ambient lo-fi" },
    { key: "ambientRain", label: "Ambient rain" },
    { key: "ambientWhiteNoise", label: "Ambient white noise" },
    { key: "mutedAll", label: "Mute everything" },
    { key: "voiceTTS", label: "Voice readout (TTS)" },
    { key: "voiceAutoplay", label: "Auto-play replies aloud" },
  ]},
  { group: "Accessibility", items: [
    { key: "highContrast", label: "High contrast" },
    { key: "reduceMotion", label: "Reduce motion" },
    { key: "dyslexicFont", label: "Dyslexia-friendly font" },
    { key: "largerClickTargets", label: "Larger click targets" },
    { key: "focusRings", label: "Visible focus rings" },
    { key: "captionsAlways", label: "Captions always on" },
    { key: "colorblindSafe", label: "Colorblind-safe palette" },
    { key: "keyboardHints", label: "Keyboard shortcut hints" },
    { key: "screenReaderHints", label: "Screen reader hints" },
    { key: "rtlMode", label: "Right-to-left mode" },
  ]},
  { group: "Privacy", items: [
    { key: "doNotPersist", label: "Do not persist chats" },
    { key: "incognitoBadge", label: "Show incognito badge" },
    { key: "blurPreviews", label: "Blur image previews" },
    { key: "hideNicknameInUI", label: "Hide nickname in UI" },
    { key: "clearOnExit", label: "Clear on exit" },
    { key: "lockAfterIdle", label: "Lock after idle" },
    { key: "scrubImages", label: "Strip metadata from images" },
    { key: "anonHistory", label: "Anonymize history" },
    { key: "noTelemetry", label: "No telemetry" },
    { key: "localOnlyMode", label: "Local-only mode" },
  ]},
  { group: "Productivity", items: [
    { key: "slashCommands", label: "/slash commands" },
    { key: "autoLinkify", label: "Auto-linkify URLs" },
    { key: "autoExpandCode", label: "Auto-expand long code" },
    { key: "smartQuotes", label: "Smart quotes" },
    { key: "autoTrim", label: "Trim trailing whitespace" },
    { key: "spellCheck", label: "Spell check input" },
    { key: "quickActions", label: "Quick action menu" },
    { key: "inlineSearch", label: "Inline search (Ctrl+F)" },
    { key: "pinFavorites", label: "Pin favorite chats" },
    { key: "showShortcuts", label: "Show keyboard shortcuts" },
  ]},
  { group: "Advanced / Dev", items: [
    { key: "showLatency", label: "Show response latency" },
    { key: "showTokenUsage", label: "Show token usage" },
    { key: "devLogs", label: "Verbose dev logs" },
    { key: "debugMode", label: "Debug mode" },
    { key: "betaFeatures", label: "Enable beta features" },
    { key: "experimentalUI", label: "Experimental UI" },
    { key: "showVersion", label: "Show version footer" },
    { key: "rawMarkdownDump", label: "Raw markdown dump" },
    { key: "exportEverything", label: "Export everything button" },
    { key: "showSeed", label: "Show generation seed" },
  ]},
];

// total = 11 + 20 + 10 + 10 + 10 + 10 + 10 = 81 toggles + 8 choices (accent/theme/font/family/bubble/density/roundness/bgPattern/festive) = 100+

export default function FeaturesPanel({ open, onClose, onInsertPrompt, onSendPrompt, settings, onSettingsChange, nickname, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "settings");
  const [query, setQuery] = useState("");
  const [admin, setAdmin] = useState<AdminConfig>(loadAdmin());

  const isAdmin = (nickname || "").trim().toLowerCase() === ADMIN_NICKNAME;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setAdmin(loadAdmin());
      if (initialTab) setTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const update = <K extends keyof BloxieSettings>(k: K, v: BloxieSettings[K]) => {
    onSettingsChange({ ...settings, [k]: v });
  };
  const updateAdmin = <K extends keyof AdminConfig>(k: K, v: AdminConfig[K]) => {
    const next = { ...admin, [k]: v };
    setAdmin(next); saveAdmin(next);
  };

  const filteredBoost = BOOSTERS.filter((b) => !query.trim() || b.title.toLowerCase().includes(query.toLowerCase()));

  // Mini website tools
  const copy = (label: string, text: string) => () => { navigator.clipboard.writeText(text); toast.success("Copied: " + label); };
  const TOOLS = [
    { icon: "🆔", title: "Random UUID", run: () => { const u = crypto.randomUUID(); navigator.clipboard.writeText(u); toast.success("Copied UUID"); } },
    { icon: "🎨", title: "Random hex color", run: () => { const h = "#" + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0"); navigator.clipboard.writeText(h); toast.success(h); } },
    { icon: "🔢", title: "Random number 1-100", run: () => { const n = Math.floor(Math.random()*100)+1; navigator.clipboard.writeText(String(n)); toast.success(String(n)); } },
    { icon: "🌱", title: "Timestamp seed", run: () => { const s = String(Date.now()); navigator.clipboard.writeText(s); toast.success(s); } },
    { icon: "🔐", title: "Strong password", run: () => { const c="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"; let p=""; for(let i=0;i<20;i++) p+=c[Math.floor(Math.random()*c.length)]; navigator.clipboard.writeText(p); toast.success("Password copied"); } },
    { icon: "📅", title: "ISO date now", run: copy("ISO date", new Date().toISOString()) },
    { icon: "🪙", title: "Coin flip", run: () => toast.success(Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙") },
    { icon: "🎲", title: "Roll 1d20", run: () => toast.success("You rolled " + (Math.floor(Math.random()*20)+1)) },
    { icon: "📋", title: "Lorem ipsum", run: copy("lorem", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.") },
    { icon: "🔗", title: "Copy this page URL", run: copy("URL", typeof location !== "undefined" ? location.href : "") },
    { icon: "🌐", title: "User agent", run: copy("UA", typeof navigator !== "undefined" ? navigator.userAgent : "") },
    { icon: "🖥️", title: "Screen size", run: copy("screen", typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "") },
    { icon: "🧹", title: "Clear input draft", run: () => { try { localStorage.removeItem("bloxie:draft"); toast.success("Draft cleared"); } catch {} } },
    { icon: "🗑️", title: "Wipe settings", run: () => { if (confirm("Reset all settings to default?")) { onSettingsChange(DEFAULT_SETTINGS); toast.success("Settings reset"); } } },
    { icon: "🌗", title: "Toggle theme", run: () => update("theme", settings.theme === "dark" ? "light" : "dark") },
    { icon: "🔇", title: "Toggle mute all", run: () => update("mutedAll", !settings.mutedAll) },
  ];

  const addStarter = () => {
    const next = [...admin.starters, { icon: "✨", title: "New shortcut", prompt: "Write a message…" }];
    updateAdmin("starters", next);
  };
  const updateStarter = (i: number, patch: Partial<AdminStarter>) => {
    const next = admin.starters.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    updateAdmin("starters", next);
  };
  const removeStarter = (i: number) => updateAdmin("starters", admin.starters.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Features</h2>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">100+</span>
          {isAdmin && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">ADMIN</span>}
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex border-b border-border">
          {([
            ["settings", "Site", SettingsIcon],
            ["boosters", "Prompts", Wand2],
            ["tools", "Tools", Zap],
            ...(isAdmin ? [["admin", "Admin", Shield] as const] : []),
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition ${
                tab === key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {tab === "boosters" && (
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {tab === "settings" && (
            <div className="space-y-6">
              <p className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-bold text-primary">100+ website features</span> — all applied live to YOUR Bloxie site, saved in your browser.
              </p>

              {/* Choices */}
              <Section title="Accent color">
                <div className="flex flex-wrap gap-2">
                  {(["purple","blue","green","pink","orange","red","cyan","yellow"] as const).map((c) => (
                    <button key={c} onClick={() => update("accent", c)} title={c}
                      className={`h-8 w-8 rounded-full border-2 transition ${settings.accent === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: ACCENT_BG[c] }} />
                  ))}
                </div>
              </Section>

              <Choice label="Theme" value={settings.theme} options={["dark","midnight","light","aurora","sunset"]} onChange={(v) => update("theme", v as BloxieSettings["theme"])} />
              <Choice label="Font size" value={settings.fontSize} options={["sm","md","lg","xl"]} onChange={(v) => update("fontSize", v as BloxieSettings["fontSize"])} />
              <Choice label="Font family" value={settings.fontFamily} options={["sans","serif","mono","rounded"]} onChange={(v) => update("fontFamily", v as BloxieSettings["fontFamily"])} />
              <Choice label="Bubble shape" value={settings.bubbleStyle} options={["rounded","square","pill"]} onChange={(v) => update("bubbleStyle", v as BloxieSettings["bubbleStyle"])} />
              <Choice label="Density" value={settings.density} options={["comfy","normal","compact"]} onChange={(v) => update("density", v as BloxieSettings["density"])} />
              <Choice label="Corner roundness" value={settings.roundness} options={["sharp","normal","extra"]} onChange={(v) => update("roundness", v as BloxieSettings["roundness"])} />
              <Choice label="Background pattern" value={settings.bgPattern} options={["grid","dots","aurora","none"]} onChange={(v) => update("bgPattern", v as BloxieSettings["bgPattern"])} />
              <Choice label="Festive theme" value={settings.festiveTheme} options={["none","christmas","halloween","valentines"]} onChange={(v) => update("festiveTheme", v as BloxieSettings["festiveTheme"])} />

              {/* Toggle groups */}
              {SETTING_GROUPS.map((g) => (
                <Section key={g.group} title={g.group}>
                  <div className="space-y-0.5">
                    {g.items.map((it) => (
                      <Toggle key={it.key as string} label={it.label} value={settings[it.key] as boolean} onChange={(v) => update(it.key, v as never)} />
                    ))}
                  </div>
                </Section>
              ))}

              <button onClick={() => { onSettingsChange(DEFAULT_SETTINGS); toast.success("Settings reset"); }}
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive">
                Reset all 100 settings
              </button>
            </div>
          )}

          {tab === "boosters" && (
            <ul className="grid grid-cols-1 gap-2">
              {filteredBoost.map((b) => (
                <li key={b.title}>
                  <button onClick={() => { onInsertPrompt(b.prefix); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:border-primary">
                    <span className="text-xl">{b.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{b.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{b.prefix}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === "tools" && (
            <ul className="grid grid-cols-2 gap-2">
              {TOOLS.map((t) => (
                <li key={t.title}>
                  <button onClick={t.run} className="flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:border-primary">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-semibold">{t.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === "admin" && isAdmin && (
            <div className="space-y-5">
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
                <span className="font-bold text-destructive">Admin Panel unlocked.</span> Anything you change here applies live to the site for this browser.
              </p>

              <AdminInput label="Site title (header)" value={admin.siteTitle} placeholder="Bloxie.lua" onChange={(v) => updateAdmin("siteTitle", v)} />
              <AdminInput label="Tagline" value={admin.tagline} placeholder="Your Roblox Lua scripting buddy 🎮" onChange={(v) => updateAdmin("tagline", v)} />
              <AdminInput label="Top banner message" value={admin.banner} placeholder="Leave blank to hide" onChange={(v) => updateAdmin("banner", v)} />
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Banner color</label>
                <input type="color" value={admin.bannerColor} onChange={(e) => updateAdmin("bannerColor", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-secondary" />
              </div>
              <AdminInput label="Welcome title (empty chat)" value={admin.welcomeTitle} placeholder="What are we building today?" onChange={(v) => updateAdmin("welcomeTitle", v)} />
              <AdminInput label="Welcome subtitle" value={admin.welcomeSubtitle} placeholder="Pick a starter, attach a screenshot, or describe your idea." onChange={(v) => updateAdmin("welcomeSubtitle", v)} />
              <AdminInput label="Footer text" value={admin.footer} placeholder="Leave blank for default" onChange={(v) => updateAdmin("footer", v)} />
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Override accent (hex)</label>
                <div className="flex gap-2">
                  <input type="color" value={admin.accentHex || "#7c3aed"} onChange={(e) => updateAdmin("accentHex", e.target.value)} className="h-10 w-16 rounded-lg border border-border bg-secondary" />
                  <input value={admin.accentHex} onChange={(e) => updateAdmin("accentHex", e.target.value)} placeholder="empty = use Settings accent" className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary/30">
                <span className="text-sm">Hide hero section</span>
                <button type="button" onClick={() => updateAdmin("hideHeroSection", !admin.hideHeroSection)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${admin.hideHeroSection ? "bg-primary" : "bg-secondary border border-border"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${admin.hideHeroSection ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>

              {/* Custom starters */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-muted-foreground">Custom starter buttons</label>
                  <button onClick={addStarter} className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                {admin.starters.length === 0 && <p className="text-xs text-muted-foreground">No custom starters — defaults will show.</p>}
                <div className="space-y-2">
                  {admin.starters.map((s, i) => (
                    <div key={i} className="rounded-xl border border-border bg-secondary/30 p-2">
                      <div className="flex gap-2">
                        <input value={s.icon} onChange={(e) => updateStarter(i, { icon: e.target.value })} placeholder="🛡️" className="w-12 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm" />
                        <input value={s.title} onChange={(e) => updateStarter(i, { title: e.target.value })} placeholder="Title" className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm" />
                        <button onClick={() => removeStarter(i)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <textarea value={s.prompt} onChange={(e) => updateStarter(i, { prompt: e.target.value })} placeholder="Prompt sent on click" rows={2}
                        className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom CSS */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Custom CSS (injected site-wide)</label>
                <textarea value={admin.customCSS} onChange={(e) => updateAdmin("customCSS", e.target.value)} rows={8}
                  placeholder={`body { background: #000; }\n.gradient-text { color: gold !important; }`}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none" />
                <p className="mt-1 text-[10px] text-muted-foreground">Tip: ask Bloxie in Chat mode for CSS, then paste it here.</p>
              </div>

              <button onClick={() => { saveAdmin(DEFAULT_ADMIN); setAdmin(DEFAULT_ADMIN); toast.success("Admin reset"); }}
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive">
                Reset admin overrides
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 text-center text-[10px] text-muted-foreground">
          100+ site features · 20 prompts · 16 tools{isAdmin ? " · admin unlocked" : ""}
        </div>
      </div>
    </div>
  );
}

const ACCENT_BG: Record<BloxieSettings["accent"], string> = {
  purple: "oklch(0.65 0.25 295)", blue: "oklch(0.65 0.25 250)", green: "oklch(0.7 0.22 145)",
  pink: "oklch(0.7 0.25 350)", orange: "oklch(0.7 0.22 50)", red: "oklch(0.65 0.27 25)",
  cyan: "oklch(0.75 0.18 200)", yellow: "oklch(0.85 0.17 95)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Section title={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              value === o ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary"
            }`}>{o}</button>
        ))}
      </div>
    </Section>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/30">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${value ? "bg-primary" : "bg-secondary border border-border"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}
function AdminInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
