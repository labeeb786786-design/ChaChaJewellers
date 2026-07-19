import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AiAssistant } from "@/components/assistant/ai-assistant";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Chacha Jewellers — Fine South Asian Gold Jewellery, Oldham",
    template: "%s · Chacha Jewellers",
  },
  description:
    "Family-run South Asian gold jewellery specialist in Oldham. Bridal sets, bangles, rings and earrings in 22k gold, plus trusted gold buying and valuations. Rated 4.6★ by 138 reviews.",
  keywords: [
    "gold jewellery Oldham",
    "Asian gold Oldham",
    "22k gold",
    "bridal jewellery",
    "sell gold Oldham",
    "bangles",
    "Chacha Jewellers",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AiAssistant />
      </body>
    </html>
  );
}
