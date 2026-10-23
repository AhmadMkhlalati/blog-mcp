import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/SimpleForm";
import { getUser } from "@/lib/session";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["opsz", "SOFT"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const code = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: "Blog",
  description: "A simple blog with login, posts and comments",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
          <nav className="max-w-3xl mx-auto flex items-center gap-1 sm:gap-2 px-4 h-16">
            <Link href="/" className="font-display text-2xl font-semibold mr-auto flex items-baseline gap-1">
              Blog<span className="text-accent">.</span>
            </Link>
            {user ? (
              <>
                <Link href="/account" className="btn-ghost hidden sm:inline-flex">API tokens</Link>
                <LogoutButton />
                <Link href="/posts/new" className="btn ml-1">
                  <span aria-hidden>✎</span> Write
                </Link>
                <Avatar name={user.name} className="ml-2 hidden sm:inline-grid" />
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/register" className="btn">Get started</Link>
              </>
            )}
          </nav>
        </header>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 sm:py-14">{children}</main>
        <footer className="border-t border-line">
          <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-muted flex justify-between">
            <span className="font-display">Blog<span className="text-accent">.</span></span>
            <span>Written by people, readable by agents.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
