import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, User as UserIcon, Pencil, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setNickname(null);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const fallback =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "you";
        setNickname(data?.display_name || fallback);
      });
  }, [user]);

  const saveNickname = async () => {
    if (!user) return;
    const value = draft.trim();
    if (!value) {
      toast.error("Nickname can't be empty");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: value }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNickname(value);
    setEditing(false);
    toast.success(`Got it — calling you ${value} from now on 🎮`);
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-xl bg-secondary/40" />;
  }

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex items-center gap-1.5 rounded-xl gradient-hero px-3 py-2 text-xs font-semibold text-primary-foreground shadow-neon transition hover:opacity-90"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const display = nickname ?? "…";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-1 pl-2">
      {avatar ? (
        <img src={avatar} alt={display} className="h-6 w-6 rounded-lg object-cover" />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20">
          <UserIcon className="h-3.5 w-3.5 text-primary" />
        </div>
      )}

      {editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveNickname();
              if (e.key === "Escape") setEditing(false);
            }}
            maxLength={24}
            placeholder="nickname"
            className="w-24 rounded-md bg-background/60 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={saveNickname}
            disabled={saving}
            title="Save"
            className="rounded-md p-1 text-primary hover:bg-secondary"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditing(false)}
            title="Cancel"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col leading-tight pr-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Nickname</span>
            <span className="text-xs font-semibold -mt-0.5">{display}</span>
          </div>
          <button
            onClick={() => {
              setDraft(nickname || "");
              setEditing(true);
            }}
            title="Change nickname"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={async () => {
          await signOut();
          toast.success("Signed out 👋");
        }}
        title="Sign out"
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary hover:text-primary"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
