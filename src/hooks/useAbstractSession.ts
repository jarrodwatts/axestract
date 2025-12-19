"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { encodeAbiParameters } from "viem";
import { getStoredSession } from "@/lib/session-keys/getStoredSession";
import { useAbstractClient } from "@abstract-foundation/agw-react";
import { QUERY_KEYS } from "@/config/query-keys";
import { publicClient } from "@/config/clients/publicClient";
import { chain } from "@/config/chain";
import {
  initializeTransportCache,
  setCachedHooks,
} from "@/config/clients/cachingTransport";

// AGWAccount ABI for listHooks function
const listHooksAbi = [
  {
    inputs: [{ internalType: "bool", name: "isValidation", type: "bool" }],
    name: "listHooks",
    outputs: [{ internalType: "address[]", name: "hookList", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Pre-fetch and cache the validation hooks for the AGW.
 * This eliminates the eth_call for listHooks on each transaction.
 */
async function prefetchAndCacheHooks(agwAddress: `0x${string}`) {
  try {
    // Fetch the validation hooks (isValidation = true)
    const hooks = await publicClient.readContract({
      address: agwAddress,
      abi: listHooksAbi,
      functionName: "listHooks",
      args: [true],
    });

    // Encode the hooks array to match raw RPC response format
    // The RPC returns ABI-encoded data
    const encodedHooks = encodeAbiParameters(
      [{ type: "address[]" }],
      [hooks as `0x${string}`[]]
    );

    // Cache the encoded hooks
    setCachedHooks(encodedHooks);
  } catch {
    // Silently fail - the transport will fall back to real RPC
  }
}

/**
 * Hook to retrieve and validate the stored Abstract session.
 * Also initializes the caching transport for optimized transactions.
 * @returns The session data with loading and error states
 */
export function useAbstractSession() {
  const { address } = useConnection();
  const { data: abstractClient } = useAbstractClient();
  const areDependenciesLoading = !address || !abstractClient;

  const query = useQuery({
    queryKey: [QUERY_KEYS.session, address],
    queryFn: async () => {
      if (!address || !abstractClient) return null;

      const sessionData = await getStoredSession(abstractClient, address);

      // If session loaded successfully, initialize the caching transport
      if (sessionData) {
        // Initialize cache with AGW address
        initializeTransportCache(address);

        // Pre-fetch and cache validation hooks
        await prefetchAndCacheHooks(address);

      }

      return sessionData;
    },
    enabled: !!address && !!abstractClient,
    // Don't automatically refresh this query
    staleTime: Infinity,
  });

  // Override the loading state to consider dependencies loading time
  return {
    ...query,
    isLoading: query.isLoading || areDependenciesLoading,
  };
}
