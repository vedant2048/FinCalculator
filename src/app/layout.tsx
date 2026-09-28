import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "finCalculator",
    template: "%s · finCalculator",
  },
  description: "Simple financial calculators for SIPs, loans, goals and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="px-4 pt-6 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link
              href="/"
              className="neu-button inline-flex items-center gap-3 rounded-2xl px-4 py-2.5"
            >
              <span className="neu-shadow-sm flex h-8 w-8 items-center justify-center rounded-lg bg-fill text-sm font-bold text-on-fill">
                ₹
              </span>
              <span className="text-lg font-semibold tracking-tight">
                fin<span className="text-accent">Calculator</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <footer className="px-4 pb-8 text-center text-xs text-muted sm:px-8">
          Projections are illustrative, not financial advice.
        </footer>
      </body>
    </html>
  );
}
