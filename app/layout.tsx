import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruled — AI Small Claims Court Assistant",
  description:
    "AI-powered small claims court preparation for Canadians. No lawyer required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
