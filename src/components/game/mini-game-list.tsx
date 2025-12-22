"use client";

import React from "react";
import MiniMiningInstance from "./mini-mining-instance";
import TransactionMonitor from "./transaction-monitor";
import { type ActiveMiniGame } from "@/types/game";
import { chain } from "@/config/chain";

interface MiniGameListProps {
  activeMiniGames: ActiveMiniGame[];
  onTransactionCompletion: (gameId: string) => (success: boolean) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Displays the list of active mini-games (transaction cards).
 * Shows the status of each transaction as it progresses.
 */
export function MiniGameList({
  activeMiniGames,
  onTransactionCompletion,
  scrollRef,
}: MiniGameListProps) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 w-full flex flex-col gap-2 p-1 rounded-lg min-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-amber-200/50"
    >
      {activeMiniGames.map((game) => (
        <div
          key={game.id}
          className={`transition-opacity duration-500 ease-in-out ${game.isVisuallyRemoving ? "opacity-0" : "opacity-100"
            }`}
        >
          <MiniMiningInstance
            character={game.character}
            uiState={game.uiState}
            errorMessage={game.errorMessage}
            clickTimestamp={game.clickTimestamp}
            finalizedTimestamp={game.finalizedTimestamp}
            blockExplorerBaseUrl={chain.blockExplorers?.default.url}
            instanceCanvasSize={64}
            txHash={game.txHash}
          />
          {game.txHash &&
            game.uiState === "submitting" &&
            !game.isVisuallyRemoving && (
              <TransactionMonitor
                key={`monitor-${game.id}`}
                txHash={game.txHash}
                chainId={chain.id}
                onCompletion={onTransactionCompletion(game.id)}
              />
            )}
        </div>
      ))}
      {activeMiniGames.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center text-[#5a4a1a]/70 p-4">
          <p className="text-lg">
            No trees felled yet! Get to choppin&apos; by clicking &apos;CLICK TO
            CHOP!&apos;
            <br />
            Your mighty swings (transactions) will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default MiniGameList;


