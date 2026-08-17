"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AiAssistant } from "@/components/assistant/ai-assistant";
import { BasketProvider } from "@/components/basket/basket-provider";
import { BasketPanel } from "@/components/basket/basket-panel";

/**
 * The public-site chrome (nav, footer, AI assistant, basket) lives in the
 * root layout so every public route gets it — but /admin is a separate
 * application under the same root layout (shared fonts, one <html>/<body>)
 * and shouldn't show any of it. Gated here rather than by restructuring the
 * whole site into route groups.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <BasketProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AiAssistant />
      <BasketPanel />
    </BasketProvider>
  );
}
