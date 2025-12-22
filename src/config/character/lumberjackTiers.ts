import type { LumberjackTier } from "@/types/Game";

/**
 * Configuration for lumberjack tiers that can be unlocked in the game.
 * Each tier has different click thresholds and auto-click intervals.
 */
export const LUMBERJACK_TIERS: LumberjackTier[] = [
  {
    id: "tier1",
    unlockThreshold: 100,
    clickIntervalMs: 10000,
    displayName: "Rookie Logger",
  },
  {
    id: "tier2",
    unlockThreshold: 500,
    clickIntervalMs: 8000,
    displayName: "Apprentice Sawyer",
  },
  {
    id: "tier3",
    unlockThreshold: 2000,
    clickIntervalMs: 5000,
    displayName: "Journeyman Feller",
  },
  {
    id: "tier4",
    unlockThreshold: 10000,
    clickIntervalMs: 2000,
    displayName: "Master Timberman",
  },
  {
    id: "tier5",
    unlockThreshold: 50000,
    clickIntervalMs: 1000,
    displayName: "Forest Whisperer",
  },
  {
    id: "tier6",
    unlockThreshold: 100000,
    clickIntervalMs: 500,
    displayName: "Legendary Woodcutter",
  },
];


