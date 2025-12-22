import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { getUserClicks } from "@/lib/transaction/get-user-clicks";
import { useConnection } from "wagmi";
import { QUERY_KEYS } from "@/config/query-keys";

/**
 * Hook to read the number of clicks a user has made in the game.
 * First it reads the on-chain value, then calculates local count with offset.
 * From there, it allows for the local click count to be incremented and refreshed.
 *
 * Uses an offset-based approach to avoid unnecessary Effects:
 * - Query fetches the base click count from the blockchain
 * - Local offset tracks how many increments beyond the base
 * - Effective click count is calculated during render (base + offset)
 */
export function useUserClicks() {
  const { address } = useConnection();
  // Track local offset from the fetched click count (avoids Effect for initialization)
  const localOffsetRef = useRef(0);

  const clickQuery = useQuery({
    queryKey: [QUERY_KEYS.userClicks, address],
    queryFn: () =>
      address ? getUserClicks(address) : Promise.reject("No address provided"),
    enabled: !!address,
    staleTime: 5 * 1000,
  });

  // Calculate effective click count during render (no Effect needed)
  const baseClickCount = clickQuery.data;
  const clickCount =
    baseClickCount !== undefined
      ? baseClickCount + localOffsetRef.current
      : undefined;

  const incrementClickCount = useCallback(() => {
    if (baseClickCount !== undefined) {
      localOffsetRef.current += 1;
    }
  }, [baseClickCount]);

  const refreshClickCount = useCallback(async () => {
    if (address) {
      localOffsetRef.current = 0;
      await clickQuery.refetch();
    }
  }, [address, clickQuery]);

  return {
    clickCount,
    isLoading:
      address && baseClickCount === undefined ? clickQuery.isLoading : false,
    isError: address ? clickQuery.isError : false,
    error: clickQuery.error,
    incrementClickCount,
    refreshClickCount,
    refetch: refreshClickCount,
  };
}
