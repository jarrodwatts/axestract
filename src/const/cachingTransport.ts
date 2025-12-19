import { custom, type Transport } from "viem";
import { chain } from "./chain";

/**
 * Custom caching transport for AGW session transactions.
 *
 * The AGW SDK makes several RPC calls before each transaction:
 * - eth_chainId (static, known at compile time)
 * - eth_getCode (checks if AGW deployed - always true after session)
 * - eth_call for listHooks (validation hooks - static for wallet)
 * - eth_call multicall (mainnet only - policy validation)
 *
 * This transport caches these responses to reduce latency from 4-5 RPC calls
 * down to just 1 (eth_sendRawTransaction) per transaction.
 */

// Cache storage
interface TransportCache {
  agwAddress: string | null;
  hooks: string | null;
  multicallResults: Map<string, string>; // key: serialized call params
}

const cache: TransportCache = {
  agwAddress: null,
  hooks: null,
  multicallResults: new Map(),
};

// Pre-computed static values
const CHAIN_ID_HEX = `0x${chain.id.toString(16)}`;
// Non-empty bytecode indicates the contract is deployed
// Using a minimal valid bytecode response
const DEPLOYED_CODE =
  "0x0001000000000000000000000000000000000000000000000000000000000000";

// Function selector for listHooks(bool)
const LIST_HOOKS_SELECTOR = "0xdb8a323f";

// Session Key Policy Registry address (for mainnet policy validation)
// This contract is queried via multicall to validate session policies
const SESSION_KEY_POLICY_REGISTRY = "0xfd20b9d7a406e2c4f5d6df71abe3ee48b2eccc9f";

// Multicall3 address (standard across EVM chains)
const MULTICALL3_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11";

/**
 * Initialize the transport cache with the AGW address.
 * Call this when a session is loaded.
 */
export function initializeTransportCache(agwAddress: string) {
  cache.agwAddress = agwAddress.toLowerCase();
}

/**
 * Cache the encoded hooks response.
 * The hooks are fetched once on session load and cached.
 */
export function setCachedHooks(encodedHooks: string) {
  cache.hooks = encodedHooks;
}

/**
 * Hash multicall params to use as cache key.
 * Uses JSON.stringify for simplicity - stable for same inputs.
 */
function hashCallParams(params: unknown): string {
  return JSON.stringify(params);
}

/**
 * Create a caching transport that intercepts known RPC calls
 * and returns cached values, falling through to real RPC for others.
 *
 * For mainnet multicall support, eth_call responses are automatically
 * cached on first fetch to eliminate redundant calls.
 */
export function createCachingTransport(fallbackUrl: string): Transport {
  return custom({
    async request({ method, params }) {
      // 1. Cache eth_chainId - always known at compile time
      if (method === "eth_chainId") {
        return CHAIN_ID_HEX;
      }

      // 2. Cache eth_getCode for AGW address - always deployed after session created
      if (method === "eth_getCode" && cache.agwAddress) {
        const [address] = params as [string, string];
        if (address.toLowerCase() === cache.agwAddress) {
          return DEPLOYED_CODE;
        }
      }

      // 3. Cache eth_call for specific calls
      if (method === "eth_call" && params) {
        const [callParams] = params as [
          { to?: string; data?: string; from?: string },
        ];

        // 3a. Cache listHooks call (pre-fetched on session load)
        if (
          callParams.data?.toLowerCase().startsWith(LIST_HOOKS_SELECTOR) &&
          callParams.to?.toLowerCase() === cache.agwAddress &&
          cache.hooks
        ) {
          return cache.hooks;
        }

        // 3b. Check if this eth_call is already cached (e.g., multicall)
        const callHash = hashCallParams(params);
        const cachedResult = cache.multicallResults.get(callHash);
        if (cachedResult) {
          return cachedResult;
        }

        // 3c. Determine if this eth_call should be auto-cached
        // Only cache calls to known static contracts to avoid caching dynamic data
        const targetAddress = callParams.to?.toLowerCase();
        const shouldAutoCache =
          targetAddress === SESSION_KEY_POLICY_REGISTRY || // Policy validation
          targetAddress === MULTICALL3_ADDRESS; // Multicall (used for batch policy checks)

        // Fetch the result
        const response = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || "RPC error");
        }

        // Auto-cache if targeting a known static contract
        // This is important for mainnet policy validation multicalls
        if (shouldAutoCache) {
          cache.multicallResults.set(callHash, data.result);
        }

        return data.result;
      }

      // Fall through to real RPC for everything else
      const response = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "RPC error");
      }

      return data.result;
    },
  });
}

/**
 * Clear the transport cache.
 * Call this on wallet disconnect or session recreation.
 */
export function clearTransportCache() {
  cache.agwAddress = null;
  cache.hooks = null;
  cache.multicallResults.clear();
}
