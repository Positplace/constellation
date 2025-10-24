/**
 * ⚠️ DEPRECATED: Client-side generation is deprecated for gameplay.
 * See: /src/utils/README_GENERATION.md
 */

import nebulaConfigs from "../data/nebulaConfigs.json";
import generationConfig from "../data/generationConfig.json";
import { NebulaData, NebulaType, NebulaConfig } from "../types/nebula.types";
import { randomRange, randomInt } from "./noiseUtils";
import { StarType } from "../types/game.types";

/**
 * Generate nebulae for a solar system
 * @param starType Type of star in the system
 * @param outerBoundary Outer boundary of the system
 * @param seed Random seed for generation
 * @returns Array of nebula data
 */
export function generateSystemNebulae(
  starType: StarType,
  outerBoundary: number,
  seed: number
): NebulaData[] {
  const nebulae: NebulaData[] = [];

  // Get all nebula types
  const nebulaTypes = Object.keys(nebulaConfigs) as NebulaType[];

  // Roll for each nebula type based on rarity
  for (let i = 0; i < nebulaTypes.length; i++) {
    const nebulaType = nebulaTypes[i];
    const config = (nebulaConfigs as any)[nebulaType] as NebulaConfig;

    // Check if this nebula type prefers this star type using config
    let rarityMultiplier = 1;
    if (config.preferredStarTypes && config.preferredStarTypes.length > 0) {
      if (config.preferredStarTypes.includes(starType)) {
        rarityMultiplier =
          generationConfig.nebulaGeneration.rarityMultipliers.preferredStarType;
      } else {
        rarityMultiplier =
          generationConfig.nebulaGeneration.rarityMultipliers
            .nonPreferredStarType;
      }
    }

    const adjustedRarity = config.rarity * rarityMultiplier;
    const roll = randomRange(0, 1, seed + i * 1000);

    if (roll < adjustedRarity) {
      // Generate this nebula
      const nebula = createNebula(
        nebulaType,
        config,
        outerBoundary,
        seed + i * 1000
      );
      nebulae.push(nebula);
    }
  }

  return nebulae;
}

/**
 * Create a single nebula
 */
function createNebula(
  type: NebulaType,
  config: NebulaConfig,
  systemBoundary: number,
  seed: number
): NebulaData {
  const visual = config.visual;

  // Generate random properties within config ranges
  // INCREASED: Make nebulae 3x bigger and more opaque for visibility
  const size = randomRange(visual.size.min, visual.size.max, seed + 1) * 1.2;
  const opacity = Math.max(
    0.6,
    randomRange(visual.opacity.min, visual.opacity.max, seed + 2)
  );
  const density = randomRange(visual.density.min, visual.density.max, seed + 3);
  const animationSpeed = randomRange(
    visual.animationSpeed.min,
    visual.animationSpeed.max,
    seed + 4
  );

  // Position nebula FAR behind/around the system for background effect
  // Use much larger multipliers to push them into the background
  const positionType = randomInt(0, 3, seed + 5);
  let position: [number, number, number];

  // Ensure minimum distance of 50 units from center
  const minDistance = Math.max(50, systemBoundary * 2);

  switch (positionType) {
    case 0: // Far behind the system
      position = [
        randomRange(-systemBoundary * 1.5, systemBoundary * 1.5, seed + 10),
        randomRange(-10, 10, seed + 11),
        randomRange(-minDistance * 1.5, -minDistance, seed + 12),
      ];
      break;
    case 1: // Far to the left
      position = [
        randomRange(-minDistance * 1.5, -minDistance, seed + 13),
        randomRange(-10, 10, seed + 14),
        randomRange(-systemBoundary * 1.5, systemBoundary * 1.5, seed + 15),
      ];
      break;
    case 2: // Far to the right
      position = [
        randomRange(minDistance, minDistance * 1.5, seed + 16),
        randomRange(-10, 10, seed + 17),
        randomRange(-systemBoundary * 1.5, systemBoundary * 1.5, seed + 18),
      ];
      break;
    default: // Surrounding (far back and to the side)
      const angle = randomRange(0, Math.PI * 2, seed + 19);
      const distance = randomRange(minDistance, minDistance * 1.8, seed + 20);
      position = [
        Math.cos(angle) * distance,
        randomRange(-15, 15, seed + 21),
        Math.sin(angle) * distance,
      ];
  }

  // Random rotation
  const rotation: [number, number, number] = [
    randomRange(0, Math.PI * 2, seed + 30),
    randomRange(0, Math.PI * 2, seed + 31),
    randomRange(0, Math.PI * 2, seed + 32),
  ];

  return {
    id: `nebula-${type}-${seed}`,
    type,
    name: config.name,
    position,
    size,
    color: visual.baseColor,
    secondaryColor: visual.secondaryColor,
    opacity,
    density,
    rotation,
    animationSpeed,
    glowIntensity: visual.glowIntensity,
    particles: Math.floor(size * 100), // More particles for larger nebulae
  };
}

/**
 * Generate a specific nebula (for testing or special systems)
 */
export function createSpecificNebula(
  type: NebulaType,
  position: [number, number, number],
  size: number,
  seed: number
): NebulaData {
  const config = (nebulaConfigs as any)[type] as NebulaConfig;
  if (!config) {
    throw new Error(`Unknown nebula type: ${type}`);
  }

  const visual = config.visual;
  const opacity = randomRange(visual.opacity.min, visual.opacity.max, seed + 1);
  const density = randomRange(visual.density.min, visual.density.max, seed + 2);
  const animationSpeed = randomRange(
    visual.animationSpeed.min,
    visual.animationSpeed.max,
    seed + 3
  );

  const rotation: [number, number, number] = [
    randomRange(0, Math.PI * 2, seed + 4),
    randomRange(0, Math.PI * 2, seed + 5),
    randomRange(0, Math.PI * 2, seed + 6),
  ];

  return {
    id: `nebula-${type}-${seed}`,
    type,
    name: config.name,
    position,
    size,
    color: visual.baseColor,
    secondaryColor: visual.secondaryColor,
    opacity,
    density,
    rotation,
    animationSpeed,
    glowIntensity: visual.glowIntensity,
    particles: Math.floor(size * 100),
  };
}
