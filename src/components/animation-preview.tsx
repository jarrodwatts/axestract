"use client";

import React, { useEffect, useRef, useCallback } from "react";
import actions from "@/config/contracts/actions";
import Character from "@/types/character";
import directions from "@/types/direction";
import { useCharacterImages } from "@/hooks/use-character-images";
import { useFrameAnimation } from "@/hooks/use-frame-animation";
import { drawCharacterLayers, CANVAS_SIZE } from "@/lib/render-character/canvas-utils";
import {
  getCharacterLayerPath,
  getToolPath,
} from "@/lib/render-character/character-paths";
import characterProperties from "@/config/character/character-properties";

interface AnimationCanvasProps {
  character: Character; // character to animate
  action: keyof typeof actions; // action for character e.g. "walk" or "axe"
  direction?: keyof typeof directions; // direction for the animation to play
  isAnimating?: boolean; // flag to indicate if the animation is playing we can toggle
  canvasSize?: number; // size of the canvas to draw
  drawWidth?: number; // within the canvas, how wide to draw the character
  drawHeight?: number; // within the canvas, how tall to draw the character
  style?: React.CSSProperties; // style to apply to the canvas
}

const AnimationPreview: React.FC<AnimationCanvasProps> = ({
  character,
  action,
  direction = "right",
  isAnimating = false,
  canvasSize = CANVAS_SIZE,
  drawWidth,
  drawHeight,
  style,
}) => {
  // Keep a reference to the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get the file path of the image to render for each layer of the character
  const getFilePathForLayer = useCallback(
    (layer: keyof typeof characterProperties) =>
      getCharacterLayerPath(character, action, layer),
    [action, character]
  );

  // Get special file path for the axe/tool
  const getToolFilePath = useCallback(() => getToolPath(action), [action]);

  // Load all of the character images we want to draw on the canvas.
  const { layerImages, toolImage, isLoading } = useCharacterImages(
    character,
    action,
    getFilePathForLayer,
    getToolFilePath
  );

  // Get the current frame of the animation to draw
  // Each spritesheet has a set number of frames, and we want to animate through them.
  const { currentFrame } = useFrameAnimation(
    action,
    isAnimating,
    isLoading,
  );

  // Draw the animation frame on the canvas
  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas before drawing the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Layer by layer, draw the character on the canvas for the current frame of the animation.
    drawCharacterLayers(
      ctx,
      canvas,
      layerImages,
      character,
      currentFrame,
      action,
      direction,
      drawWidth,
      drawHeight,
      toolImage
    );
  }, [
    layerImages,
    toolImage,
    currentFrame,
    character,
    action,
    direction,
    isLoading,
    drawWidth,
    drawHeight,
  ]);

  // Render the canvas with the current frame of the animation.
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="z-20"
      style={style}
    />
  );
};

export default AnimationPreview;
