import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, Copy, Check, Bot, User, Laptop, Image as ImageIcon, Mic, X, Hammer, Lightbulb, MessageCircle, Square, RotateCcw, Download, Eraser } from "lucide-react";
import { toast } from "sonner";
import LinkStudioButton, { loadStudioContext, type StudioContext } from "./LinkStudioButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ConversationSidebar from "./ConversationSidebar";

const LITE_KEY = "bloxie:studio-lite";
const MODE_KEY = "bloxie:mode";

type Msg = { role: "user" | "assistant"; content: string; image?: string };
type Mode = "build" | "plan" | "chat";

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
  const [studio, setStudio] = useState<StudioContext | null>(null);
  const [liteMode, setLiteMode] = useState(false);
  const [mode, setMode] = useState<Mode>("build");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setStudio(loadStudioContext());
    if (typeof window !== "undefined") {
      setLiteMode(localStorage.getItem(LITE_KEY) === "1");
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === "plan" || savedMode === "build" || savedMode === "chat") setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (!user) { setNickname(null); return; }
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
          null;
        setNickname(data?.display_name || fallback);
      });
  }, [user]);

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setPendingImage(null);
    setInput("");
  };

  const selectConversation = async (id: string) => {
    setConversationId(id);
    const { data, error } = await supabase
      .from("messages")
      .select("role,content,image_url")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) { toast.error("Couldn't load chat"); return; }
    setMessages(
      (data || []).map((r: any) => ({
        role: r.role as "user" | "assistant",
        content: r.content as string,
        image: r.image_url || undefined,
      }))
    );
  };

  const persistMessage = async (
    convId: string,
    role: "user" | "assistant",
    content: string,
    image?: string | null
  ) => {
    if (!user) return;
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role,
      content,
      image_url: image || null,
    });
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);
  };

  const ensureConversation = async (firstUserText: string): Promise<string | null> => {
    if (!user) return null;
    if (conversationId) return conversationId;
    const title = (firstUserText.trim().slice(0, 60) || "New chat");
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) { console.error(error); return null; }
    setConversationId(data.id);
    setSidebarRefresh((k) => k + 1);
    return data.id;
  };


  const toggleLite = () => {
    setLiteMode((v) => {
      const nv = !v;
      try { localStorage.setItem(LITE_KEY, nv ? "1" : "0"); } catch {}
      toast.success(nv ? "Studio Lite mode ON — browser-friendly scripts only 💻" : "Studio Lite mode OFF");
      return nv;
    });
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem(MODE_KEY, m); } catch {}
    const labels: Record<Mode, string> = {
      build: "Build mode — I'll write the script right away 🔨",
      plan: "Plan mode — I'll ask questions first 💡",
      chat: "Chat mode — normal AI, ask me anything 💬",
    };
    toast.success(labels[m]);
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const exportChat = () => {
    if (messages.length === 0) { toast.error("Nothing to export yet"); return; }
    const text = messages
      .map((m) => `### ${m.role === "user" ? "You" : "Bloxie"}\n\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloxie-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported!");
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (!confirm("Clear this chat? This won't delete saved chats in the sidebar.")) return;
    setMessages([]);
    setPendingImage(null);
    setInput("");
  };

  const regenerate = () => {
    // Find last user message, drop any assistant reply after it, resend
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const lastUser = messages[idx];
    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    // small delay to let state apply
    setTimeout(() => send(lastUser.content, lastUser.image ?? null), 0);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too big — keep it under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(String(reader.result));
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser. Try Chrome!");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput((prev) => (finalText || interim ? (finalText || interim) : prev));
    };
    rec.onerror = (e: any) => {
      console.error("speech error", e);
      toast.error("Mic error — check browser permissions");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
    toast.success("Listening… speak now 🎤");
  };

  const send = async (text: string, imageOverride?: string | null) => {
    const image = imageOverride !== undefined ? imageOverride : pendingImage;
    if ((!text.trim() && !image) || loading) return;
    const userMsg: Msg = { role: "user", content: text || "(image attached)", image: image || undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    // Persist user message (creates conversation on first send)
    const convId = await ensureConversation(text || "Image chat");
    if (convId) {
      await persistMessage(convId, "user", userMsg.content, userMsg.image);
    }

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lua-chat`;
    let assistantSoFar = "";

    const hasCtx = studio && (studio.placeUrl || studio.gameType || studio.notes || studio.snapshot);
    const systemMessages: { role: "system"; content: string }[] = [];

    if (nickname) {
      systemMessages.push({
        role: "system",
        content: `The user's chosen nickname is "${nickname}". ALWAYS address them as "${nickname}" in your replies (e.g. greetings, mentions). Never call them anything else, never use their email, and never make up a different name.`,
      });
    }


    systemMessages.push({
      role: "system",
      content: mode === "plan"
        ? `CURRENT MODE: PLAN. Do NOT write a full script yet. Instead, briefly confirm the goal in 1 sentence, then ask 2-4 short clarifying questions (bullet list) about what the user actually wants — features, edge cases, where it goes, who it's for. Only after the user answers should you write code on the next turn. Keep it friendly and short.`
        : `CURRENT MODE: BUILD. Write the working script(s) right away with full implementation, locations, and step-by-step instructions. Don't stall with extra questions unless something is truly blocking.`,
    });

    systemMessages.push({
      role: "system",
      content: liteMode
        ? `STUDIO LITE = ON. Browser-based Studio: NO Command Bar, NO plugins, NO Output. Only Explorer-based steps (right-click → Insert → Script/LocalScript/ModuleScript) inside ServerScriptService, StarterPlayerScripts, StarterGui, ReplicatedStorage, Tools, or Parts. Avoid Terrain editor, plugins, MeshPart file imports.`
        : `STUDIO LITE = OFF. Full desktop Studio available — Command Bar, plugins, Output, Terrain editor are all fine to suggest.`,
    });

    if (hasCtx) {
      systemMessages.push({
        role: "system",
        content: `The user has linked their Roblox game. Tailor scripts to it and reference REAL instances from the game tree.
${studio!.placeUrl ? `- Place URL: ${studio!.placeUrl}` : ""}
${studio!.placeId ? `- Place ID: ${studio!.placeId}` : ""}
${studio!.gameType ? `- Game type: ${studio!.gameType}` : ""}
${studio!.notes ? `- Notes: ${studio!.notes}` : ""}
${studio!.snapshot ? `\n--- GAME TREE SNAPSHOT ---\n${studio!.snapshot}\n--- END ---` : ""}`,
      });
    }

    // Build user message — multimodal if image attached
    const apiUserMessages = next.map((m) => {
      if (m.role === "user" && m.image) {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: m.image } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const payloadMessages = [...systemMessages, ...apiUserMessages];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (resp.status === 429) { toast.error("Slow down! Try again in a sec."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits ran out. Add funds in workspace usage."); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Bloxie hiccupped. Try again!"); setLoading(false); return; }

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
          if (json === "[DONE]") { streamDone = true; break; }
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
      if (convId && assistantSoFar) {
        await persistMessage(convId, "assistant", assistantSoFar);
        setSidebarRefresh((k) => k + 1);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 rounded-3xl border border-border bg-card/60 backdrop-blur-sm shadow-card overflow-hidden">
      <ConversationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentId={conversationId}
        onSelect={selectConversation}
        onNew={newChat}
        refreshKey={sidebarRefresh}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 min-w-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-hero shadow-neon">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Bloxie</h2>
          <p className="text-xs text-muted-foreground">Your Roblox Lua scripting buddy 🎮</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Build / Plan toggle */}
          <div className="flex rounded-xl border border-border bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => switchMode("build")}
              title="Build mode — write the script right away"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                mode === "build" ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Hammer className="h-3.5 w-3.5" />
              Build
            </button>
            <button
              type="button"
              onClick={() => switchMode("plan")}
              title="Plan mode — ask clarifying questions first"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                mode === "plan" ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Plan
            </button>
          </div>
          <button
            type="button"
            onClick={toggleLite}
            title="Studio Lite mode — browser/Chromebook friendly scripts only"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              liteMode
                ? "border-primary bg-primary/15 text-primary shadow-neon"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span className="hidden sm:inline">Studio Lite</span>
            <span className={`h-2 w-2 rounded-full ${liteMode ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
          </button>
          <LinkStudioButton onChange={setStudio} />
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
              <p className="mt-1 text-sm text-muted-foreground">Pick a starter, attach a screenshot, or describe your idea.</p>
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
                  {m.image && (
                    <img src={m.image} alt="attachment" className="mb-2 max-h-64 rounded-lg border border-border" />
                  )}
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

      {pendingImage && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-2">
          <img src={pendingImage} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
          <span className="text-xs text-muted-foreground flex-1">Image attached — send to ask Bloxie about it</span>
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 rounded-2xl border border-border bg-secondary/40 p-2 focus-within:border-primary focus-within:shadow-neon transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach an image (screenshot of your game, error, GUI mockup…)"
          className="flex items-center justify-center rounded-xl px-2.5 text-muted-foreground transition hover:bg-secondary hover:text-primary"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleMic}
          title="Speak instead of typing"
          className={`flex items-center justify-center rounded-xl px-2.5 transition ${
            listening ? "bg-primary text-primary-foreground animate-pulse" : "text-muted-foreground hover:bg-secondary hover:text-primary"
          }`}
        >
          <Mic className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "plan" ? "Describe your idea — I'll ask questions first…" : "Ask for any Roblox script…"}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !pendingImage)}
          className="flex items-center gap-2 rounded-xl gradient-hero px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
      </div>
    </div>
  );
}
