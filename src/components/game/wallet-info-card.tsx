"use client";

import React from "react";
import Image from "next/image";
import { chain } from "@/config/chain";
import styles from "../game-frame.module.css";

interface WalletInfoCardProps {
  address?: `0x${string}`;
}

/**
 * Displays the connected wallet address with a link to the block explorer.
 */
export function WalletInfoCard({ address }: WalletInfoCardProps) {
  return (
    <div
      className={`${styles.gameFrameThin} min-h-[72px] flex flex-row items-center gap-4 w-full`}
    >
      <Image
        src="/abs.svg"
        alt="Abstract Wallet"
        width={36}
        height={36}
        className="flex-shrink-0"
        style={{
          filter: "invert(0) brightness(0)",
        }}
      />
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        <span className="font-bold text-[#5a4a1a] text-sm sm:text-md leading-none mb-1">
          Your Wallet
        </span>
        <span className="flex items-center gap-1.5">
          {address ? (
            <a
              href={`${chain.blockExplorers?.default.url}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#5a4a1a] opacity-85 underline transition-opacity duration-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[180px] md:max-w-[220px] hover:opacity-100 text-xs sm:text-sm"
              title="View on abscan.org"
            >
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 opacity-70"
              >
                <path
                  d="M5 11L11 5"
                  stroke="#5a4a1a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M7.5 5H11V8.5"
                  stroke="#5a4a1a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ) : (
            "Not connected"
          )}
        </span>
      </div>
    </div>
  );
}

export default WalletInfoCard;


