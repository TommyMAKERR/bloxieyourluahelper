import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, Trash2, History, Search, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  refreshKey: number;
};

export default function ConversationSidebar({ onClose, currentId, onSelect, onNew, refreshKey }: Props) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!user) { setConvs([]); return; }
    setLoading(true);
    supabase
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setConvs(data as Conversation[]);
        setLoading(false);
      });
  }, [user, refreshKey]);

  const filtered = useMemo(() => {
    if (!query.trim()) return convs;
    const q = query.toLowerCase();
    return convs.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [convs, query]);

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete"); return; }
    await supabase.from("messages").delete().eq("conversation_id", id);
    setConvs((c) => c.filter((x) => x.id !== id));
    if (currentId === id) onNew();
    toast.success("Chat deleted");
  };

  const startEdit = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditValue(c.title || "");
  };

  const saveEdit = async (id: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const newTitle = editValue.trim() || "Untitled";
    const { error } = await supabase.from("conversations").update({ title: newTitle }).eq("id", id);
    if (error) { toast.error("Couldn't rename"); return; }
    setConvs((c) => c.map((x) => (x.id === id ? { ...x, title: newTitle } : x)));
    setEditingId(null);
    toast.success("Renamed");
  };

  return (
    <aside className="flex h-full w-56 sm:w-64 md:w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-card/40 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <History className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Your chats</span>
        </div>
        <div className="p-2">
          <button
            onClick={() => { onNew(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
        </div>
        {user && (
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats…"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {!user && (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              Sign in to save your chats and see them here. You can still chat without logging in!
            </p>
          )}
          {user && loading && <p className="px-2 py-4 text-xs text-muted-foreground">Loading…</p>}
          {user && !loading && convs.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground">No chats yet. Send a message to start one!</p>
          )}
          {user && !loading && convs.length > 0 && filtered.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground">No chats match "{query}".</p>
          )}
          <ul className="space-y-1">
            {filtered.map((c) => (
              <li key={c.id}>
                {editingId === c.id ? (
                  <form
                    onSubmit={(e) => saveEdit(c.id, e)}
                    className="flex items-center gap-1 rounded-xl bg-secondary px-2 py-1.5"
                  >
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                    <button type="submit" className="rounded p-1 text-primary hover:bg-background/40">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:bg-background/40">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : (
                  <div
                    onClick={() => { onSelect(c.id); onClose(); }}
                    className={`group flex w-full cursor-pointer items-center gap-1 rounded-xl px-3 py-2 text-left text-sm transition ${
                      currentId === c.id
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="flex-1 truncate">{c.title || "Untitled"}</span>
                    <span
                      onClick={(e) => startEdit(c, e)}
                      className="rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:bg-primary/20 hover:text-primary"
                      title="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                    <span
                      onClick={(e) => remove(c.id, e)}
                      className="rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
