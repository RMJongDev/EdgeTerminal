import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edge Terminal",
  description: "Personal event-driven trading research terminal by New Default.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="dark">
      <body>{children}</body>
    </html>
  );
}
