"use client";

import React from "react";
import { type BurstingWoodEmoji } from "@/types/Game";

interface WoodBurstEffectProps {
  emojis: BurstingWoodEmoji[];
}

/**
 * Renders the wood burst emoji animation that plays when clicking.
 * Uses CSS custom properties for the burst animation offsets.
 */
export function WoodBurstEffect({ emojis }: WoodBurstEffectProps) {
  return (
    <>
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="wood-burst-emoji"
          style={
            {
              position: "fixed",
              left: `${emoji.x}px`,
              top: `${emoji.y}px`,
              pointerEvents: "none",
              zIndex: 9999,
              fontSize: "24px",
              "--offsetX": `${emoji.randomOffsetX}px`,
              "--offsetY": `${emoji.randomOffsetY}px`,
              "--rotation": `${emoji.randomRotation}deg`,
            } as React.CSSProperties
          }
        >
          🪵
        </div>
      ))}
    </>
  );
}

export default WoodBurstEffect;


