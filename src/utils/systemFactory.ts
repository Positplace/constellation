import starConfigs from "../data/starConfigs.json";
import { SolarSystem, StarType, StarData } from "../types/game.types";
import { PlanetData, PlanetType } from "../types/planet.types";
import { createPlanet } from "./planetFactory";
import { randomInt, randomRange } from "./noiseUtils";
import {
  generateAsteroidBelt,
  calculateAsteroidBeltPositions,
} from "./asteroidFactory";

const SYSTEM_NAMES = [
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
  "Rho",
  "Sigma",
  "Tau",
  "Upsilon",
  "Phi",
  "Chi",
  "Psi",
  "Omega",
  "Proxima",
  "Centauri",
  "Sirius",
  "Vega",
  "Rigel",
  "Betelgeuse",
  "Aldebaran",
  "Antares",
  "Arcturus",
  "Capella",
  "Pollux",
  "Regulus",
  "Spica",
  "Altair",
  "Deneb",
  "Fomalhaut",
  "Procyon",
  "Castor",
];

const SUFFIXES = [
  "Prime",
  "Major",
  "Minor",
  "Secundus",
  "Tertius",
  "Nova",
  "Antiqua",
  "System",
  "Cluster",
  "Nexus",
  "Haven",
  "Outpost",
  "Reach",
  "Station",
];

/**
 * Generate a random system name
 */
function generateSystemName(seed: number): string {
  const nameIndex = seed % SYSTEM_NAMES.length;
  const suffixIndex = Math.floor(seed / SYSTEM_NAMES.length) % SUFFIXES.length;

  if (seed % 3 === 0) {
    return SYSTEM_NAMES[nameIndex];
  }
  return `${SYSTEM_NAMES[nameIndex]} ${SUFFIXES[suffixIndex]}`;
}

/**
 * Select planet types based on star type configuration
 */
function selectPlanetType(starType: StarType, seed: number): PlanetType {
  const config = (starConfigs as any)[starType];
  const types = config.planetGeneration.types;

  // Build cumulative probability array
  const cumulative: { type: PlanetType; prob: number }[] = [];
  let sum = 0;

  for (const [type, prob] of Object.entries(types)) {
    sum += prob as number;
    cumulative.push({ type: type as PlanetType, prob: sum });
  }

  // Use seeded random to select
  const rand = randomRange(0, sum, seed);

  for (const item of cumulative) {
    if (rand <= item.prob) {
      return item.type;
    }
  }

  // Fallback
  return "terrestrial";
}

/**
 * Generate a complete solar system with star and planets
 */
export function generateSolarSystem(
  starType?: StarType,
  seed?: number,
  position?: [number, number, number],
  name?: string
): SolarSystem {
  const systemSeed = seed ?? Math.floor(Math.random() * 1e9);

  // Select random star type if not provided
  const starTypes: StarType[] = [
    "red_dwarf",
    "orange_star",
    "yellow_star",
    "white_star",
    "blue_giant",
    "red_giant",
    "white_dwarf",
  ];
  const selectedStarType = starType ?? starTypes[systemSeed % starTypes.length];

  // Get star configuration
  const starConfig = (starConfigs as any)[selectedStarType];

  // Create star data
  const star: StarData = {
    type: selectedStarType,
    name: starConfig.name,
    color: starConfig.visual.color,
    glowColor: starConfig.visual.glowColor,
    size: starConfig.visual.size,
    temperature: starConfig.visual.temperature,
    luminosity: starConfig.visual.luminosity,
  };

  // Generate system name
  const systemName = name ?? generateSystemName(systemSeed);

  // Determine number of planets
  const planetCount = randomInt(
    starConfig.planetGeneration.count.min,
    starConfig.planetGeneration.count.max,
    systemSeed + 1
  );

  // Generate planets with proper spacing
  const planets: PlanetData[] = [];
  const habitableZoneMin = starConfig.habitableZone.min;
  const habitableZoneMax = starConfig.habitableZone.max;

  // Calculate safe minimum distance from sun (based on star size)
  // Sun radius in scene units is star.size, we need at least 2-3x that for planet orbit
  const sunSafeDistance = Math.max(star.size * 3, 0.5);

  // Calculate system range - inner planets to outer planets
  const innerBoundary = Math.max(sunSafeDistance, habitableZoneMin * 0.5);
  const outerBoundary = habitableZoneMax * 5;

  // Generate planet orbital distances with proper spacing
  const orbitalDistances: number[] = [];

  for (let i = 0; i < planetCount; i++) {
    const planetSeed = systemSeed + 1000 + i * 100;

    // Use a logarithmic distribution for more realistic spacing
    // Inner planets are closer together, outer planets are more spread out
    const t = i / (planetCount - 1); // 0 to 1
    const logT = Math.log(1 + t * 9) / Math.log(10); // Logarithmic scale

    let baseDistance = innerBoundary + logT * (outerBoundary - innerBoundary);

    // Add some randomness to each orbit (±15%)
    const variance = randomRange(-0.15, 0.15, planetSeed + 50);
    baseDistance = baseDistance * (1 + variance);

    // Ensure minimum spacing between consecutive planets
    if (i > 0) {
      const minSpacing = 0.3;
      const previousDistance = orbitalDistances[i - 1];
      baseDistance = Math.max(baseDistance, previousDistance + minSpacing);
    }

    orbitalDistances.push(baseDistance);
  }

  // Now create planets with calculated distances
  for (let i = 0; i < planetCount; i++) {
    const planetSeed = systemSeed + 1000 + i * 100;
    const orbitalDistance = orbitalDistances[i];

    // Select planet type based on star type probabilities
    const planetType = selectPlanetType(selectedStarType, planetSeed);

    // Determine if this planet should be in the habitable zone
    const inHabitableZone =
      orbitalDistance >= habitableZoneMin &&
      orbitalDistance <= habitableZoneMax;

    // Adjust planet type if in habitable zone
    let finalPlanetType = planetType;
    if (
      inHabitableZone &&
      (planetType === "terrestrial" || planetType === "desert_world")
    ) {
      // Give a chance to make it more habitable
      if (randomRange(0, 1, planetSeed + 60) > 0.6) {
        finalPlanetType =
          randomRange(0, 1, planetSeed + 61) > 0.5
            ? "earth_like"
            : "ocean_world";
      }
    }

    // Create planet
    const planet = createPlanet(
      {
        type: finalPlanetType,
        size: randomRange(0, 1, planetSeed + 2) > 0.7 ? "large" : "medium",
        age: starConfig.systemAge as any,
        habitability: inHabitableZone ? "habitable" : "marginal",
        seed: planetSeed,
      },
      undefined
    );

    // Override orbital distance to match our calculated value
    planet.orbitalDistance = orbitalDistance;

    planets.push(planet);
  }

  // Calculate system position
  const systemPosition = position ?? [0, 0, 0];

  // Generate asteroid belts
  const asteroidBelts = [];
  const planetOrbits = orbitalDistances;
  const beltPositions = calculateAsteroidBeltPositions(
    planetOrbits,
    systemSeed + 5000
  );

  for (const beltPos of beltPositions) {
    const asteroidCount = randomInt(
      50,
      200,
      systemSeed + asteroidBelts.length * 1000
    );
    const belt = generateAsteroidBelt({
      innerRadius: beltPos.innerRadius,
      outerRadius: beltPos.outerRadius,
      asteroidCount,
      beltType: beltPos.beltType,
      seed: systemSeed + asteroidBelts.length * 1000,
    });
    asteroidBelts.push(belt);
  }

  // Create solar system
  const solarSystem: SolarSystem = {
    id: `system-${systemSeed}`,
    name: systemName,
    position: systemPosition,
    star,
    planets: planets as any[], // Convert PlanetData to Planet for now
    asteroidBelts: asteroidBelts.length > 0 ? asteroidBelts : undefined,
    connections: [],
    discovered: true,
    colonized: false,
    seed: systemSeed,
  };

  return solarSystem;
}

/**
 * Calculate a new position for a system connected to an existing one
 */
export function calculateConnectedSystemPosition(
  fromPosition: [number, number, number],
  seed: number
): [number, number, number] {
  // Random angle
  const angle = randomRange(0, Math.PI * 2, seed);

  // Random distance between 3 and 6 units
  const distance = randomRange(3, 6, seed + 1);

  // Random vertical offset
  const verticalOffset = randomRange(-1, 1, seed + 2);

  const x = fromPosition[0] + Math.cos(angle) * distance;
  const y = fromPosition[1] + verticalOffset;
  const z = fromPosition[2] + Math.sin(angle) * distance;

  return [x, y, z];
}
