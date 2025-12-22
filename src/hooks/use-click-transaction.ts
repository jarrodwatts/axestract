"use client";

import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { privateKeyToAccount } from "viem/accounts";
import { useAbstractSession } from "./use-abstract-session";
import { useClickGasEstimate } from "./use-click-gas-estimate";
import { useTransactionNonce } from "./use-transaction-nonce";
import { signAndSendClickTx } from "@/lib/transaction/send-click-tx";
import { checkTransactionReady } from "@/lib/transaction/check-transaction-ready";
import { logger } from "@/lib/logger";

export interface TransactionResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Maps raw blockchain error messages to user-friendly messages.
 */
function getUserFriendlyError(error: string): string {
  const lowerError = error.toLowerCase();
  if (lowerError.includes("nonce too high") || lowerError.includes("nonce too low")) {
    return "Transaction sync issue. Please try again.";
  }
  if (lowerError.includes("insufficient funds")) {
    return "Insufficient funds for gas.";
  }
  if (lowerError.includes("rejected") || lowerError.includes("denied")) {
    return "Transaction was rejected.";
  }
  if (lowerError.includes("timeout") || lowerError.includes("timed out")) {
    return "Request timed out. Please try again.";
  }
  if (lowerError.includes("network") || lowerError.includes("connection")) {
    return "Network error. Please check your connection.";
  }
  return "Transaction failed. Please try again.";
}

/**
 * Parse nonce error to extract the allowed range.
 * Error format: "allowed nonce range: 2782 - 2802, actual: 2803"
 */
function parseNonceRange(error: string): { min: number; max: number } | null {
  const match = error.match(/allowed nonce range:\s*(\d+)\s*-\s*(\d+)/i);
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10),
    };
  }
  return null;
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
        logger.warn("Transaction pre-requisites not met", {
          hasAddress: !!address,
          hasSessionKey: !!sessionData?.privateKey,
          hasGasData: !!gasEstimateQuery.data,
          nonce,
        });
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
        const rawMessage =
          error instanceof Error ? error.message : String(error);

        logger.error("Transaction failed", {
          rawError: rawMessage,
          userError: getUserFriendlyError(rawMessage),
          address,
          nonce,
        });

        // Smart recovery from nonce errors using the allowed range from error
        const lowerMessage = rawMessage.toLowerCase();
        if (lowerMessage.includes("nonce too")) {
          const range = parseNonceRange(rawMessage);
          if (range) {
            if (lowerMessage.includes("nonce too low")) {
              // Jump to minimum allowed nonce
              logger.info("Syncing nonce (too low)", {
                currentNonce: nonce,
                syncingTo: range.min,
              });
              nonceQuery.syncToNonce(range.min);
            } else if (lowerMessage.includes("nonce too high")) {
              // Jump to max allowed nonce (the mempool limit)
              // Next increment will go to max+1, but that's expected behavior
              logger.info("Syncing nonce (too high)", {
                currentNonce: nonce,
                syncingTo: range.max,
              });
              nonceQuery.syncToNonce(range.max);
            }
          } else {
            // Fallback: couldn't parse range, do a full refresh
            nonceQuery.refreshNonce();
          }
        }

        return {
          success: false,
          error: getUserFriendlyError(rawMessage),
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
