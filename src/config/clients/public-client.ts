import { createPublicClient, http, webSocket } from "viem";
import { publicActionsL2 } from "viem/zksync";
import { chain, WS_URL } from "../chain";

// Global Viem public client instance (HTTP - for gas estimation, nonce queries)
// Configured with retry logic for resilience against transient RPC failures
export const publicClient = createPublicClient({
  chain: chain,
  transport: http(undefined, {
    retryCount: 3,
    retryDelay: 500,
  }),
}).extend(publicActionsL2());

// WebSocket public client for fast transaction confirmation
// Configured with reconnection handling for dropped connections
export const wsPublicClient = createPublicClient({
  chain: chain,
  transport: webSocket(WS_URL, {
    reconnect: {
      delay: 1000,
      attempts: 5,
    },
  }),
}).extend(publicActionsL2());


