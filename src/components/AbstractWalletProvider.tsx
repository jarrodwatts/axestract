"use client";

import { chain } from "@/config/chain";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { QueryClient } from "@tanstack/react-query";

/** TanStack query client with production-ready defaults */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Wrap the entire app in the Abstract Wallet Wrapper
 * https://docs.abs.xyz/abstract-global-wallet/agw-react/AbstractWalletProvider
 */
export default function AbstractWalletWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AbstractWalletProvider chain={chain} queryClient={queryClient}>
      {children}
    </AbstractWalletProvider>
  );
}
