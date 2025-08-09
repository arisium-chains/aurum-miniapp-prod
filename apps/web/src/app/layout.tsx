import type { Metadata } from "next";
import "./globals.css";
import { MiniKitProvider } from "@/components/providers/minikit-provider";

export const metadata: Metadata = {
  title: "Aurum Circle - Exclusive Dating for Bangkok Students",
  description: "A secret society-themed dating platform with World ID verification and NFT access gate.",
  keywords: ["dating", "world id", "nft", "bangkok", "students", "exclusive"],
  authors: [{ name: "Aurum Circle" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#1C1917",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1C1917" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}
