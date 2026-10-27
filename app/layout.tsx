import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "EvoMeme · Trend Radar",
  description: "全球热点情报与可玩创意工作台",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
