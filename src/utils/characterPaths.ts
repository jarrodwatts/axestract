import actions from "@/const/actions";
import characterProperties from "@/const/characterProperties";
import Character from "@/types/Character";

/**
 * Get the file path for a character layer animation sprite.
 * Used by both AnimationPreview and MiniMiningInstance to load character sprites.
 */
export function getCharacterLayerPath(
  character: Character,
  action: keyof typeof actions,
  layer: keyof typeof characterProperties
): string {
  if (!character[layer] || !actions[action]) return "";

  const filePath = `animations/${actions[action].path}/${characterProperties[layer].path}/`;
  const file =
    characterProperties[layer].files[character[layer]?.type as number];
  const fileWithoutType = file.split(".")[0];
  const fileWithAction = `${fileWithoutType}_${action}`;

  return `${filePath}${fileWithAction}.${file.split(".")[1]}`;
}

/**
 * Get the file path for the tool animation sprite.
 * Returns empty string for actions that don't use tools (like walking).
 */
export function getToolPath(action: keyof typeof actions): string {
  if (!actions[action] || action === "walk") return "";
  return `animations/${actions[action].path}/e-tool/axe.png`;
}

/**
 * Creates a callback function for getting layer file paths.
 * This is useful for hooks that need a stable callback reference.
 */
export function createLayerPathGetter(
  character: Character,
  action: keyof typeof actions
) {
  return (layer: keyof typeof characterProperties) =>
    getCharacterLayerPath(character, action, layer);
}

/**
 * Creates a callback function for getting tool file paths.
 * This is useful for hooks that need a stable callback reference.
 */
export function createToolPathGetter(action: keyof typeof actions) {
  return () => getToolPath(action);
}
