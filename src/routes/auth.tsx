import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Bot, Mail, Lock, Loader2, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Bloxie" },
      { name: "description", content: "Sign in to Bloxie to save your Roblox Lua chats and projects." },
    ],
  }),
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) nav({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm 📧");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 🎮");
      }
    } catch (err: any) {
      toast.error(err?.message || "Auth error");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(`${provider} sign-in failed`);
        setBusy(false);
        return;
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err?.message || `${provider} sign-in error`);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <Toaster theme="dark" position="top-center" richColors />
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-card">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-neon">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Join Bloxie"}</h1>
          <p className="text-sm text-muted-foreground text-center">
            {mode === "signin" ? "Sign in to keep your chats saved" : "Create an account to save your scripting projects"}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <button
            onClick={() => oauth("google")}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:bg-secondary disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <button
            onClick={() => oauth("apple")}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            <Apple className="h-4 w-4 fill-current" />
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 focus-within:border-primary">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ chars)"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl gradient-hero px-4 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account?" : "Already have one?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Back home</Link>
        </p>
      </div>
    </div>
  );
}
