import { useQuery } from "@tanstack/react-query";
import { estimateGasForClick } from "@/lib/transaction/estimateGas";
import { useConnection } from "wagmi";
import { QUERY_KEYS } from "@/config/query-keys";

/**
 * Hook to estimate the gas cost of a click transaction
 */
export function useClickGasEstimate() {
  const { address } = useConnection();

  return useQuery({
    queryKey: [QUERY_KEYS.gasEstimate, "click"],
    queryFn: () => estimateGasForClick(address as `0x${string}`),
    staleTime: 300 * 1000, // 5 minutes
    enabled: !!address,
  });
}
