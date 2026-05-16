import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ChatAgent from "@/components/ChatAgent";
import GoogleAnalytics from "@/components/GoogleAnalytics";


const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Datalazo | AI Business Automation & SEO Agency",
  description: "Next-generation business automation, AI agents, and SEO optimization for modern enterprises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <div className="bg-glow" />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
        <ChatAgent />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>

    </html>
  );
}
