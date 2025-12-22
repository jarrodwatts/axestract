import { publicClient } from "@/config/clients/public-client";
import type { Address } from "viem";

/**
 * Get the current nonce for a wallet address
 * Uses 'pending' block tag to include pending transactions in the count,
 * preventing nonce conflicts when the user already has transactions in the mempool.
 * @param address - The address of the user
 * @returns the nonce (including pending transactions)
 */
export async function getNonce(address: Address) {
  const nonce = await publicClient.getTransactionCount({
    address: address,
    blockTag: "pending",
  });
  return nonce;
}
