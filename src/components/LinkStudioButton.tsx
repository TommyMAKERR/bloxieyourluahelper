import { useState, useEffect } from "react";
import { Link2, X, Check, Copy, ScanLine } from "lucide-react";
import { toast } from "sonner";

export type StudioContext = {
  placeUrl: string;
  placeId: string;
  gameType: string;
  notes: string;
  snapshot: string; // JSON-ish game tree pasted from the scanner script
};

const STORAGE_KEY = "bloxie:studio-context";
const MAX_SNAPSHOT = 20000;

export function loadStudioContext(): StudioContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { snapshot: "", ...parsed };
  } catch {
    return null;
  }
}

function extractPlaceId(url: string): string {
  const m = url.match(/\/games\/(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(url.trim())) return url.trim();
  return "";
}

const SCANNER_SCRIPT = `-- 🔍 Bloxie Game Scanner (read-only, safe)
-- Paste this into Roblox Studio's Command Bar (View > Command Bar) and press Enter.
-- It prints a snapshot of your game tree. Copy the output and paste it into Bloxie.

local MAX_DEPTH = 4
local SERVICES = {"Workspace","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Lighting","SoundService"}

local function scan(inst, depth)
\tlocal node = { n = inst.Name, c = inst.ClassName }
\tif depth < MAX_DEPTH then
\t\tlocal kids = inst:GetChildren()
\t\tif #kids > 0 then
\t\t\tnode.k = {}
\t\t\tfor i, child in ipairs(kids) do
\t\t\t\tif i > 40 then table.insert(node.k, {n="...", c="(more)"}) break end
\t\t\t\ttable.insert(node.k, scan(child, depth + 1))
\t\t\tend
\t\tend
\tend
\treturn node
end

local out = { game = game.Name, tree = {} }
for _, name in ipairs(SERVICES) do
\tlocal s = game:FindFirstChild(name)
\tif s then table.insert(out.tree, scan(s, 0)) end
end

-- Pretty print
local function dump(t, indent)
\tindent = indent or ""
\tlocal name = t.n .. " [" .. t.c .. "]"
\tprint(indent .. name)
\tif t.k then
\t\tfor _, c in ipairs(t.k) do dump(c, indent .. "  ") end
\tend
end

print("=== BLOXIE SNAPSHOT START ===")
print("Game: " .. out.game)
for _, root in ipairs(out.tree) do dump(root, "") end
print("=== BLOXIE SNAPSHOT END ===")
`;

type Tab = "details" | "scan";

export default function LinkStudioButton({
  onChange,
}: {
  onChange?: (ctx: StudioContext | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [ctx, setCtx] = useState<StudioContext | null>(null);
  const [placeUrl, setPlaceUrl] = useState("");
  const [gameType, setGameType] = useState("");
  const [notes, setNotes] = useState("");
  const [snapshot, setSnapshot] = useState("");
  const [scriptCopied, setScriptCopied] = useState(false);

  useEffect(() => {
    const saved = loadStudioContext();
    if (saved) {
      setCtx(saved);
      setPlaceUrl(saved.placeUrl);
      setGameType(saved.gameType);
      setNotes(saved.notes);
      setSnapshot(saved.snapshot || "");
    }
  }, []);

  const copyScanner = async () => {
    await navigator.clipboard.writeText(SCANNER_SCRIPT);
    setScriptCopied(true);
    toast.success("Scanner copied! Paste into Studio's Command Bar 🔍");
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const save = () => {
    const trimmedUrl = placeUrl.trim().slice(0, 300);
    const trimmedType = gameType.trim().slice(0, 100);
    const trimmedNotes = notes.trim().slice(0, 1000);
    const trimmedSnap = snapshot.trim().slice(0, MAX_SNAPSHOT);

    if (!trimmedUrl && !trimmedType && !trimmedNotes && !trimmedSnap) {
      toast.error("Add at least one detail or paste a snapshot!");
      return;
    }

    const next: StudioContext = {
      placeUrl: trimmedUrl,
      placeId: extractPlaceId(trimmedUrl),
      gameType: trimmedType,
      notes: trimmedNotes,
      snapshot: trimmedSnap,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCtx(next);
    onChange?.(next);
    setOpen(false);
    toast.success(
      trimmedSnap
        ? "Game scanned! Bloxie now sees your tree 👀"
        : "Studio linked! Bloxie will tailor scripts 🎮",
    );
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCtx(null);
    setPlaceUrl("");
    setGameType("");
    setNotes("");
    setSnapshot("");
    onChange?.(null);
    toast.success("Studio unlinked");
  };

  const linked = !!ctx && (!!ctx.placeUrl || !!ctx.gameType || !!ctx.notes || !!ctx.snapshot);
  const hasSnapshot = !!ctx?.snapshot;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          linked
            ? "border-primary bg-primary/10 text-primary shadow-neon"
            : "border-border bg-secondary/40 text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        {hasSnapshot ? <ScanLine className="h-4 w-4" /> : linked ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {hasSnapshot ? "Game Scanned" : linked ? "Studio Linked" : "Link Roblox Studio"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-card"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Link your Roblox game</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bloxie can't connect directly to Studio, but you can give it a read-only snapshot.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl bg-secondary/40 p-1">
              <TabBtn active={tab === "details"} onClick={() => setTab("details")}>
                Game details
              </TabBtn>
              <TabBtn active={tab === "scan"} onClick={() => setTab("scan")}>
                <ScanLine className="mr-1 inline h-3.5 w-3.5" /> Scan game
              </TabBtn>
            </div>

            {tab === "details" && (
              <div className="space-y-4">
                <Field label="Place URL or ID" hint="e.g. https://www.roblox.com/games/1234567890/My-Game">
                  <input
                    value={placeUrl}
                    onChange={(e) => setPlaceUrl(e.target.value)}
                    maxLength={300}
                    placeholder="Paste your Roblox place link..."
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>

                <Field label="Game type" hint="What kind of game is it?">
                  <input
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    maxLength={100}
                    placeholder="Obby, Tycoon, Simulator, FPS, RPG..."
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>

                <Field label="Quick notes" hint="Anything important Bloxie should know">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g. I want this to be PvP, max 8 players, kid-friendly..."
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">{notes.length}/1000</div>
                </Field>
              </div>
            )}

            {tab === "scan" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-accent">👀 How this works</p>
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
                    <li>Copy the scanner script below.</li>
                    <li>In Roblox Studio, open <strong>View → Command Bar</strong>.</li>
                    <li>Paste it, press <strong>Enter</strong>.</li>
                    <li>Copy everything between <code>SNAPSHOT START</code> and <code>SNAPSHOT END</code> from the Output window.</li>
                    <li>Paste it into the box below.</li>
                  </ol>
                  <p className="mt-2">It only <strong>reads</strong> your game — nothing is changed or uploaded anywhere except this browser.</p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-semibold">1. Scanner script</label>
                    <button
                      onClick={copyScanner}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/25"
                    >
                      {scriptCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {scriptCopied ? "Copied" : "Copy script"}
                    </button>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-xl border border-border bg-[oklch(0.13_0.04_270)] p-3 font-mono text-[11px] leading-relaxed">
                    {SCANNER_SCRIPT}
                  </pre>
                </div>

                <Field label="2. Paste the snapshot output" hint="Everything between SNAPSHOT START and SNAPSHOT END">
                  <textarea
                    value={snapshot}
                    onChange={(e) => setSnapshot(e.target.value)}
                    maxLength={MAX_SNAPSHOT}
                    rows={8}
                    placeholder={"=== BLOXIE SNAPSHOT START ===\nGame: My Awesome Place\nWorkspace [Workspace]\n  Baseplate [Part]\n  ..."}
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                  />
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">
                    {snapshot.length}/{MAX_SNAPSHOT}
                  </div>
                </Field>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              {linked && (
                <button
                  onClick={clear}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  Unlink
                </button>
              )}
              <button
                onClick={save}
                className="ml-auto rounded-xl gradient-hero px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Save & link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
