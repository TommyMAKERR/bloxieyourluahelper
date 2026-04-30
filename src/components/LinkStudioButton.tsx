import { useState, useEffect } from "react";
import { Link2, X, Check } from "lucide-react";
import { toast } from "sonner";

export type StudioContext = {
  placeUrl: string;
  placeId: string;
  gameType: string;
  notes: string;
};

const STORAGE_KEY = "bloxie:studio-context";

export function loadStudioContext(): StudioContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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

export default function LinkStudioButton({
  onChange,
}: {
  onChange?: (ctx: StudioContext | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<StudioContext | null>(null);
  const [placeUrl, setPlaceUrl] = useState("");
  const [gameType, setGameType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = loadStudioContext();
    if (saved) {
      setCtx(saved);
      setPlaceUrl(saved.placeUrl);
      setGameType(saved.gameType);
      setNotes(saved.notes);
    }
  }, []);

  const save = () => {
    // Basic validation
    const trimmedUrl = placeUrl.trim().slice(0, 300);
    const trimmedType = gameType.trim().slice(0, 100);
    const trimmedNotes = notes.trim().slice(0, 1000);

    if (!trimmedUrl && !trimmedType && !trimmedNotes) {
      toast.error("Add at least one detail about your game!");
      return;
    }

    const placeId = extractPlaceId(trimmedUrl);
    const next: StudioContext = {
      placeUrl: trimmedUrl,
      placeId,
      gameType: trimmedType,
      notes: trimmedNotes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCtx(next);
    onChange?.(next);
    setOpen(false);
    toast.success("Studio linked! Bloxie will tailor scripts to your game 🎮");
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCtx(null);
    setPlaceUrl("");
    setGameType("");
    setNotes("");
    onChange?.(null);
    toast.success("Studio unlinked");
  };

  const linked = !!ctx && (!!ctx.placeUrl || !!ctx.gameType || !!ctx.notes);

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
        {linked ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {linked ? "Studio Linked" : "Link Roblox Studio"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Link your Roblox game</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bloxie can't connect directly to Studio (Roblox doesn't allow it),
                  but tell me about your game and every script I write will be tailored to it.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

              <Field label="What's already in your game?" hint="Tools, GUIs, folders, anything important">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="e.g. I have a 'Coins' leaderstat, a Tools folder in ReplicatedStorage, and a ShopGUI in StarterGui..."
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{notes.length}/1000</div>
              </Field>
            </div>

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
