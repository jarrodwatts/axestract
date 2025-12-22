import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import AbstractWalletWrapper from "@/components/AbstractWalletProvider";
import BackgroundMusic from "@/components/BackgroundMusic";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

// Cool gaming font
const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  weight: "400",
  subsets: ["latin"],
});

// Metadata for the entire app
export const metadata: Metadata = {
  title: "Axestract | Chop Wood, Earn Rewards on Abstract",
  description:
    "A free-to-play idle clicker game on Abstract. Chop wood, collect lumberjacks, and compete on the leaderboard. No gas fees, instant transactions.",
};

// Wrap the entire app in the Abstract Wallet Wrapper
// https://docs.abs.xyz/abstract-global-wallet/agw-react/AbstractWalletProvider
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} antialiased`}>
        <ErrorBoundary>
          <BackgroundMusic />
          <AbstractWalletWrapper>{children}</AbstractWalletWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
