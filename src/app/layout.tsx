import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Accelerator",
  description: "Next.js, Supabase and Vercel project starter for New Default apps.",
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
