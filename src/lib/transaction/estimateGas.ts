import { COOKIE_CLICKER_CONTRACT_ADDRESS } from "@/config/contracts/contracts";
import { publicClient } from "@/config/clients/publicClient";
import { Address, toFunctionSelector } from "viem";

/**
 * Estimate the gas cost of a click transaction
 * @param address - The address of the user making the transaction
 * @returns the gas limit and max fee per gas
 */
export async function estimateGasForClick(address: Address) {
  const gasLimit = await publicClient.estimateGas({
    to: COOKIE_CLICKER_CONTRACT_ADDRESS,
    data: toFunctionSelector("click()"),
    account: address,
  });

  const adjustedGasLimit = (gasLimit * 15n) / 10n;

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await publicClient.estimateFeesPerGas();

  if (maxFeePerGas === null || maxPriorityFeePerGas === null) {
    throw new Error(
      "Failed to estimate gas fees. One of the fee parameters is null."
    );
  }

  return { gasLimit: adjustedGasLimit, maxFeePerGas, maxPriorityFeePerGas };
}
