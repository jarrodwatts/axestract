import Character from "./character";

export interface LumberjackTier {
  unlockThreshold: number;
  clickIntervalMs: number;
  displayName: string;
  id: string;
}

export interface ActiveLumberjack extends LumberjackTier {
  lumberjackId: string;
  character: Character;
  timerId?: NodeJS.Timeout;
}

export interface BurstingWoodEmoji {
  id: string;
  x: number;
  y: number;
  randomOffsetX: number;
  randomOffsetY: number;
  randomRotation: number;
}

export interface ActiveMiniGame {
  id: string;
  character: Character;
  initialClickCount: number;
  txHash?: `0x${string}`;
  uiState: "submitting" | "confirmed" | "failed";
  errorMessage?: string;
  clickTimestamp: number;
  finalizedTimestamp?: number;
  isVisuallyRemoving?: boolean;
}
