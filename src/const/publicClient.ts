import { createPublicClient, http, webSocket } from "viem";
import { publicActionsL2 } from "viem/zksync";
import { chain, WS_URL } from "./chain";

// Global Viem public client instance (HTTP - for gas estimation, nonce queries)
export const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
}).extend(publicActionsL2());

// WebSocket public client for fast transaction confirmation
export const wsPublicClient = createPublicClient({
  chain: chain,
  transport: webSocket(WS_URL),
}).extend(publicActionsL2());
