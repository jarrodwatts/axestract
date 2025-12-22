import characterProperties from "@/config/character/character-properties";

type Character = {
  [key in keyof typeof characterProperties]?: {
    type: number;
    color: number;
  };
};

export default Character;
