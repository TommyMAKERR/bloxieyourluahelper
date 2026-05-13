import { useEffect, useState } from "react";
import { X, Search, Sparkles, Wand2, Settings as SettingsIcon, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";

const SETTINGS_KEY = "bloxie:settings";

export type BloxieSettings = {
  fontSize: "sm" | "md" | "lg";
  compact: boolean;
  accent: "purple" | "blue" | "green" | "pink" | "orange";
  autoScroll: boolean;
  sendOnEnter: boolean;
  showTimestamps: boolean;
  soundOnReply: boolean;
  showWordCount: boolean;
  reduceMotion: boolean;
  hideStarters: boolean;
  bigButtons: boolean;
  highContrast: boolean;
  showLineNumbers: boolean;
  autoCopyCode: boolean;
  confirmClear: boolean;
  showAvatars: boolean;
  bubbleStyle: "rounded" | "square";
  emojiReactions: boolean;
  typingSound: boolean;
  pinHeader: boolean;
};

export const DEFAULT_SETTINGS: BloxieSettings = {
  fontSize: "md",
  compact: false,
  accent: "purple",
  autoScroll: true,
  sendOnEnter: true,
  showTimestamps: false,
  soundOnReply: false,
  showWordCount: false,
  reduceMotion: false,
  hideStarters: false,
  bigButtons: false,
  highContrast: false,
  showLineNumbers: false,
  autoCopyCode: false,
  confirmClear: true,
  showAvatars: true,
  bubbleStyle: "rounded",
  emojiReactions: false,
  typingSound: false,
  pinHeader: false,
};

export function loadSettings(): BloxieSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: BloxieSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// 60 Roblox script templates
const TEMPLATES: { cat: string; icon: string; title: string; prompt: string }[] = [
  // Combat & weapons
  { cat: "Combat", icon: "⚔️", title: "Sword tool", prompt: "Make a classic sword tool with swing animation, damage, and cooldown." },
  { cat: "Combat", icon: "🔫", title: "Gun tool", prompt: "Create a pistol tool with raycast bullets, ammo, reload, and muzzle flash." },
  { cat: "Combat", icon: "🏹", title: "Bow & arrow", prompt: "Make a bow tool that shoots arrows with charge-up power and gravity." },
  { cat: "Combat", icon: "💣", title: "Throwable bomb", prompt: "Create a bomb tool that explodes on impact with damage radius and BillboardGui timer." },
  { cat: "Combat", icon: "🛡️", title: "Block & parry", prompt: "Add a block/parry system to a sword tool with reduced damage on block and bounce-back on perfect parry." },
  { cat: "Combat", icon: "🪄", title: "Magic spell", prompt: "Make a fireball spell tool that launches a projectile with VFX and explosion damage." },
  { cat: "Combat", icon: "🎯", title: "Headshot system", prompt: "Add headshot detection (2x damage) to a gun tool using Humanoid Head hits." },
  { cat: "Combat", icon: "💀", title: "Killstreak announcer", prompt: "Build a killstreak system that announces 'Double Kill', 'Triple Kill' etc in chat with sounds." },

  // Admin
  { cat: "Admin", icon: "🛡️", title: "Admin panel", prompt: "Make a full admin panel with kick, ban, teleport, fly, and give-tools commands using a UserId allowlist." },
  { cat: "Admin", icon: "⚡", title: "Chat commands", prompt: "Create a chat command system: /kick, /ban, /speed, /jump, /tp, restricted to admins." },
  { cat: "Admin", icon: "🚫", title: "Ban with DataStore", prompt: "Build a persistent ban system using DataStoreService — banned users get kicked on join." },
  { cat: "Admin", icon: "👁️", title: "Spectate menu", prompt: "Build a spectate GUI listing all players, click a name to camera-follow them." },
  { cat: "Admin", icon: "📜", title: "Action logger", prompt: "Log every admin action (kick/ban/tp) to a DataStore and to a Discord webhook." },

  // Data / progression
  { cat: "Data", icon: "💰", title: "Leaderstats + save", prompt: "Set up leaderstats (Coins, Wins) saved with DataStoreService and auto-save every 60s." },
  { cat: "Data", icon: "🎁", title: "Daily reward", prompt: "Build a daily login reward GUI with 7-day streak tracking via DataStore." },
  { cat: "Data", icon: "🏆", title: "Achievements", prompt: "Create an achievements system with 10 example badges, GUI popup, and DataStore save." },
  { cat: "Data", icon: "📈", title: "XP + levels", prompt: "Add XP and Level leaderstats with a curve, level-up GUI popup, and save." },
  { cat: "Data", icon: "🎒", title: "Inventory system", prompt: "Build an inventory GUI showing owned tools, items, with drag-to-equip, saved per player." },
  { cat: "Data", icon: "📊", title: "Global leaderboard", prompt: "Make a global top-10 leaderboard using OrderedDataStore for Coins, displayed on a SurfaceGui." },
  { cat: "Data", icon: "🏪", title: "Coin shop", prompt: "Create a shop GUI selling tools and skins for Coins, with DataStore-backed ownership." },

  // Movement
  { cat: "Movement", icon: "🏃", title: "Sprint key", prompt: "Add Shift-to-sprint that boosts WalkSpeed and shows a stamina bar." },
  { cat: "Movement", icon: "🪂", title: "Double jump", prompt: "Implement double jump using StateChanged/Jumping detection." },
  { cat: "Movement", icon: "🧗", title: "Wall climbing", prompt: "Add wall climb when pressing W against a vertical surface, with stamina drain." },
  { cat: "Movement", icon: "🛹", title: "Slide", prompt: "Add a Ctrl-to-slide ability that boosts speed briefly and lowers hitbox." },
  { cat: "Movement", icon: "✨", title: "Dash", prompt: "Add a Q-to-dash forward with cooldown, particles, and screen shake." },
  { cat: "Movement", icon: "🚀", title: "Rocket boots", prompt: "Build rocket boots tool that lets the player fly with fuel limit." },

  // GUI
  { cat: "GUI", icon: "🎨", title: "Settings menu", prompt: "Build a Settings GUI with sliders for sensitivity, music volume, FOV, saved per player." },
  { cat: "GUI", icon: "💬", title: "Custom chat", prompt: "Replace default chat with a custom ScrollingFrame chat including timestamps and player colors." },
  { cat: "GUI", icon: "📦", title: "Loot box opening", prompt: "Make an animated CS:GO-style loot crate opening GUI with weighted item odds." },
  { cat: "GUI", icon: "🗺️", title: "Minimap", prompt: "Add a top-down minimap GUI showing player dots and key landmarks." },
  { cat: "GUI", icon: "❤️", title: "Custom health bar", prompt: "Replace default health UI with a sleek custom health + shield bar." },
  { cat: "GUI", icon: "📍", title: "Quest tracker", prompt: "Build a quest tracker GUI on the side of the screen with progress bars." },
  { cat: "GUI", icon: "🛎️", title: "Notification toasts", prompt: "Create a reusable notification toast system: TweenIn, hold, TweenOut." },
  { cat: "GUI", icon: "🎬", title: "Loading screen", prompt: "Make a custom loading screen with progress bar that hides default GUI until ready." },

  // Game systems
  { cat: "Systems", icon: "⏲️", title: "Round system", prompt: "Build a round system: intermission countdown, teleport players, win condition, reward." },
  { cat: "Systems", icon: "🎲", title: "Random map vote", prompt: "Make a map voting GUI between rounds, picks the winning map and teleports." },
  { cat: "Systems", icon: "🟥", title: "Team selector", prompt: "Add a team selector GUI with auto-balance and respawn on team change." },
  { cat: "Systems", icon: "🚪", title: "VIP gamepass door", prompt: "Make a door that only opens for players who own a specific gamepass." },
  { cat: "Systems", icon: "🛒", title: "Dev product purchase", prompt: "Sell 100 Coins via a developer product with ProcessReceipt and DataStore credit." },
  { cat: "Systems", icon: "🎟️", title: "Codes redemption", prompt: "Add a Twitter codes GUI: redeemed codes saved per player, rewards configurable in a script." },
  { cat: "Systems", icon: "🌍", title: "Teleport to lobby", prompt: "Use TeleportService to send players from a game place to a lobby place with reserved server." },
  { cat: "Systems", icon: "👥", title: "Party system", prompt: "Allow players to invite friends to a party via GUI and teleport together." },

  // Building
  { cat: "Building", icon: "🧱", title: "Click-to-place", prompt: "Building tool: click a position to place a colored brick, with size and color sliders." },
  { cat: "Building", icon: "🏗️", title: "Drag & rotate", prompt: "Add drag-to-move and R-to-rotate to a placed brick using selection box." },
  { cat: "Building", icon: "💥", title: "Destructible parts", prompt: "Make parts break into smaller debris when damaged enough." },
  { cat: "Building", icon: "🔄", title: "Save my build", prompt: "Save player's placed parts (positions, colors, sizes) to DataStore and reload on join." },

  // NPC / AI
  { cat: "NPC", icon: "🧟", title: "Zombie AI", prompt: "Create a zombie NPC that pathfinds to nearest player and damages on touch." },
  { cat: "NPC", icon: "🛍️", title: "Shopkeeper NPC", prompt: "Make an NPC that opens a shop GUI when clicked using ProximityPrompt." },
  { cat: "NPC", icon: "🐕", title: "Pet follower", prompt: "Spawn a pet that floats next to the player and bobs up and down." },
  { cat: "NPC", icon: "💬", title: "Dialogue NPC", prompt: "Build a dialogue NPC with branching choices using a config table." },
  { cat: "NPC", icon: "👮", title: "Boss fight", prompt: "Create a boss with 3 phases, attack patterns, and a health bar BillboardGui." },

  // Effects
  { cat: "FX", icon: "📷", title: "Camera shake", prompt: "Add a reusable CameraShake module with intensity and duration." },
  { cat: "FX", icon: "🌧️", title: "Rain weather", prompt: "Add a rain weather system with particles, ambient sound, and lighting tint." },
  { cat: "FX", icon: "🌫️", title: "Day/night cycle", prompt: "Make a smooth day/night cycle by tweening Lighting.ClockTime." },
  { cat: "FX", icon: "💫", title: "Hit effect", prompt: "Spawn a damage number BillboardGui that floats up and fades when a Humanoid takes damage." },
  { cat: "FX", icon: "🔊", title: "Footstep sounds", prompt: "Play footstep sounds based on Humanoid.Running speed and floor material." },

  // Misc
  { cat: "Misc", icon: "🐛", title: "Fix this error", prompt: "Here's an error from Output: [paste error]. What's wrong and how do I fix it?" },
  { cat: "Misc", icon: "📖", title: "Explain this script", prompt: "Explain what this script does line by line:\n```lua\n-- paste here\n```" },
  { cat: "Misc", icon: "♻️", title: "Optimize my script", prompt: "Refactor this script to be more efficient and readable:\n```lua\n-- paste here\n```" },
  { cat: "Misc", icon: "🔁", title: "Convert to ModuleScript", prompt: "Convert this script into a clean reusable ModuleScript:\n```lua\n-- paste here\n```" },
];

// 20 prompt boosters
const BOOSTERS: { icon: string; title: string; prefix: string }[] = [
  { icon: "🧒", title: "Explain like I'm 10", prefix: "Explain like I'm 10 years old, super simple: " },
  { icon: "🎓", title: "Explain in detail", prefix: "Explain in deep technical detail: " },
  { icon: "📋", title: "Give me a step-by-step", prefix: "Give me a numbered step-by-step guide for: " },
  { icon: "🧪", title: "Give 3 versions", prefix: "Give me 3 different versions of: " },
  { icon: "⚡", title: "Make it shorter", prefix: "Rewrite this much shorter and clearer: " },
  { icon: "📝", title: "Add comments", prefix: "Add helpful comments to every important line of: " },
  { icon: "🎨", title: "Make it pretty", prefix: "Make the GUI look modern and polished for: " },
  { icon: "📱", title: "Mobile friendly", prefix: "Make this work great on mobile/touch for: " },
  { icon: "🛡️", title: "Server-sided & secure", prefix: "Make this exploit-resistant and server-authoritative: " },
  { icon: "🚀", title: "Optimize performance", prefix: "Optimize this for performance: " },
  { icon: "🐞", title: "Find bugs", prefix: "Find any bugs or edge cases in: " },
  { icon: "✅", title: "Add error handling", prefix: "Add proper pcall/error handling to: " },
  { icon: "🧩", title: "Make it modular", prefix: "Refactor this into a clean ModuleScript with config: " },
  { icon: "🎮", title: "Add console commands", prefix: "Add chat commands to control: " },
  { icon: "🔁", title: "Add cooldowns", prefix: "Add proper cooldown / debounce to: " },
  { icon: "💾", title: "Add DataStore save", prefix: "Add DataStore saving + loading to: " },
  { icon: "🎵", title: "Add sounds", prefix: "Add sound effects (use SoundIds) to: " },
  { icon: "✨", title: "Add particles", prefix: "Add ParticleEmitter/Trail effects to: " },
  { icon: "🏷️", title: "Add config table", prefix: "Pull all numbers/strings into a config table at the top of: " },
  { icon: "🧠", title: "Suggest improvements", prefix: "Suggest 5 improvements I could make to: " },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onInsertPrompt: (text: string) => void;
  onSendPrompt: (text: string) => void;
  settings: BloxieSettings;
  onSettingsChange: (s: BloxieSettings) => void;
};

type Tab = "templates" | "boosters" | "tools" | "settings";

export default function FeaturesPanel({ open, onClose, onInsertPrompt, onSendPrompt, settings, onSettingsChange }: Props) {
  const [tab, setTab] = useState<Tab>("templates");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof BloxieSettings>(k: K, v: BloxieSettings[K]) => {
    onSettingsChange({ ...settings, [k]: v });
  };

  const filteredTpl = TEMPLATES.filter(
    (t) => !query.trim() || (t.title + " " + t.prompt + " " + t.cat).toLowerCase().includes(query.toLowerCase())
  );
  const filteredBoost = BOOSTERS.filter(
    (b) => !query.trim() || b.title.toLowerCase().includes(query.toLowerCase())
  );

  // Mini tools
  const genUuid = () => {
    const u = crypto.randomUUID();
    navigator.clipboard.writeText(u);
    toast.success("UUID copied: " + u.slice(0, 8) + "…");
  };
  const genColor = () => {
    const r = Math.floor(Math.random() * 256), g = Math.floor(Math.random() * 256), b = Math.floor(Math.random() * 256);
    const lua = `Color3.fromRGB(${r}, ${g}, ${b})`;
    navigator.clipboard.writeText(lua);
    toast.success("Copied: " + lua);
  };
  const genVector = () => {
    const v = `Vector3.new(${(Math.random() * 100 - 50).toFixed(1)}, ${(Math.random() * 50).toFixed(1)}, ${(Math.random() * 100 - 50).toFixed(1)})`;
    navigator.clipboard.writeText(v); toast.success("Copied: " + v);
  };
  const genCFrame = () => { const c = `CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(45), 0)`; navigator.clipboard.writeText(c); toast.success("Copied"); };
  const genSeed = () => { const s = String(Date.now()); navigator.clipboard.writeText(s); toast.success("Seed: " + s); };
  const genHex = () => { const h = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"); navigator.clipboard.writeText(h); toast.success("Hex: " + h); };
  const luaSnippet = (label: string, code: string) => () => { navigator.clipboard.writeText(code); toast.success("Copied: " + label); };

  const TOOLS = [
    { icon: "🆔", title: "Random UUID", run: genUuid },
    { icon: "🎨", title: "Random Color3", run: genColor },
    { icon: "📍", title: "Random Vector3", run: genVector },
    { icon: "🧭", title: "Sample CFrame", run: genCFrame },
    { icon: "🌱", title: "Random seed", run: genSeed },
    { icon: "#️⃣", title: "Random hex color", run: genHex },
    { icon: "📋", title: "pcall wrapper", run: luaSnippet("pcall", `local ok, err = pcall(function()\n\t-- code here\nend)\nif not ok then warn(err) end`) },
    { icon: "🔁", title: "RunService loop", run: luaSnippet("RunService", `game:GetService("RunService").Heartbeat:Connect(function(dt)\n\t-- per frame\nend)`) },
    { icon: "📡", title: "RemoteEvent template", run: luaSnippet("RemoteEvent", `local RS = game:GetService("ReplicatedStorage")\nlocal ev = Instance.new("RemoteEvent", RS)\nev.Name = "MyEvent"\nev.OnServerEvent:Connect(function(player, ...)\n\t-- handle\nend)`) },
    { icon: "💾", title: "DataStore template", run: luaSnippet("DataStore", `local DSS = game:GetService("DataStoreService")\nlocal store = DSS:GetDataStore("MyStore")\nlocal ok, data = pcall(function() return store:GetAsync("key") end)`) },
    { icon: "👤", title: "PlayerAdded handler", run: luaSnippet("PlayerAdded", `game.Players.PlayerAdded:Connect(function(plr)\n\tplr.CharacterAdded:Connect(function(char)\n\t\t-- ready\n\tend)\nend)`) },
    { icon: "🛠️", title: "Tool boilerplate", run: luaSnippet("Tool", `local tool = script.Parent\ntool.Activated:Connect(function()\n\tlocal char = tool.Parent\n\tlocal hum = char:FindFirstChildOfClass("Humanoid")\n\t-- attack\nend)`) },
    { icon: "🪄", title: "Tween example", run: luaSnippet("Tween", `local TS = game:GetService("TweenService")\nlocal tween = TS:Create(part, TweenInfo.new(1), {Position = Vector3.new(0,10,0)})\ntween:Play()`) },
    { icon: "🛡️", title: "Admin allowlist", run: luaSnippet("admins", `local ADMINS = {123456789, 987654321} -- UserIds\nlocal function isAdmin(p) for _,id in ADMINS do if p.UserId==id then return true end end return false end`) },
    { icon: "🧮", title: "Lerp helper", run: luaSnippet("lerp", `local function lerp(a, b, t) return a + (b - a) * t end`) },
    { icon: "📏", title: "Distance check", run: luaSnippet("distance", `local d = (a.Position - b.Position).Magnitude`) },
    { icon: "⏱️", title: "Cooldown pattern", run: luaSnippet("cooldown", `local last = 0\nlocal CD = 1\nif tick() - last < CD then return end\nlast = tick()`) },
    { icon: "🧱", title: "Make a part", run: luaSnippet("part", `local p = Instance.new("Part")\np.Size = Vector3.new(4,1,4)\np.Anchored = true\np.Parent = workspace`) },
    { icon: "🔊", title: "Play a sound", run: luaSnippet("sound", `local s = Instance.new("Sound", workspace)\ns.SoundId = "rbxassetid://9118823104"\ns:Play(); s.Ended:Connect(function() s:Destroy() end)`) },
    { icon: "🎥", title: "Camera shake", run: luaSnippet("shake", `local cam = workspace.CurrentCamera\nfor i=1,10 do\n\tcam.CFrame = cam.CFrame * CFrame.new(math.random()*0.2-0.1, math.random()*0.2-0.1, 0)\n\ttask.wait()\nend`) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Features</h2>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">100+</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border">
          {([
            ["templates", "Templates", BookOpen],
            ["boosters", "Boosters", Wand2],
            ["tools", "Tools", Zap],
            ["settings", "Settings", SettingsIcon],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition ${
                tab === key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {(tab === "templates" || tab === "boosters") && (
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "templates" ? "Search 60 templates…" : "Search boosters…"}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {tab === "templates" && (
            <ul className="space-y-2">
              {filteredTpl.map((t) => (
                <li key={t.title}>
                  <div className="group rounded-xl border border-border bg-secondary/30 p-3 transition hover:border-primary">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.title}</span>
                          <span className="rounded-full bg-background/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{t.cat}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.prompt}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => { onSendPrompt(t.prompt); onClose(); }}
                            className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => { onInsertPrompt(t.prompt); onClose(); }}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary"
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {filteredTpl.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">No templates match "{query}"</p>}
            </ul>
          )}

          {tab === "boosters" && (
            <ul className="grid grid-cols-1 gap-2">
              {filteredBoost.map((b) => (
                <li key={b.title}>
                  <button
                    onClick={() => { onInsertPrompt(b.prefix); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:border-primary"
                  >
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
                  <button
                    onClick={t.run}
                    className="flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:border-primary"
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-semibold">{t.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === "settings" && (
            <div className="space-y-5">
              {/* Accent */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Accent color</label>
                <div className="flex gap-2">
                  {(["purple", "blue", "green", "pink", "orange"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => update("accent", c)}
                      className={`h-8 w-8 rounded-full border-2 transition ${settings.accent === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{
                        background:
                          c === "purple" ? "oklch(0.65 0.25 295)" :
                          c === "blue" ? "oklch(0.65 0.25 250)" :
                          c === "green" ? "oklch(0.7 0.22 145)" :
                          c === "pink" ? "oklch(0.7 0.25 350)" :
                          "oklch(0.7 0.22 50)",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Font size</label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => update("fontSize", s)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        settings.fontSize === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bubble style */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Message bubbles</label>
                <div className="flex gap-2">
                  {(["rounded", "square"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => update("bubbleStyle", s)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        settings.bubbleStyle === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {s === "rounded" ? "Rounded" : "Square"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1">
                {([
                  ["compact", "Compact spacing"],
                  ["autoScroll", "Auto-scroll on new message"],
                  ["sendOnEnter", "Send on Enter key"],
                  ["showTimestamps", "Show message timestamps"],
                  ["showWordCount", "Show word count in input"],
                  ["soundOnReply", "Sound when reply finishes"],
                  ["typingSound", "Typing keystroke sound"],
                  ["reduceMotion", "Reduce motion / animations"],
                  ["hideStarters", "Hide starter prompts on empty chat"],
                  ["bigButtons", "Bigger buttons (touch friendly)"],
                  ["highContrast", "High contrast mode"],
                  ["showLineNumbers", "Show line numbers in code blocks"],
                  ["autoCopyCode", "Auto-copy code blocks on click"],
                  ["confirmClear", "Confirm before clearing chat"],
                  ["showAvatars", "Show avatars next to messages"],
                  ["emojiReactions", "Enable emoji reactions on messages"],
                  ["pinHeader", "Pin header on scroll"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary/30">
                    <span className="text-sm">{label}</span>
                    <button
                      type="button"
                      onClick={() => update(key, !settings[key] as never)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition ${settings[key] ? "bg-primary" : "bg-secondary border border-border"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${settings[key] ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </label>
                ))}
              </div>

              <button
                onClick={() => { onSettingsChange(DEFAULT_SETTINGS); toast.success("Settings reset"); }}
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                Reset all settings
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 text-center text-[10px] text-muted-foreground">
          60 templates · 20 boosters · 20 tools · 20+ settings
        </div>
      </div>
    </div>
  );
}
