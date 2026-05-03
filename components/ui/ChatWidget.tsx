"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  listings?: Listing[];
}

interface Listing {
  id: string;
  title: string;
  price: number;
  area_m2: number;
  rooms: number | null;
  action: string;
  wilaya: string | null;
  district: string | null;
  primary_image_url: string | null;
  ai_signal: string | null;
}

const QUICK_PROMPTS = [
  "Appartements à Tunis",
  "Villas < 500K TND",
  "Comment estimer mon bien ?",
  "Locations à Sousse",
];

const SIGNAL: Record<string, { label: string; cls: string }> = {
  undervalued: { label: "Sous-évalué", cls: "text-emerald-600" },
  overvalued:  { label: "Sur-évalué",  cls: "text-red-500" },
  fair:        { label: "Juste prix",  cls: "text-amber-500" },
};

function fmt(price: number, action: string) {
  const n = price >= 1000 ? `${Math.round(price / 1000)}K` : `${price}`;
  return `${n} TND${action === "location" ? "/mois" : ""}`;
}

function Card({ l }: { l: Listing }) {
  const sig = l.ai_signal ? SIGNAL[l.ai_signal] : null;
  return (
    <Link href={`/listings/${l.id}`} className="block">
      <div className="flex gap-2 bg-white rounded-xl overflow-hidden border border-[#D4AF64]/20 hover:border-[#D4AF64]/60 hover:shadow-md transition-all group">
        <div className="w-[72px] h-[72px] flex-shrink-0 bg-[#1B2B3A]/10 overflow-hidden">
          {l.primary_image_url
            ? <img src={l.primary_image_url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
          }
        </div>
        <div className="flex-1 p-2 min-w-0">
          <p className="text-xs font-semibold text-[#1B2B3A] truncate">{l.title}</p>
          <p className="text-[11px] text-[#9A8878]">{l.district || l.wilaya}</p>
          <p className="text-sm font-bold text-[#D4AF64] mt-0.5">{fmt(l.price, l.action)}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-[#1B2B3A]/60">{l.area_m2} m²</span>
            {l.rooms && <span className="text-[11px] text-[#1B2B3A]/60">{l.rooms}p</span>}
            {sig && <span className={`text-[11px] font-medium ${sig.cls}`}>• {sig.label}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Dots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2.5 bg-white rounded-2xl rounded-tl-none border border-[#D4AF64]/10 w-fit shadow-sm">
      {[0, 1, 2].map(i => (
        <span key={i} style={{ animationDelay: `${i * 0.15}s` }}
          className="w-1.5 h-1.5 bg-[#1B2B3A]/40 rounded-full animate-bounce" />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUnread(false); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Je n'ai pas compris, pouvez-vous reformuler ?",
        listings: data.listings?.length ? data.listings : undefined,
      }]);
      if (!open) setUnread(true);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  }

  const md = (t: string) =>
    t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir Hestia IA"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1B2B3A] text-white pl-3 pr-4 py-3 rounded-full shadow-2xl hover:bg-[#243647] transition-all duration-200 animate-pulse-gold"
        style={{ boxShadow: "0 8px 32px rgba(27,43,58,0.45)" }}
      >
        <span className="text-base">✨</span>
        <span className="text-sm font-semibold tracking-wide">Hestia IA</span>
        {unread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF64] rounded-full animate-bounce" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] right-6 z-50 w-80 rounded-2xl overflow-hidden flex flex-col"
          style={{
            height: 490,
            background: "#FDFAF6",
            border: "1px solid rgba(212,175,100,0.25)",
            boxShadow: "0 24px 64px rgba(27,43,58,0.28)",
            animation: "chat-slide-up 0.22s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#1B2B3A] flex-shrink-0">
            <span className="text-lg">🏛</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">Hestia IA</p>
              <p className="text-[11px] text-[#D4AF64]/80 mt-0.5">Assistant immobilier</p>
            </div>
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/50">En ligne</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/50 hover:text-white text-xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {msgs.length === 0 && (
              <div className="animate-fade-up space-y-3">
                <div className="bg-white border border-[#D4AF64]/10 rounded-2xl rounded-tl-none px-3 py-2.5 shadow-sm">
                  <p className="text-xs text-[#1B2B3A]/80 leading-relaxed">
                    Bonjour 👋 Je suis <strong>Hestia IA</strong>, votre assistant immobilier. Comment puis-je vous aider ?
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-[11px] bg-white border border-[#D4AF64]/30 text-[#1B2B3A] px-2.5 py-1.5 rounded-full hover:bg-[#D4AF64]/10 hover:border-[#D4AF64]/60 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] bg-[#1B2B3A] text-white px-3 py-2 rounded-2xl rounded-tr-none text-xs leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] space-y-2">
                    {m.content && (
                      <div
                        className="bg-white border border-[#D4AF64]/10 px-3 py-2.5 rounded-2xl rounded-tl-none text-xs text-[#1B2B3A]/80 leading-relaxed shadow-sm"
                        dangerouslySetInnerHTML={{ __html: md(m.content) }}
                      />
                    )}
                    {m.listings && m.listings.length > 0 && (
                      <div className="space-y-1.5">
                        {m.listings.slice(0, 3).map(l => <Card key={l.id} l={l} />)}
                        {m.listings.length > 3 && (
                          <Link href="/listings" className="block text-center text-xs text-[#D4AF64] font-medium py-1.5 hover:underline">
                            Voir {m.listings.length - 3} autres résultats →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-up">
                <Dots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-2.5 bg-white border-t border-[#D4AF64]/10 flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Votre message…"
              className="flex-1 text-xs bg-[#F7F3EE] rounded-full px-3 py-2 outline-none text-[#1B2B3A] placeholder:text-[#9A8878] focus:ring-1 focus:ring-[#D4AF64]/40"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-[#1B2B3A] text-white flex items-center justify-center text-sm disabled:opacity-40 hover:bg-[#243647] transition-colors flex-shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
