import { JgnextAssistant } from "@/components/jgnext-assistant";
import CookieConsent from '@/components/cookie-consent';
import { AppNav } from "@/components/app-nav";
import type { Metadata } from "next";
import { Work_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const body = Work_Sans({ subsets: ["latin"], weight: ["400","700"], variable: "--font-sans", display: "swap" });
const display = Outfit({ subsets: ["latin"], weight: ["400","700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Plataforma de Monitoramento",
  description: "Base full-stack: Next.js App Router + NextAuth + Prisma + Stripe.",
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers><AppNav />{children}</Providers>
              <JgnextAssistant />
        <CookieConsent />
              <a href="https://www.jgnext.com" target="_blank" rel="noopener" className="fixed bottom-16 right-2 z-40 rounded-full bg-black/80 px-3 py-1 text-[11px] text-white/80 backdrop-blur hover:text-white transition-colors">Feito com JGNEXT</a>
      </body>
    </html>
  );
}
