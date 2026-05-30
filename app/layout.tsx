import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { RuledAIChat } from "@/components/RuledAIChat";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ruled.ca"
  ),
  title: "Ruled — Fight Back. Get What You're Owed.",
  description:
    "AI-powered small claims court preparation for Canadians. No lawyer required.",
  openGraph: {
    title: "Ruled.ca — Win Without a Lawyer",
    description:
      "AI-powered demand letters and small claims court prep. Free case assessment. Flat fee. No lawyer needed.",
    images: ["/brand/product-screenshot.png"],
    url: "https://ruled.ca",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ruled.ca — Win Without a Lawyer",
    description:
      "AI-powered demand letters and small claims court prep. Free case assessment. Flat fee. No lawyer needed.",
    images: ["/brand/product-screenshot.png"],
  },
  icons: {
    icon: "/brand/logo_icon.png",
    apple: "/brand/logo_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${playfair.variable}`}>
      <body className="min-h-full flex flex-col antialiased site-body">
        <Nav />
        {children}
        <RuledAIChat />
      </body>
    </html>
  );
}
