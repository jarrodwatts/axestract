"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import generateRandomCharacter from "@/lib/render-character/generate-random-character";
import Character from "@/types/character";
import {
  type ActiveLumberjack,
  type BurstingWoodEmoji,
  type ActiveMiniGame,
} from "@/types/game";
import { useConnection } from "wagmi";
import { useUserClicks } from "@/hooks/use-user-clicks";
import { useClickTransaction } from "@/hooks/use-click-transaction";
import { NumberTicker } from "./magicui/number-ticker";
import { v4 as uuidv4 } from "uuid";
import { scheduleFadeOut } from "@/lib/game/fade-out-mini-game";
import { LUMBERJACK_TIERS } from "@/config/character/lumberjack-tiers";
import {
  ClickArea,
  WalletInfoCard,
  LumberjackGrid,
  MiniGameList,
  WoodBurstEffect,
} from "./game";

/**
 * The core code for the game.
 * Controls everything in the game like total click count, clicking, spawning the miner cards, etc.
 */
export default function MiningGame({
  character: initialCharacter,
}: {
  character?: Character;
}) {
  // Get connected wallet address
  const { address } = useConnection();

  // Read the total number of clicks the user has made
  const {
    clickCount,
    isLoading: isClicksLoading,
    incrementClickCount,
  } = useUserClicks();

  // Transaction management hook
  const {
    isReady: isTransactionReady,
    submitClick,
    getNextNonce,
    isError: isTransactionError,
    error: transactionError,
    refetch: refetchTransaction,
  } = useClickTransaction();

  // Generate a random character to use throughout the game
  const [character] = useState(
    () => initialCharacter || generateRandomCharacter()
  );

  // Keep track of a separate, "local" click count that is not stored onchain
  const [localClickCount, setLocalClickCount] = useState(0);

  // Keep track of all the active mini-games (the cards that spawn when you click)
  const [activeMiniGames, setActiveMiniGames] = useState<ActiveMiniGame[]>([]);

  // Keep track of all the unlocked lumberjacks
  const [unlockedLumberjacks, setUnlockedLumberjacks] = useState<
    ActiveLumberjack[]
  >([]);
  const lumberjackTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const unlockedLumberjacksRef = useRef(unlockedLumberjacks);
  const clickCountRef = useRef(clickCount);
  const performAutoClickRef = useRef<((id: string) => Promise<void>) | null>(
    null
  );

  // Flag to prevent multiple auto-clicks from happening at once
  const isAutoClickProcessingRef = useRef(false);

  // Animation states
  const [pulseClickCount, setPulseClickCount] = useState(false);
  const [burstingWoodEmojis, setBurstingWoodEmojis] = useState<
    BurstingWoodEmoji[]
  >([]);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for height synchronization of the left and right columns
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightScrollableContentRef = useRef<HTMLDivElement>(null);

  // Trigger pulse animation - called from event handlers instead of Effect
  const triggerPulse = useCallback(() => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    setPulseClickCount(true);
    pulseTimeoutRef.current = setTimeout(() => setPulseClickCount(false), 300);
  }, []);

  // Check and unlock lumberjacks - called from event handlers instead of Effect
  const checkAndUnlockLumberjacks = useCallback((newClickCount: number) => {
    const newlyUnlocked = LUMBERJACK_TIERS.filter(
      (tier) =>
        newClickCount >= tier.unlockThreshold &&
        !unlockedLumberjacksRef.current.some((lj) => lj.id === tier.id)
    );

    if (newlyUnlocked.length > 0) {
      const newLumberjacks: ActiveLumberjack[] = newlyUnlocked.map((tier) => ({
        ...tier,
        lumberjackId: uuidv4(),
        character: generateRandomCharacter(),
      }));
      setUnlockedLumberjacks((prev) => {
        const next = [...prev, ...newLumberjacks];
        unlockedLumberjacksRef.current = next;
        return next;
      });
    }
  }, []);

  // Sync the height of the left and right columns
  useEffect(() => {
    const synchronizeHeights = () => {
      if (leftColumnRef.current && rightScrollableContentRef.current) {
        const leftColumnHeight = leftColumnRef.current.offsetHeight;
        rightScrollableContentRef.current.style.maxHeight = `${leftColumnHeight}px`;
      }
    };

    synchronizeHeights();
    window.addEventListener("resize", synchronizeHeights);
    return () => window.removeEventListener("resize", synchronizeHeights);
  }, [activeMiniGames.length]);

  // Submit transaction and update mini-game state
  const submitTransaction = useCallback(
    async (gameId: string, nonce: number) => {
      const result = await submitClick(nonce);

      if (result.success && result.txHash) {
        setActiveMiniGames((prevGames) =>
          prevGames.map((game) =>
            game.id === gameId ? { ...game, txHash: result.txHash } : game
          )
        );
      } else {
        setActiveMiniGames((prev) =>
          prev.map((g) =>
            g.id === gameId
              ? {
                ...g,
                uiState: "failed",
                errorMessage: result.error,
                finalizedTimestamp: Date.now(),
                isVisuallyRemoving: false,
              }
              : g
          )
        );
        scheduleFadeOut(gameId, setActiveMiniGames);
      }
    },
    [submitClick]
  );

  // Auto-click for lumberjacks
  const performAutoClick = useCallback(
    async (lumberjackId: string) => {
      if (isAutoClickProcessingRef.current || !isTransactionReady) {
        return;
      }

      isAutoClickProcessingRef.current = true;
      let gameIdForThisAutoClick: string | undefined;

      try {
        const lumberjack = unlockedLumberjacksRef.current.find(
          (lj) => lj.lumberjackId === lumberjackId
        );

        if (!lumberjack) {
          isAutoClickProcessingRef.current = false;
          return;
        }

        const nonceForThisTx = getNextNonce();
        if (nonceForThisTx === undefined) {
          isAutoClickProcessingRef.current = false;
          return;
        }

        incrementClickCount();
        triggerPulse();
        const newCount = (clickCountRef.current ?? 0) + 1;
        checkAndUnlockLumberjacks(newCount);
        gameIdForThisAutoClick = uuidv4();

        const newMiniGame: ActiveMiniGame = {
          id: gameIdForThisAutoClick,
          character: lumberjack.character,
          initialClickCount: clickCountRef.current ?? 0,
          uiState: "submitting",
          clickTimestamp: Date.now(),
          isVisuallyRemoving: false,
        };
        setActiveMiniGames((prevGames) =>
          [newMiniGame, ...prevGames].slice(0, 50)
        );

        await submitTransaction(gameIdForThisAutoClick, nonceForThisTx);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (gameIdForThisAutoClick) {
          setActiveMiniGames((prev) =>
            prev.map((g) =>
              g.id === gameIdForThisAutoClick
                ? {
                  ...g,
                  uiState: "failed",
                  errorMessage,
                  finalizedTimestamp: Date.now(),
                  isVisuallyRemoving: false,
                }
                : g
            )
          );
          scheduleFadeOut(gameIdForThisAutoClick, setActiveMiniGames);
        }
      } finally {
        isAutoClickProcessingRef.current = false;
      }
    },
    [isTransactionReady, getNextNonce, incrementClickCount, triggerPulse, checkAndUnlockLumberjacks, submitTransaction]
  );

  // Keep refs updated for interval callbacks (consolidated into single effect)
  useEffect(() => {
    unlockedLumberjacksRef.current = unlockedLumberjacks;
    clickCountRef.current = clickCount;
    performAutoClickRef.current = performAutoClick;
  }, [unlockedLumberjacks, clickCount, performAutoClick]);

  // Manage lumberjack autoclick intervals
  useEffect(() => {
    const currentTimers = lumberjackTimersRef.current;
    const activeLumberjackIds = new Set(
      unlockedLumberjacksRef.current.map((lj) => lj.lumberjackId)
    );

    Object.keys(currentTimers).forEach((timerLumberjackId) => {
      if (!activeLumberjackIds.has(timerLumberjackId)) {
        clearInterval(currentTimers[timerLumberjackId]);
        delete currentTimers[timerLumberjackId];
      }
    });

    unlockedLumberjacksRef.current.forEach((lj) => {
      if (currentTimers[lj.lumberjackId]) {
        clearInterval(currentTimers[lj.lumberjackId]);
      }

      const idForThisInterval = lj.lumberjackId;
      const intervalMsForThisInterval = lj.clickIntervalMs;

      currentTimers[idForThisInterval] = setInterval(() => {
        if (performAutoClickRef.current) {
          performAutoClickRef.current(idForThisInterval);
        }
      }, intervalMsForThisInterval);
    });

    return () => {
      Object.values(lumberjackTimersRef.current).forEach((timerId) =>
        clearInterval(timerId)
      );
      lumberjackTimersRef.current = {};
    };
  }, [unlockedLumberjacks]);

  // Handle manual click
  const handleGameAreaClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const currentLocalClick = localClickCount + 1;
      setLocalClickCount(currentLocalClick);

      if (!isTransactionReady) {
        return;
      }

      const nonceForThisTx = getNextNonce();
      if (nonceForThisTx === undefined) {
        return;
      }

      incrementClickCount();
      triggerPulse();
      const newCount = (clickCount ?? 0) + 1;
      checkAndUnlockLumberjacks(newCount);

      const newMiniGameId = uuidv4();
      const newMiniGame: ActiveMiniGame = {
        id: newMiniGameId,
        character: character,
        initialClickCount: currentLocalClick,
        uiState: "submitting",
        clickTimestamp: Date.now(),
        isVisuallyRemoving: false,
      };
      setActiveMiniGames((prevGames) => [newMiniGame, ...prevGames]);
      submitTransaction(newMiniGameId, nonceForThisTx);

      // Play sound effect
      const audio = new Audio("/wood-break.mp3");
      audio.play();

      // Spawn burst emojis
      const numEmojisToSpawn = 3;
      const newEmojis: BurstingWoodEmoji[] = [];
      for (let i = 0; i < numEmojisToSpawn; i++) {
        newEmojis.push({
          id: uuidv4(),
          x: event.clientX,
          y: event.clientY,
          randomOffsetX: (Math.random() - 0.5) * 150,
          randomOffsetY: (Math.random() - 0.5) * 150,
          randomRotation: (Math.random() - 0.5) * 90,
        });
      }

      setBurstingWoodEmojis((prevEmojis) => [...prevEmojis, ...newEmojis]);

      setTimeout(() => {
        setBurstingWoodEmojis((prevEmojis) =>
          prevEmojis.filter(
            (emoji) => !newEmojis.some((ne) => ne.id === emoji.id)
          )
        );
      }, 1000);
    },
    [
      localClickCount,
      isTransactionReady,
      getNextNonce,
      incrementClickCount,
      triggerPulse,
      checkAndUnlockLumberjacks,
      clickCount,
      character,
      submitTransaction,
    ]
  );

  // Handle transaction completion from TransactionMonitor
  const handleTransactionCompletion = useCallback(
    (gameId: string) => (success: boolean) => {
      setActiveMiniGames((prev) =>
        prev.map((g) => {
          if (g.id === gameId) {
            return {
              ...g,
              uiState: success ? "confirmed" : "failed",
              finalizedTimestamp: Date.now(),
              isVisuallyRemoving: false,
            };
          }
          return g;
        })
      );
      scheduleFadeOut(gameId, setActiveMiniGames);
    },
    []
  );

  // Error state
  if (isTransactionError) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-8 text-center">
        <div className="text-red-500 text-xl mb-4">
          Failed to load game data
        </div>
        <p className="text-[#5a4a1a] mb-6">
          {transactionError?.message ||
            "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={refetchTransaction}
          className="px-6 py-3 bg-[#a86b2d] text-white rounded-lg hover:bg-[#8b5a2b] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 md:pt-8 z-10">
      {/* Click Counter */}
      <div className="w-full mb-8 md:mb-14 text-center animate-subtle-grow-shrink">
        <span className="text-xl font-semibold text-[#5a4a1a] mb-2 block">
          Total Clicks
        </span>
        {isClicksLoading ? (
          <span className="text-5xl md:text-7xl font-bold text-[#5a4a1a] opacity-80 inline-block">
            Loading...
          </span>
        ) : (
          <NumberTicker
            value={clickCount || 0}
            className={`mt-2 text-5xl md:text-7xl font-bold text-[#5a4a1a] transition-transform duration-300 ease-out inline-block ${pulseClickCount ? "scale-125" : "scale-100"
              }`}
          />
        )}
      </div>

      <div className="flex flex-col md:flex-row w-full gap-x-8 gap-y-4 items-start">
        {/* Left Column */}
        <div
          ref={leftColumnRef}
          className="flex flex-col gap-6 w-full md:w-1/2 order-1"
        >
          <ClickArea onPointerDown={handleGameAreaClick} />
          <WalletInfoCard address={address} />
          <LumberjackGrid unlockedLumberjacks={unlockedLumberjacks} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col w-full md:w-1/2 order-2">
          <MiniGameList
            activeMiniGames={activeMiniGames}
            onTransactionCompletion={handleTransactionCompletion}
            scrollRef={rightScrollableContentRef}
          />
        </div>
      </div>

      <WoodBurstEffect emojis={burstingWoodEmojis} />
    </div>
  );
}
