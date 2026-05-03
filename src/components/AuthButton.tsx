import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();

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

  const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "you";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-1 pl-3">
      <UserIcon className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold">{name}</span>
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
