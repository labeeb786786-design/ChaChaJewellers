import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

// Belt-and-braces alongside the disallow rule in app/robots.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared shell for every /admin route, including /admin/login. Session
 * verification and the top bar + nav live one level down, in
 * app/admin/(protected)/layout.tsx — the login page can't sit under that
 * layout without an auth-check redirect loop (checking a session on the
 * sign-in page redirects to the sign-in page).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${ibmPlexMono.variable} min-h-full bg-admin-paper text-admin-ink`}>
      {children}
    </div>
  );
}
