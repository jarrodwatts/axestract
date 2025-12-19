import type { ActiveMiniGame } from "@/types/Game";

const FADE_START_DELAY = 1500;
const FADE_DURATION = 500;

/**
 * Schedules a mini-game card to fade out and be removed from the list.
 * This pattern is used after a transaction is confirmed, failed, or when prerequisites aren't met.
 */
export function scheduleFadeOut(
  gameId: string,
  setActiveMiniGames: React.Dispatch<React.SetStateAction<ActiveMiniGame[]>>
) {
  // Start the visual fade-out
  setTimeout(() => {
    setActiveMiniGames((prev) =>
      prev.map((g) =>
        g.id === gameId ? { ...g, isVisuallyRemoving: true } : g
      )
    );
  }, FADE_START_DELAY);

  // Remove from DOM after fade animation completes
  setTimeout(() => {
    setActiveMiniGames((prev) => prev.filter((g) => g.id !== gameId));
  }, FADE_START_DELAY + FADE_DURATION);
}
