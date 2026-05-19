import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ruled.ca"
  ),
  title: "Ruled — Fight Back. Win.",
  description:
    "AI-powered small claims court preparation for Canadians. No lawyer required.",
  openGraph: {
    title: "Ruled — Fight Back. Win.",
    description:
      "AI-powered small claims court preparation for Canadians. No lawyer required.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased site-body">
        <Nav />
        {children}
      </body>
    </html>
  );
}
