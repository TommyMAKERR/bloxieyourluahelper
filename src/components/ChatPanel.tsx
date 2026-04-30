import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, Copy, Check, Bot, User } from "lucide-react";
import { toast } from "sonner";
import LinkStudioButton, { loadStudioContext, type StudioContext } from "./LinkStudioButton";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  { icon: "🛡️", title: "Admin Panel", prompt: "Make me a full admin panel with kick, ban, teleport, fly, and give-tools commands. Use a UserId allowlist." },
  { icon: "🧱", title: "Building Tool", prompt: "Create a building tool that lets me place colored bricks where I click, with size and color GUI sliders." },
  { icon: "💰", title: "Leaderstats + DataStore", prompt: "Set up leaderstats (Coins + Wins) that save and load with DataStoreService, including auto-save every 60s." },
  { icon: "⚔️", title: "Sword Tool", prompt: "Make a classic sword tool with swing animation, damage, hit detection, and cooldown." },
  { icon: "🎁", title: "Daily Reward", prompt: "Build a daily login reward GUI with 7-day streak and DataStore tracking." },
  { icon: "🚪", title: "VIP Door", prompt: "Make a door that only opens for players who own a specific gamepass." },
];

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const code = String(children ?? "").replace(/\n$/, "");
  const lang = className?.replace("language-", "") || "lua";

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied! Paste it into Roblox Studio 🎮");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-[oklch(0.13_0.04_270)] shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lua-chat`;
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) {
        toast.error("Slow down! Too many requests — try again in a sec.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits ran out. Add funds in workspace usage.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("Bloxie hiccupped. Try again!");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 rounded-3xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-card md:p-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-hero shadow-neon">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Bloxie</h2>
          <p className="text-xs text-muted-foreground">Your Roblox Lua scripting buddy 🎮</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Online
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-hero shadow-neon">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">What are we building today?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pick a starter or describe your idea — I'll write the Lua.</p>
            </div>
            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p.title}
                  onClick={() => send(p.prompt)}
                  className="group flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-left transition hover:border-primary hover:bg-secondary hover:shadow-neon"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-semibold group-hover:text-primary">{p.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{p.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    m.role === "user" ? "bg-accent text-accent-foreground" : "gradient-hero text-primary-foreground"
                  }`}
                >
                  {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/60 text-foreground"
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:text-primary prose-strong:text-primary prose-code:text-accent prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children }: any) {
                          if (inline) {
                            return (
                              <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            );
                          }
                          return <CodeBlock className={className}>{children}</CodeBlock>;
                        },
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-secondary/60 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 rounded-2xl border border-border bg-secondary/40 p-2 focus-within:border-primary focus-within:shadow-neon transition"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for any Roblox script... e.g. 'speed gamepass'"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 rounded-xl gradient-hero px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
