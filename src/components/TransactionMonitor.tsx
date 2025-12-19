"use client";

import { useEffect, useRef } from "react";
import { wsPublicClient } from "@/const/publicClient";

interface TransactionMonitorProps {
  txHash: `0x${string}`;
  onCompletion: (success: boolean) => void;
  chainId?: number;
}

/**
 * Simple invisible component that monitors a transaction using WebSocket.
 * Once transactions are included in blocks on-chain, it triggers the completion callback.
 */
const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  txHash,
  onCompletion,
}) => {
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasCompletedRef.current) return;

    let isMounted = true;

    wsPublicClient
      .waitForTransactionReceipt({ hash: txHash })
      .then((receipt) => {
        if (isMounted && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          const success = receipt.status === "success";
          onCompletion(success);
        }
      })
      .catch(() => {
        if (isMounted && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompletion(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [txHash, onCompletion]);

  return null;
};

export default TransactionMonitor;
