import { useState, useEffect, useRef } from "react";
import actions from "@/const/actions";

// Base animation speed in milliseconds (slower)
export const BASE_ANIMATION_SPEED_MS = 120;

/**
 * Custom hook to handle animation frame cycling
 * @param action - The action to animate
 * @param isAnimating - Whether the animation is currently playing
 * @param isLoading - Whether the animation is in a loading state
 */
export function useFrameAnimation(
  action: keyof typeof actions,
  isAnimating: boolean,
  isLoading: boolean
) {
  const animationFrameRef = useRef(0);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Reset animation frame when action changes or animation stops
  useEffect(() => {
    animationFrameRef.current = 0;
    setCurrentFrame(0);
  }, [action, isAnimating]);

  // Animation loop effect
  useEffect(() => {
    if (isLoading || !isAnimating) {
      return;
    }

    const interval = setInterval(() => {
      const nextFrame =
        animationFrameRef.current >= actions[action].animationFrameLength - 1
          ? 0
          : animationFrameRef.current + 1;
      animationFrameRef.current = nextFrame;
      setCurrentFrame(nextFrame);
    }, BASE_ANIMATION_SPEED_MS);

    return () => clearInterval(interval);
  }, [action, isLoading, isAnimating]);

  return { currentFrame };
}
