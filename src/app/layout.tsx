import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import AbstractWalletWrapper from "@/components/abstract-wallet-provider";
import BackgroundMusic from "@/components/background-music";
import ErrorBoundary from "@/components/error-boundary";
import "./globals.css";

// Cool gaming font
const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  weight: "400",
  subsets: ["latin"],
});

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#87944d",
};

// Metadata for the entire app
export const metadata: Metadata = {
  metadataBase: new URL("https://axestract.com"),
  title: {
    default: "Axestract | Chop Wood, Earn Rewards on Abstract",
    template: "%s | Axestract",
  },
  description:
    "A free-to-play idle clicker game on Abstract. Chop wood, collect lumberjacks, and compete on the leaderboard. No gas fees, instant transactions.",
  keywords: [
    "Abstract",
    "blockchain game",
    "idle clicker",
    "web3 game",
    "lumberjack",
    "free to play",
    "gasless",
    "NFT",
  ],
  authors: [{ name: "Axestract" }],
  creator: "Axestract",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axestract.com",
    siteName: "Axestract",
    title: "Axestract | Chop Wood, Earn Rewards on Abstract",
    description:
      "A free-to-play idle clicker game on Abstract. Chop wood, collect lumberjacks, and compete on the leaderboard. No gas fees, instant transactions.",
    images: [
      {
        url: "/axestract.png",
        width: 1200,
        height: 630,
        alt: "Axestract - Chop Wood, Earn Rewards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axestract | Chop Wood, Earn Rewards on Abstract",
    description:
      "A free-to-play idle clicker game on Abstract. Chop wood, collect lumberjacks, and compete on the leaderboard.",
    images: ["/axestract.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/Abstract_AppIcon_LightMode.png",
  },
  robots: {
    index: true,
    follow: true,
  },
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
