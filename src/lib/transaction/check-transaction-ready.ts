import type { Address } from "viem";

/**
 * Check if all prerequisites for transaction submission are met.
 * This is used before attempting to submit click transactions.
 */
export function checkTransactionReady(deps: {
  address?: Address;
  sessionPrivateKey?: `0x${string}`;
  gasData?: {
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  };
  nonce?: number;
}): boolean {
  return !!(
    deps.address &&
    deps.sessionPrivateKey &&
    deps.gasData &&
    deps.gasData.gasLimit !== undefined &&
    deps.gasData.maxFeePerGas !== undefined &&
    deps.gasData.maxPriorityFeePerGas !== undefined &&
    deps.nonce !== undefined
  );
}
