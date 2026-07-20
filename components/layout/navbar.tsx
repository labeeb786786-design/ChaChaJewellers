"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone, Star } from "lucide-react";

import { SITE, HEADER_LINKS } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top strip */}
      <div className="hidden bg-charcoal text-cream/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="font-medium text-cream">{SITE.rating.stars}</span>
            <span>rated by {SITE.rating.count} Google reviews</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{SITE.hours}</span>
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <Phone className="size-3.5" />
              {SITE.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="group flex flex-col leading-none">
            <span className="font-serif text-xl font-bold tracking-tight text-maroon sm:text-2xl">
              Chacha Jewellers
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold-deep">
              Est. Oldham · Fine Gold
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {HEADER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-foreground/80 transition-colors hover:text-maroon after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">Contact us</Link>
            </Button>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-md text-maroon lg:hidden"
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "overflow-hidden border-t border-border/70 bg-cream lg:hidden",
            open ? "max-h-96" : "max-h-0"
          )}
          style={{ transition: "max-height 300ms ease" }}
        >
          <div className="flex flex-col px-6 py-3">
            {HEADER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/50 py-3 text-sm font-medium text-foreground/90 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild variant="gold" size="sm" className="mt-3 mb-2">
              <Link href="/contact" onClick={() => setOpen(false)}>
                Contact us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
