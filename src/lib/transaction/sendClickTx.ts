import { COOKIE_CLICKER_CONTRACT_ADDRESS } from "@/config/contracts/contracts";
import { chain, paymasterFields } from "@/config/chain";
import { Account, Address, toFunctionSelector } from "viem";
import {
  createSessionClient,
  SessionConfig,
} from "@abstract-foundation/agw-client/sessions";
import { walletClient } from "@/config/clients/walletClient";
import { publicClient } from "@/config/clients/publicClient";
import { createCachingTransport } from "@/config/clients/cachingTransport";
import { logger } from "@/lib/logger";

/**
 * Signs and submits a click transaction using session keys.
 * Uses pre-fetched gas estimates and nonce for optimal performance.
 */
export async function signAndSendClickTx(
  agwAddress: Address,
  sessionSigner: Account,
  session: SessionConfig,
  nonce: number,
  gas: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint
): Promise<{ txHash: `0x${string}`; timeTaken: number }> {
  // Begin the timer now to see how long it takes to submit the transaction
  const startTime = performance.now();

  // Use the AGW session client to sign the transaction
  // The caching transport eliminates redundant RPC calls (eth_chainId, eth_getCode, listHooks)
  const sessionClient = createSessionClient({
    account: agwAddress,
    chain,
    signer: sessionSigner,
    session,
    transport: createCachingTransport(chain.rpcUrls.default.http[0]),
  });

  // Format the transaction for EIP-712.
  const preparedTransaction = await walletClient.prepareTransactionRequest({
    account: agwAddress,
    to: COOKIE_CLICKER_CONTRACT_ADDRESS as `0x${string}`,
    data: toFunctionSelector("click()"),
    type: "eip712",
    chain,
    nonce,
    chainId: chain.id,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    ...paymasterFields,
  });

  // Sign the transaction using the session client
  // @ts-expect-error prepareTransactionRequest returns a union type but we know it's eip712
  const signature = await sessionClient.signTransaction(preparedTransaction);

  logger.info("Submitting transaction", {
    nonce,
    gasLimit: gas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    signaturePrefix: (signature as string).slice(0, 20) + "...",
  });

  // Send the signed transaction using standard eth_sendRawTransaction
  const txHash = await publicClient.sendRawTransaction({
    serializedTransaction: signature as `0x${string}`,
  });

  const endTime = performance.now();
  const timeTaken = endTime - startTime;

  logger.info("Transaction submitted", {
    txHash,
    nonce,
    timeTaken: `${timeTaken.toFixed(0)}ms`,
  });

  return {
    txHash,
    timeTaken,
  };
}
