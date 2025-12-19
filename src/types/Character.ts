import characterProperties from "@/config/character/characterProperties";

type Character = {
  [key in keyof typeof characterProperties]?: {
    type: number;
    color: number;
  };
};

export default Character;
