"use client";

import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { privateKeyToAccount } from "viem/accounts";
import { useAbstractSession } from "./useAbstractSession";
import { useClickGasEstimate } from "./useClickGasEstimate";
import { useTransactionNonce } from "./useTransactionNonce";
import { signAndSendClickTx } from "@/lib/transaction/sendClickTx";
import { checkTransactionReady } from "@/lib/transaction/checkTransactionReady";

export interface TransactionResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Hook to manage click transaction submission.
 * Encapsulates gas estimation, nonce management, and transaction signing.
 */
export function useClickTransaction() {
  const { address } = useConnection();
  const { data: sessionData } = useAbstractSession();
  const gasEstimateQuery = useClickGasEstimate();
  const nonceQuery = useTransactionNonce();

  // Check if all transaction prerequisites are met
  const isReady = useMemo(
    () =>
      checkTransactionReady({
        address,
        sessionPrivateKey: sessionData?.privateKey,
        gasData: gasEstimateQuery.data,
        nonce: nonceQuery.nonce,
      }),
    [address, sessionData?.privateKey, gasEstimateQuery.data, nonceQuery.nonce]
  );

  // Submit a click transaction
  const submitClick = useCallback(
    async (nonce: number): Promise<TransactionResult> => {
      // Validate prerequisites
      if (
        !address ||
        !sessionData?.privateKey ||
        !gasEstimateQuery.data ||
        typeof gasEstimateQuery.data.gasLimit === "undefined" ||
        typeof gasEstimateQuery.data.maxFeePerGas === "undefined" ||
        typeof gasEstimateQuery.data.maxPriorityFeePerGas === "undefined"
      ) {
        return {
          success: false,
          error: "Transaction pre-requisites not met.",
        };
      }

      try {
        const signer = privateKeyToAccount(sessionData.privateKey);
        const { txHash } = await signAndSendClickTx(
          address,
          signer,
          sessionData.session,
          nonce,
          gasEstimateQuery.data.gasLimit,
          gasEstimateQuery.data.maxFeePerGas,
          gasEstimateQuery.data.maxPriorityFeePerGas
        );

        return { success: true, txHash };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Auto-recover from nonce desync errors by resetting offset and refetching
        if (errorMessage.includes("nonce too high")) {
          nonceQuery.refreshNonce();
        }

        return {
          success: false,
          error: errorMessage || "Transaction failed for an unknown reason.",
        };
      }
    },
    [address, sessionData, gasEstimateQuery.data, nonceQuery]
  );

  // Get the next nonce and increment the local counter
  const getNextNonce = useCallback(() => {
    if (nonceQuery.nonce === undefined) {
      return undefined;
    }
    return nonceQuery.incrementNonce();
  }, [nonceQuery]);

  return {
    isReady,
    submitClick,
    getNextNonce,
    // Expose query states for error handling in the UI
    isLoading: gasEstimateQuery.isLoading || nonceQuery.isLoading,
    isError: gasEstimateQuery.isError || nonceQuery.isError,
    error: gasEstimateQuery.error || nonceQuery.error,
    refetch: () => {
      if (gasEstimateQuery.isError) gasEstimateQuery.refetch();
      if (nonceQuery.isError) nonceQuery.refetch();
    },
  };
}
