import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PuzzleQuest — Interactive Mystery Puzzle Adventure",
  description:
    "Decode ancient ciphers, solve deductive logic traps, and conquer 12 handcrafted mystery chambers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#070913] text-slate-100 antialiased`}>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.12),_transparent_55%)]" />
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
