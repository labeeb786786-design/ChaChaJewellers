import Link from "next/link";
import { Phone } from "lucide-react";

import { SITE } from "@/lib/site";
import {
  InstagramIcon,
  WhatsAppIcon,
  FacebookIcon,
} from "@/components/icons/social";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Chacha Jewellers, Oldham — by phone, WhatsApp, Instagram or Facebook.",
};

type Method = {
  key: "call" | "whatsapp" | "instagram" | "facebook";
  label: string;
  sub: string;
  href: string;
  external: boolean;
};

// Direct contact first (call, WhatsApp), then social — Instagram (our main
// channel) ahead of Facebook.
const METHODS: Method[] = [
  { key: "call", label: "Call us", sub: SITE.phone, href: SITE.phoneHref, external: false },
  { key: "whatsapp", label: "WhatsApp", sub: "Message us directly", href: SITE.whatsappUrl, external: true },
  { key: "instagram", label: "Instagram", sub: SITE.instagram.handle, href: SITE.instagram.url, external: true },
  { key: "facebook", label: "Facebook", sub: "Find us on Facebook", href: SITE.facebookUrl, external: true },
];

const ICONS = {
  call: Phone,
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
} as const;

export default function ContactPage() {
  return (
    <div>
      {/* Header */}
      <section className="hero-vignette text-cream">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            Get in Touch
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Have a question or a doubt? You&rsquo;ll likely find the answer on our{" "}
            <Link
              href="/faq"
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:text-gold-soft"
            >
              FAQs page
            </Link>
            . If not, we&rsquo;d love to hear from you — reach us any of the ways
            below.
          </p>
        </div>
      </section>

      {/* Methods */}
      <section className="bg-cream py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {METHODS.map((m) => {
              const Icon = ICONS[m.key];
              return (
                <a
                  key={m.key}
                  href={m.href}
                  target={m.external ? "_blank" : undefined}
                  rel={m.external ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-charcoal">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="font-serif text-lg font-semibold text-foreground">
                      {m.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{m.sub}</p>
                  </div>
                </a>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Or visit us in-store at {SITE.address.full} · {SITE.hours}.
          </p>
        </div>
      </section>
    </div>
  );
}
