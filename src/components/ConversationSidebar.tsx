import { useEffect, useState } from "react";
import { MessageSquarePlus, Trash2, X, History } from "lucide-react";
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

export default function ConversationSidebar({ open, onClose, currentId, onSelect, onNew, refreshKey }: Props) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

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

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete"); return; }
    // also delete messages (no cascade configured)
    await supabase.from("messages").delete().eq("conversation_id", id);
    setConvs((c) => c.filter((x) => x.id !== id));
    if (currentId === id) onNew();
    toast.success("Chat deleted");
  };

  if (!user) return null;

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
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {loading && <p className="px-2 py-4 text-xs text-muted-foreground">Loading…</p>}
            {!loading && convs.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground">No chats yet. Send a message to start one!</p>
            )}
            <ul className="space-y-1">
              {convs.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { onSelect(c.id); onClose(); }}
                    className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      currentId === c.id
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="flex-1 truncate">{c.title || "Untitled"}</span>
                    <span
                      onClick={(e) => remove(c.id, e)}
                      className="rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
      </div>
    </aside>
  );
}
