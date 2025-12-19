import {
  getSessionHash,
  SessionConfig,
} from "@abstract-foundation/agw-client/sessions";
import { AbstractClient } from "@abstract-foundation/agw-client";
import { LOCAL_STORAGE_KEY_PREFIX } from "./constants";
import { getEncryptionKey } from "./getEncryptionKey";
import { decrypt } from "./decryptSession";
import { validateSession } from "./validateSession";
import { clearStoredSession } from "./clearStoredSession";
import type { Address } from "viem";
import { DEFAULT_CALL_POLICIES } from "@/config/session-key-config";
import { logger } from "@/lib/logger";

/**chain,
 * @function getStoredSession
 * @description Retrieves, decrypts, and validates a stored session for a wallet address
 *
 * This function performs several steps to securely retrieve and validate a stored session:
 * 1. Checks local storage for encrypted session data under the wallet address key
 * 2. Retrieves the encryption key for the wallet address
 * 3. Decrypts the session data using the encryption key
 * 4. Parses the decrypted data to obtain session information
 * 5. Validates the session by checking its status on-chain
 *
 * If the session is found to be invalid during validation, it will be automatically
 * cleared and a new session will be created.
 *
 * @param {Address} address - The wallet address whose session should be retrieved
 *
 * @returns {Promise<Object|null>} A promise that resolves to:
 *   - The session data object (containing `session` and `privateKey`) if successful
 *   - null if no session exists or if decryption/validation fails
 *
 * The returned session object contains:
 * - session: The Abstract Global Wallet session configuration
 * - privateKey: The private key for the session signer
 */
export const getStoredSession = async (
  abstractClient: AbstractClient,
  address: Address
): Promise<{
  session: SessionConfig;
  privateKey: `0x${string}`;
} | null> => {
  if (!address) return null;

  const encryptedData = localStorage.getItem(
    `${LOCAL_STORAGE_KEY_PREFIX}${address}`
  );
  if (!encryptedData) return null;

  try {
    const key = await getEncryptionKey(address);
    const decryptedData = await decrypt(encryptedData, key);
    const parsedData = JSON.parse(decryptedData, (key, value) => {
      // Check if the value is a string that looks like a number (only digits)
      if (typeof value === "string" && /^\d+$/.test(value)) {
        return BigInt(value);
      }
      return value;
    });

    // Validate that parsed data has required structure
    if (!parsedData?.session || !parsedData?.privateKey) {
      logger.warn("Corrupted session data: missing required fields", {
        address,
        hasSession: !!parsedData?.session,
        hasPrivateKey: !!parsedData?.privateKey,
      });
      clearStoredSession(address);
      return null;
    }

    // IF DEFAULT_CALL_POLICIES have changed we return null
    if (
      JSON.stringify(parsedData.session.callPolicies, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      ) !==
      JSON.stringify(DEFAULT_CALL_POLICIES, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    ) {
      clearStoredSession(address);
      return null;
    }

    const sessionHash = getSessionHash(parsedData.session);
    await validateSession(abstractClient, address, sessionHash);
    return parsedData;
  } catch (error) {
    logger.error("Failed to retrieve session", {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    // Clear corrupted/unreadable session data
    clearStoredSession(address);
    return null;
  }
};
