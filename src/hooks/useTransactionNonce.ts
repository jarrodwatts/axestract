import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { getNonce } from "@/lib/transaction/getNonce";
import { useConnection } from "wagmi";
import { QUERY_KEYS } from "@/config/query-keys";

/**
 * Hook to get the current nonce for a wallet address
 * This is used to prevent users from submitting transactions with the same nonce.
 * It first loads the nonce from on-chain, then increments it locally.
 * Allows for multiple transactions to be fired off in quick succession.
 * i.e. have multiple transactions from the same user sitting in the mempool
 *
 * Uses an offset-based approach to avoid unnecessary Effects:
 * - Query fetches the base nonce from the blockchain
 * - Local offset tracks how many increments beyond the base
 * - Effective nonce is calculated during render (base + offset)
 */
export function useTransactionNonce() {
  const { address } = useConnection();
  // Track local offset from the fetched nonce (avoids Effect for initialization)
  const localOffsetRef = useRef(0);
  // Track previous base nonce to detect when blockchain advances
  const prevBaseNonceRef = useRef<number | undefined>(undefined);

  const nonceQuery = useQuery({
    queryKey: [QUERY_KEYS.nonce, address],
    queryFn: () =>
      address ? getNonce(address) : Promise.reject("No address provided"),
    enabled: !!address,
    staleTime: 5 * 1000, // 5 seconds
  });

  const baseNonce = nonceQuery.data;

  // Auto-adjust offset when blockchain advances (transactions confirmed)
  // This prevents the offset from staying high when the chain catches up
  if (baseNonce !== undefined && prevBaseNonceRef.current !== undefined) {
    const advancedBy = baseNonce - prevBaseNonceRef.current;
    if (advancedBy > 0) {
      // Blockchain confirmed some transactions, reduce our offset
      localOffsetRef.current = Math.max(0, localOffsetRef.current - advancedBy);
    }
  }
  prevBaseNonceRef.current = baseNonce;

  // Calculate effective nonce during render (no Effect needed)
  const nonce =
    baseNonce !== undefined ? baseNonce + localOffsetRef.current : undefined;

  // Function to increment the local nonce offset and return the current nonce
  const incrementNonce = useCallback(() => {
    if (baseNonce === undefined) {
      throw new Error(
        "Failed to increment nonce, initial nonce was undefined."
      );
    }

    const currentNonceToReturn = baseNonce + localOffsetRef.current;
    localOffsetRef.current += 1;
    return currentNonceToReturn;
  }, [baseNonce]);

  // Force refresh from blockchain and reset offset
  const refreshNonce = useCallback(async () => {
    if (address) {
      localOffsetRef.current = 0;
      await nonceQuery.refetch();
    }
  }, [address, nonceQuery]);

  return {
    nonce,
    isLoading: address && baseNonce === undefined ? nonceQuery.isLoading : false,
    isError: address ? nonceQuery.isError : false,
    error: nonceQuery.error,
    incrementNonce,
    refreshNonce,
    refetch: refreshNonce,
  };
}
