// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "디어드림 | 시작하기",
  description: "디어드림 데모 초기 화면",
  themeColor: "#018941",
};

export const viewport = {
  themeColor: "#018941"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}