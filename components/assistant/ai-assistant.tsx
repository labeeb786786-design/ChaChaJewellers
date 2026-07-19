"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

import { SITE } from "@/lib/site";
import goldData from "@/lib/data/gold-prices.json";
import { cn } from "@/lib/utils";

/*
 * AI Jewellery Assistant — DEMO / scripted.
 * This is NOT a real LLM. It keyword-matches against a small script and can
 * navigate the user to the relevant page. For production this would be wired
 * to a real assistant (e.g. Claude) with tools for live prices & bookings.
 */

type Msg = { role: "user" | "bot"; text: string; action?: () => void; actionLabel?: string };

const QUICK_PROMPTS = [
  "Do you buy broken gold?",
  "What's today's gold price?",
  "Can you resize rings?",
  "Show me bangles",
  "Book an appointment",
];

function buildReply(
  input: string
): { text: string; navigateTo?: string; actionLabel?: string } {
  const q = input.toLowerCase();

  if (/(broken|scrap|old|sell|buy).*(gold)|gold.*(broken|scrap|sell)/.test(q)) {
    return {
      text: "Yes — we buy broken, unwanted and scrap gold, and offer honest same-day valuations with no obligation. Bring it in and we'll weigh and test it in front of you.",
      navigateTo: "/sell-your-gold",
      actionLabel: "Sell Your Gold →",
    };
  }
  if (/(price|rate|cost).*(gold|22|24)|gold.*(price|rate|today)|today.?s? gold/.test(q)) {
    const { gold22k, gold24k } = goldData.current;
    return {
      text: `Today's reference gold prices are approximately £${gold22k.toFixed(
        2
      )}/g for 22k and £${gold24k.toFixed(
        2
      )}/g for 24k (GBP). These are indicative — pop in or call ${SITE.phone} for a firm quote.`,
      navigateTo: "/precious-metals",
      actionLabel: "See Live Prices →",
    };
  }
  if (/(resize|resizing|size|fit).*(ring)|ring.*(resize|size|fit)|repair|clean|engrav/.test(q)) {
    return {
      text: "Absolutely. We resize rings and also handle repairs, cleaning, engraving and bespoke commissions in-house — many while you wait.",
      navigateTo: "/services",
      actionLabel: "View Services →",
    };
  }
  if (/(bangle|bhalia|kara)/.test(q)) {
    return {
      text: "Lovely choice — our bangles range from classic patterned bhalia to kara sets and delicate filigree in 22k gold. Let me show you.",
      navigateTo: "/shop?category=bangles",
      actionLabel: "Browse Bangles →",
    };
  }
  if (/(ring)/.test(q)) {
    return { text: "We have engagement, signet and bespoke rings. Here's the collection.", navigateTo: "/shop?category=rings", actionLabel: "Browse Rings →" };
  }
  if (/(necklace|set|bridal|kundan|polki)/.test(q)) {
    return { text: "Our bridal and necklace sets include kundan, polki and temple styles. Take a look.", navigateTo: "/shop?category=necklace-sets", actionLabel: "Browse Sets →" };
  }
  if (/(earring|jhumka|chandbali|stud)/.test(q)) {
    return { text: "From jhumkas to chandbalis and everyday studs — here are our earrings.", navigateTo: "/shop?category=earrings", actionLabel: "Browse Earrings →" };
  }
  if (/(book|appointment|visit|consult|reserve)/.test(q)) {
    return {
      text: "Happy to help — you can book a private appointment or bridal consultation with us. I'll take you to the booking page.",
      navigateTo: "/appointments",
      actionLabel: "Book Appointment →",
    };
  }
  if (/(hour|open|time|when).*(open)|opening|what time/.test(q)) {
    return { text: `We're open 7 days a week, 11am–7pm, at ${SITE.address.full}.`, navigateTo: "/contact", actionLabel: "Find Us →" };
  }
  if (/(where|location|address|find|direction)/.test(q)) {
    return { text: `You'll find us at ${SITE.address.full}. Call ${SITE.phone} if you need directions.`, navigateTo: "/contact", actionLabel: "Get Directions →" };
  }
  if (/(hello|hi|hey|salaam|assalam)/.test(q)) {
    return { text: "Assalamu alaikum and welcome to Chacha Jewellers! Ask me about our collections, today's gold price, selling gold, repairs or booking a visit." };
  }

  return {
    text: `I can help with our collections, today's gold price, selling gold, ring resizing & repairs, or booking a visit. You can also call us on ${SITE.phone}.`,
  };
}

export function AiAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hello, I'm the Chacha Jewellers assistant 💛 How can I help you today?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const reply = buildReply(clean);
    const botMsg: Msg = {
      role: "bot",
      text: reply.text,
      actionLabel: reply.actionLabel,
      action: reply.navigateTo
        ? () => {
            router.push(reply.navigateTo!);
            setOpen(false);
          }
        : undefined,
    };
    setMessages((m) => [...m, { role: "user", text: clean }, botMsg]);
    setInput("");
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        aria-label="Open jewellery assistant"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-charcoal shadow-lg shadow-black/20 transition-transform hover:scale-105",
          open && "scale-0 opacity-0"
        )}
      >
        <MessageCircle className="size-6" />
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center">
          <Sparkles className="size-4 text-maroon" />
        </span>
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-2xl border border-gold/30 bg-cream shadow-2xl transition-all",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        )}
        style={{ height: "min(32rem, calc(100vh - 2.5rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-charcoal px-4 py-3 text-cream">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-gold/20">
              <Sparkles className="size-4 text-gold" />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-sm font-semibold">Jewellery Assistant</p>
              <p className="text-[11px] text-cream/60">Typically replies instantly</p>
            </div>
          </div>
          <button aria-label="Close" onClick={() => setOpen(false)} className="text-cream/70 hover:text-gold">
            <X className="size-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream-soft/40 px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-maroon text-cream"
                    : "rounded-bl-sm border border-border bg-card text-card-foreground"
                )}
              >
                <p>{m.text}</p>
                {m.action && (
                  <button
                    onClick={m.action}
                    className="mt-2 inline-flex rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-gold-soft"
                  >
                    {m.actionLabel ?? "Take me there →"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 border-t border-border bg-cream px-3 py-2.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-gold/40 bg-gold/5 px-2.5 py-1 text-[11px] font-medium text-gold-deep transition-colors hover:bg-gold/15"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border bg-cream px-3 py-2.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about gold, collections, repairs…"
            className="flex-1 rounded-full border border-border bg-white px-3.5 py-2 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-maroon-deep"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}
