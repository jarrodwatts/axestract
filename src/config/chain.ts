import { abstractTestnet, abstract } from "viem/chains";
import { getGeneralPaymasterInput } from "viem/zksync";

// Validate chain environment at startup
const CHAIN_ENV = process.env.NEXT_PUBLIC_CHAIN_ENV;
if (!CHAIN_ENV || !["mainnet", "testnet"].includes(CHAIN_ENV)) {
  throw new Error(
    `NEXT_PUBLIC_CHAIN_ENV must be "mainnet" or "testnet", got: "${CHAIN_ENV}"`
  );
}

export const IS_PRODUCTION = CHAIN_ENV === "mainnet";

export const chain = IS_PRODUCTION ? abstract : abstractTestnet;

export const WS_URL = IS_PRODUCTION
  ? "wss://api.mainnet.abs.xyz/ws"
  : "wss://api.testnet.abs.xyz/ws";

export const paymasterFields = IS_PRODUCTION
  ? {}
  : {
    paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391" as `0x${string}`,
    paymasterInput: getGeneralPaymasterInput({
      innerInput: "0x",
    }),
  };
