"use client";

import React from "react";
import { Pointer } from "../magicui/pointer";
import { Ripple } from "../magicui/ripple";
import styles from "../game-frame.module.css";

interface ClickAreaProps {
  onPointerDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * The main clickable area where users chop trees.
 * Displays the "CLICK TO CHOP!" message with visual effects.
 */
export function ClickArea({ onPointerDown }: ClickAreaProps) {
  return (
    <div className="relative">
      <Pointer>
        <span style={{ fontSize: "64px" }}>🪓</span>
      </Pointer>
      <div
        id="mini-game-spawn-area"
        onPointerDown={onPointerDown}
        className={`${styles.gameFrame} relative w-full h-50 md:h-70 flex items-center justify-center cursor-pointer bg-green-100 hover:bg-green-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95 overflow-hidden`}
      >
        <Ripple />
        <span className="text-2xl font-bold text-green-700 select-none z-10 text-center">
          CLICK TO CHOP!
        </span>
      </div>
    </div>
  );
}

export default ClickArea;


