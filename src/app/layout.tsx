import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI户外服饰智能设计Agent",
  description: "面向中小户外服饰商家的小单快反研发助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
