/**
 * Nebula types and interfaces
 */

export type NebulaType =
  | "emission"
  | "reflection"
  | "planetary"
  | "dark"
  | "supernova_remnant";

export interface NebulaData {
  id: string;
  type: NebulaType;
  name: string;
  position: [number, number, number];
  size: number; // Radius of the nebula
  color: string; // Primary color
  secondaryColor?: string; // Secondary color for mixing
  opacity: number; // Base opacity (0-1)
  density: number; // Density of the gas (affects visual thickness)
  rotation: [number, number, number]; // Rotation angles (x, y, z)
  animationSpeed: number; // Speed of internal animation/rotation
  glowIntensity: number; // Intensity of the glow effect
  particles?: number; // Number of particles to render (for more detail)
}

export interface NebulaConfig {
  name: string;
  type: NebulaType;
  description: string;
  visual: {
    baseColor: string;
    secondaryColor?: string;
    glowIntensity: number;
    opacity: {
      min: number;
      max: number;
    };
    density: {
      min: number;
      max: number;
    };
    size: {
      min: number;
      max: number;
    };
    animationSpeed: {
      min: number;
      max: number;
    };
  };
  rarity: number; // 0-1, probability of appearing in a system
  preferredStarTypes?: string[]; // Star types this nebula prefers
}
