# Axestract 🪓

A free-to-play idle clicker game built on [Abstract](https://abs.xyz). Chop wood, collect unique lumberjacks, and compete on the global leaderboard.

## Features

- **Gasless gameplay** - Session keys enable transactions without wallet popups or gas fees
- **Instant transactions** - Powered by Abstract's realtime infrastructure
- **Collectible lumberjacks** - Randomly generated pixel art characters
- **Global leaderboard** - Compete for the most clicks

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Blockchain**: Abstract (L2), Viem, Wagmi
- **Wallet**: Abstract Global Wallet with session keys
- **Smart Contract**: Solidity (Foundry)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CHAIN_ENV=mainnet  # or "testnet"
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

### Production Build

```bash
pnpm build
pnpm start
```

## Smart Contract

The game contract is located in `contracts/src/Axestract.sol`. It tracks:
- Individual user click counts
- Global total clicks

Deploy using Foundry:

```bash
cd contracts
forge build
forge deploy
```

## License

MIT
