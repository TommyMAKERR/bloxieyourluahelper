import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNickname(null);
      return;
    }
    // Prefer profile.display_name (synced from Google full_name on signup)
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const fromMeta =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "you";
        setNickname(data?.display_name || fromMeta);
      });
  }, [user]);

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
      <div className="flex flex-col leading-tight pr-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Nickname</span>
        <span className="text-xs font-semibold -mt-0.5">{display}</span>
      </div>
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
