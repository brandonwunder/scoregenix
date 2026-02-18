import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoregenix - Sports Betting Analytics",
  description: "Track, analyze, and optimize your sports betting performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black font-sans antialiased text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
