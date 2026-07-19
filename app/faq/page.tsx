import { HeartHandshake } from "lucide-react";

import { SITE } from "@/lib/site";
import { FaqAccordion, type Faq } from "@/components/faq/faq-accordion";

export const metadata = {
  title: "FAQs & Support",
  description:
    "Answers to common questions about buying and selling gold, repairs, bespoke jewellery, appointments and visiting Chacha Jewellers in Oldham.",
};

const FAQS: Faq[] = [
  {
    q: "Do you buy old or broken gold?",
    a: "Absolutely — we're always happy to buy your broken, unwanted or scrap gold. Just bring it in for an honest, same-day valuation with no obligation, and we'll weigh and test it right in front of you.",
  },
  {
    q: "What kind of gold do you sell?",
    a: "We specialise in beautiful 22k gold — the traditional heart of South Asian jewellery — alongside 24k and 18k pieces. Every item is clearly marked for karat and weight, so you always know exactly what you're taking home.",
  },
  {
    q: "Can you resize or repair my jewellery?",
    a: "Of course! We offer ring resizing, chain and clasp repairs, cleaning, polishing and engraving in our own workshop — many done while you wait. Pop in or give us a call and we'll happily sort it for you.",
  },
  {
    q: "Do I need an appointment to visit?",
    a: "Not at all — you're very welcome to walk in any day during our opening hours. That said, if you're shopping for a bridal set or a bespoke piece, booking a time lets us give you our full, unhurried attention.",
  },
  {
    q: "Do you create bespoke or custom pieces?",
    a: "We'd love to. Bring us a design, a photo, or even just an idea, and our team will craft a one-of-a-kind piece to make your special occasion truly yours.",
  },
  {
    q: "How is the price of gold jewellery decided?",
    a: "It comes down to the weight of the piece, its karat (purity) and the craftsmanship involved, all in line with the current gold rate. We're always happy to talk you through it in-store — there's never any pressure.",
  },
  {
    q: "Where are you, and when are you open?",
    a: `You'll find us at ${SITE.address.full}, open 7 days a week from 11am to 7pm. Whether you're buying, selling or simply browsing, there's a warm welcome waiting.`,
  },
];

export default function FaqPage() {
  return (
    <div>
      {/* Header */}
      <section className="hero-vignette text-cream">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <HeartHandshake className="size-7" />
          </span>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            We&rsquo;re Here to Help
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Have a question before you visit? Here are the things our customers
            ask us most — and if there&rsquo;s anything else on your mind,
            we&rsquo;re only ever a phone call away.
          </p>
        </div>
      </section>

      {/* FAQ list */}
      <section className="bg-cream py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <FaqAccordion items={FAQS} />

          {/* Subtle, warm invitation to call */}
          <p className="mt-10 text-center text-sm leading-relaxed text-muted-foreground">
            Can&rsquo;t find the answer you&rsquo;re looking for? Please
            don&rsquo;t hesitate to{" "}
            <a
              href={SITE.phoneHref}
              className="font-medium text-maroon underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-deep"
            >
              give us a call on {SITE.phone}
            </a>{" "}
            — we&rsquo;d be delighted to help and put your mind at ease.
          </p>
        </div>
      </section>
    </div>
  );
}
