import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together FE",
  description: "Mobile frame styled Next.js app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <div className="app-shell">
          <div className="mobile-container">{children}</div>
        </div>
      </body>
    </html>
  );
}
