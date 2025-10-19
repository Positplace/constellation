import { randomInt, randomRange } from "./noiseUtils";
import { SIMPLE_ASTEROID_SIZES } from "./asteroidSizingSimple";
import {
  AsteroidData,
  AsteroidBeltData,
  AsteroidBeltGenerationParams,
  AsteroidGenerationParams,
  MaterialType,
  ResourceData,
} from "../types/asteroid.types";

// Material distribution based on belt type and location
const MATERIAL_DISTRIBUTIONS = {
  inner: {
    silicate: 70,
    iron: 25,
    nickel: 3,
    carbonaceous: 1,
    ice: 0,
    platinum: 0.5,
    gold: 0.3,
    rare_earth: 0.2,
  },
  outer: {
    silicate: 15,
    iron: 5,
    nickel: 1,
    carbonaceous: 40,
    ice: 35,
    platinum: 1,
    gold: 0.5,
    rare_earth: 2.5,
  },
};

// Rare metals that can be found in asteroids
const RARE_METALS = {
  platinum: ["Platinum", "Palladium", "Iridium", "Rhodium"],
  gold: ["Gold", "Silver"],
  rare_earth: ["Neodymium", "Dysprosium", "Terbium", "Yttrium"],
};

/**
 * Generate a random asteroid name
 */
function generateAsteroidName(seed: number): string {
  const prefixes = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
  ];

  const suffixes = [
    "Rock",
    "Stone",
    "Boulder",
    "Chunk",
    "Fragment",
    "Shard",
    "Debris",
    "Chip",
    "Pebble",
    "Grain",
    "Mass",
    "Node",
    "Core",
    "Vein",
  ];

  const prefixIndex = seed % prefixes.length;
  const suffixIndex = Math.floor(seed / prefixes.length) % suffixes.length;

  return `${prefixes[prefixIndex]} ${suffixes[suffixIndex]}`;
}

/**
 * Select material type based on belt type and probability distribution
 */
function selectMaterialType(
  beltType: "inner" | "outer",
  seed: number
): MaterialType {
  const distribution = MATERIAL_DISTRIBUTIONS[beltType];
  let total = 0;
  for (const type in distribution) {
    total += distribution[type as MaterialType];
  }

  // Build cumulative probability array
  const cumulative: { type: MaterialType; prob: number }[] = [];
  let sum = 0;

  for (const type in distribution) {
    const prob = distribution[type as MaterialType];
    sum += prob;
    cumulative.push({ type: type as MaterialType, prob: sum });
  }

  // Use seeded random to select
  const rand = randomRange(0, total, seed);

  for (const item of cumulative) {
    if (rand <= item.prob) {
      return item.type;
    }
  }

  // Fallback to silicate
  return "silicate";
}

/**
 * Generate resource data for an asteroid
 */
function generateResources(material: MaterialType, seed: number): ResourceData {
  const baseAbundance = randomRange(80, 100, seed + 100);

  // Determine rare metals based on material type
  let rareMetals: string[] = [];

  if (material === "platinum" || randomRange(0, 100, seed + 200) < 2) {
    rareMetals.push(
      ...RARE_METALS.platinum.slice(0, randomInt(1, 3, seed + 300))
    );
  }

  if (material === "gold" || randomRange(0, 100, seed + 400) < 1.5) {
    rareMetals.push(...RARE_METALS.gold.slice(0, randomInt(1, 2, seed + 500)));
  }

  if (material === "rare_earth" || randomRange(0, 100, seed + 600) < 1) {
    rareMetals.push(
      ...RARE_METALS.rare_earth.slice(0, randomInt(1, 3, seed + 700))
    );
  }

  return {
    material,
    abundance: baseAbundance,
    rareMetals,
  };
}

/**
 * Generate a single asteroid
 */
export function generateAsteroid(
  params: AsteroidGenerationParams
): AsteroidData {
  const { beltType, orbitalDistance, seed } = params;

  const material = selectMaterialType(beltType, seed);
  const resources = generateResources(material, seed);

  // Size variation using SIMPLE config - extremely small asteroids
  const size = randomRange(
    SIMPLE_ASTEROID_SIZES.MIN_SIZE,
    SIMPLE_ASTEROID_SIZES.MAX_SIZE,
    seed + 10
  );

  // Random orbital angle
  const angle = randomRange(0, Math.PI * 2, seed + 20);

  // Orbital eccentricity (small for most asteroids)
  const eccentricity = randomRange(0, 0.05, seed + 30); // Reduced eccentricity for more circular orbits

  // Orbital speed using Kepler's third law (v ∝ 1/√r)
  // All asteroids in the belt move in the same direction with speed based on distance
  const baseSpeed = 0.15; // Base orbital speed
  const orbitalSpeed = baseSpeed / Math.sqrt(orbitalDistance); // Kepler's law approximation

  // Rotation properties
  const axisTheta = randomRange(0, Math.PI, seed + 50);
  const axisPhi = randomRange(0, Math.PI * 2, seed + 60);
  const rotationAxis: [number, number, number] = [
    Math.sin(axisTheta) * Math.cos(axisPhi),
    Math.cos(axisTheta),
    Math.sin(axisTheta) * Math.sin(axisPhi),
  ];
  const rotationDirection: 1 | -1 = Math.random() < 0.2 ? -1 : 1;
  const rotationSpeed = randomRange(0.1, 2.0, seed + 70);

  // Calculate position in 3D space (simplified orbital position)
  const x = Math.cos(angle) * orbitalDistance;
  const z = Math.sin(angle) * orbitalDistance;
  const y = randomRange(-0.02, 0.02, seed + 80); // very slight vertical variation for tight clustering

  const name = generateAsteroidName(seed);

  return {
    id: `asteroid-${seed}`,
    name,
    position: [x, y, z],
    size,
    rotation: {
      axis: rotationAxis,
      speed: rotationSpeed,
      direction: rotationDirection,
    },
    orbital: {
      distance: orbitalDistance,
      speed: orbitalSpeed,
      angle,
      eccentricity,
    },
    material,
    resources,
    shapeSeed: seed + 1000,
    seed,
  };
}

/**
 * Generate an asteroid belt
 */
export function generateAsteroidBelt(
  params: AsteroidBeltGenerationParams
): AsteroidBeltData {
  const { innerRadius, outerRadius, asteroidCount, beltType, seed } = params;

  const beltId = `belt-${seed}`;
  const beltName = `${beltType === "inner" ? "Inner" : "Outer"} Asteroid Belt`;

  // Generate individual asteroids
  const asteroids: AsteroidData[] = [];

  for (let i = 0; i < asteroidCount; i++) {
    const asteroidSeed = seed + 10000 + i * 100;

    // Distribute asteroids more tightly clustered for a denser belt appearance
    const t = i / (asteroidCount - 1); // 0 to 1
    const logT = Math.log(1 + t * 9) / Math.log(10); // logarithmic scale

    let orbitalDistance = innerRadius + logT * (outerRadius - innerRadius);

    // Add minimal randomness to keep asteroids clustered (±5% instead of ±15%)
    const variance = randomRange(-0.05, 0.05, asteroidSeed + 50);
    orbitalDistance = orbitalDistance * (1 + variance);

    // Ensure asteroids stay within belt bounds
    orbitalDistance = Math.max(
      innerRadius,
      Math.min(outerRadius, orbitalDistance)
    );

    const asteroid = generateAsteroid({
      beltType,
      orbitalDistance,
      seed: asteroidSeed,
    });

    asteroids.push(asteroid);
  }

  return {
    id: beltId,
    name: beltName,
    innerRadius,
    outerRadius,
    asteroidCount,
    asteroids,
    seed,
    materialDistribution: MATERIAL_DISTRIBUTIONS[beltType],
  };
}

/**
 * Determine if a system should have asteroid belts and where to place them
 */
export function calculateAsteroidBeltPositions(
  planetOrbits: number[],
  seed?: number
): Array<{
  innerRadius: number;
  outerRadius: number;
  beltType: "inner" | "outer";
}> {
  const actualSeed = seed ?? Math.floor(Math.random() * 1e9);
  const belts: Array<{
    innerRadius: number;
    outerRadius: number;
    beltType: "inner" | "outer";
  }> = [];

  // 80% chance to have at least one belt (was effectively 30% due to inverted check)
  if (randomRange(0, 100, actualSeed) > 80) {
    return belts; // 20% chance of no belts
  }

  // Sort planet orbits
  const sortedOrbits = [...planetOrbits].sort((a, b) => a - b);

  // Build list of gaps between adjacent orbits
  const gaps: Array<{ index: number; from: number; to: number; size: number }> =
    [];
  for (let i = 0; i < sortedOrbits.length - 1; i++) {
    const from = sortedOrbits[i];
    const to = sortedOrbits[i + 1];
    gaps.push({ index: i, from, to, size: to - from });
  }

  // Choose up to two largest gaps; allow belts even if gap < 1 AU by using relative margins
  gaps
    .sort((a, b) => b.size - a.size)
    .slice(0, 2)
    .forEach((g, idx) => {
      if (g.size <= 0) return;
      // Use larger margins (25%) to keep belts away from planets
      const margin = Math.max(0.15, g.size * 0.25);
      const gapCenter = (g.from + g.to) / 2;
      // Make belt width tighter: 30% of available space instead of 70%
      const beltWidth = Math.min(0.5, (g.to - g.from - 2 * margin) * 0.3);
      const inner = gapCenter - beltWidth / 2;
      const outer = gapCenter + beltWidth / 2;
      if (outer - inner <= 0.05) return; // too thin
      const beltType: "inner" | "outer" = gapCenter < 3.0 ? "inner" : "outer";
      belts.push({ innerRadius: inner, outerRadius: outer, beltType });
    });

  // If no suitable gaps found, create a compact belt just outside the largest orbit
  if (belts.length === 0 && sortedOrbits.length > 0) {
    const lastPlanetOrbit = Math.max(...sortedOrbits);
    const outerBeltInner =
      lastPlanetOrbit + randomRange(0.5, 0.8, actualSeed + 90); // More distance from planet
    const outerBeltOuter =
      outerBeltInner + randomRange(0.3, 0.5, actualSeed + 100); // Narrower belt
    belts.push({
      innerRadius: outerBeltInner,
      outerRadius: outerBeltOuter,
      beltType: "outer",
    });
  }

  return belts;
}
