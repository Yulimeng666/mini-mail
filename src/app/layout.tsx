// 根布局 —— 全局导航 + 页脚
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
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
  title: "Mini Mail — 微型电商",
  description: "Mini Mail 是一个基于 Next.js 16 的微型电商项目，支持商品浏览、购物车、下单和会员体系",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        {/* 页脚 */}
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
          <p>© 2026 Mini Mail — 微型电商项目</p>
        </footer>
      </body>
    </html>
  );
}
