import {
  COOKIE_CLICKER_CONTRACT_ABI,
  COOKIE_CLICKER_CONTRACT_ADDRESS,
} from "@/config/contracts/contracts";
import { publicClient } from "@/config/clients/publicClient";
import type { Address } from "viem";

/**
 * Get the number of clicks a user has made in the game
 * @param address - The address of the user
 * @returns the number of clicks
 */
export async function getUserClicks(address: Address) {
  const clicks = await publicClient.readContract({
    address: COOKIE_CLICKER_CONTRACT_ADDRESS,
    abi: COOKIE_CLICKER_CONTRACT_ABI,
    functionName: "getClicksForUser",
    args: [address],
  });
  return Number(clicks);
}
