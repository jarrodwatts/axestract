"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import generateRandomCharacter from "@/lib/render-character/generateRandomCharacter";
import { LUMBERJACK_TIERS } from "@/config/character/lumberjackTiers";
import { type ActiveLumberjack } from "@/types/Game";

interface UseLumberjacksOptions {
  clickCount: number | undefined;
  isTransactionReady: boolean;
  onAutoClick: () => Promise<void>;
}

/**
 * Hook to manage lumberjack unlocking and auto-click timer functionality.
 * Handles unlocking new lumberjacks based on click count and managing their auto-click intervals.
 */
export function useLumberjacks({
  clickCount,
  isTransactionReady,
  onAutoClick,
}: UseLumberjacksOptions) {
  const [unlockedLumberjacks, setUnlockedLumberjacks] = useState<
    ActiveLumberjack[]
  >([]);

  const lumberjackTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const unlockedLumberjacksRef = useRef(unlockedLumberjacks);
  const isAutoClickProcessingRef = useRef(false);
  const onAutoClickRef = useRef(onAutoClick);

  // Keep refs updated
  useEffect(() => {
    unlockedLumberjacksRef.current = unlockedLumberjacks;
  }, [unlockedLumberjacks]);

  useEffect(() => {
    onAutoClickRef.current = onAutoClick;
  }, [onAutoClick]);

  // Unlock lumberjacks based on clickCount
  useEffect(() => {
    if (typeof clickCount === "number") {
      const newlyUnlocked = LUMBERJACK_TIERS.filter(
        (tier) =>
          clickCount >= tier.unlockThreshold &&
          !unlockedLumberjacks.some((lj) => lj.id === tier.id)
      );

      if (newlyUnlocked.length > 0) {
        const newLumberjacks: ActiveLumberjack[] = newlyUnlocked.map(
          (tier) => ({
            ...tier,
            lumberjackId: uuidv4(),
            character: generateRandomCharacter(),
          })
        );
        setUnlockedLumberjacks((prev) => [...prev, ...newLumberjacks]);
      }
    }
  }, [clickCount, unlockedLumberjacks]);

  // Perform auto-click for a specific lumberjack
  const performAutoClick = useCallback(
    async (lumberjackId: string) => {
      if (isAutoClickProcessingRef.current || !isTransactionReady) {
        return;
      }

      const lumberjack = unlockedLumberjacksRef.current.find(
        (lj) => lj.lumberjackId === lumberjackId
      );

      if (!lumberjack) {
        return;
      }

      isAutoClickProcessingRef.current = true;
      try {
        await onAutoClickRef.current();
      } finally {
        isAutoClickProcessingRef.current = false;
      }
    },
    [isTransactionReady]
  );

  // Manage lumberjack autoclick intervals
  useEffect(() => {
    const currentTimers = lumberjackTimersRef.current;
    const activeLumberjackIds = new Set(
      unlockedLumberjacksRef.current.map((lj) => lj.lumberjackId)
    );

    // Clear timers for removed lumberjacks
    Object.keys(currentTimers).forEach((timerLumberjackId) => {
      if (!activeLumberjackIds.has(timerLumberjackId)) {
        clearInterval(currentTimers[timerLumberjackId]);
        delete currentTimers[timerLumberjackId];
      }
    });

    // Set up timers for each lumberjack
    unlockedLumberjacksRef.current.forEach((lj) => {
      if (currentTimers[lj.lumberjackId]) {
        clearInterval(currentTimers[lj.lumberjackId]);
      }

      const idForThisInterval = lj.lumberjackId;
      const intervalMsForThisInterval = lj.clickIntervalMs;

      currentTimers[idForThisInterval] = setInterval(() => {
        performAutoClick(idForThisInterval);
      }, intervalMsForThisInterval);
    });

    return () => {
      Object.values(lumberjackTimersRef.current).forEach((timerId) =>
        clearInterval(timerId)
      );
      lumberjackTimersRef.current = {};
    };
  }, [unlockedLumberjacks, performAutoClick]);

  // Get a lumberjack by its ID
  const getLumberjack = useCallback(
    (lumberjackId: string) => {
      return unlockedLumberjacks.find((lj) => lj.lumberjackId === lumberjackId);
    },
    [unlockedLumberjacks]
  );

  return {
    unlockedLumberjacks,
    getLumberjack,
    tiers: LUMBERJACK_TIERS,
  };
}


