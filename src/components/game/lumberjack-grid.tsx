"use client";

import React from "react";
import { LUMBERJACK_TIERS } from "@/config/character/lumberjack-tiers";
import { type ActiveLumberjack } from "@/types/game";
import LumberjackDisplayCard from "../lumberjack-display-card";

interface LumberjackGridProps {
  unlockedLumberjacks: ActiveLumberjack[];
}

/**
 * Displays a grid of all lumberjack tiers, showing which ones are unlocked.
 */
export function LumberjackGrid({ unlockedLumberjacks }: LumberjackGridProps) {
  return (
    <div className="w-full mt-2">
      <h3 className="font-bold text-[#5a4a1a] text-base mb-2">
        Unlocked Lumberjacks
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LUMBERJACK_TIERS.map((tier) => {
          const isUnlocked = unlockedLumberjacks.some(
            (lj) => lj.id === tier.id
          );
          const lumberjackInstance = unlockedLumberjacks.find(
            (lj) => lj.id === tier.id
          );

          return (
            <div
              key={tier.id}
              className={`
                relative p-2 border-4 rounded-lg flex flex-col items-center
                ${isUnlocked
                  ? "border-[#a86b2d] bg-[#d4e0a0]"
                  : "border-[#aaa] bg-[#ddd] opacity-50 cursor-not-allowed"
                }
              `}
            >
              {isUnlocked && lumberjackInstance ? (
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-1 flex items-center justify-center">
                  <LumberjackDisplayCard
                    character={lumberjackInstance.character}
                    canvasSize={48}
                  />
                </div>
              ) : (
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-1 flex items-center justify-center opacity-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
              )}
              <span className="text-xs sm:text-sm text-[#5a4a1a] font-medium text-center">
                {tier.displayName}
              </span>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-md">
                  <div className="bg-[#5a4a1a] text-white px-2 py-1 rounded text-xs text-center">
                    Unlocks at {tier.unlockThreshold}
                  </div>
                </div>
              )}
              {isUnlocked && (
                <span className="text-xs text-[#5a4a1a] opacity-80 mt-1">
                  {`${(60000 / tier.clickIntervalMs).toFixed(1)}/min`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LumberjackGrid;


