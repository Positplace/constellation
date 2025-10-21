import starConfigs from "../data/starConfigs.json";
import { SolarSystem, StarType, StarData } from "../types/game.types";
import { PlanetData, PlanetType } from "../types/planet.types";
import { createPlanet } from "./planetFactory";
import { randomInt, randomRange } from "./noiseUtils";
import {
  generateAsteroidBelt,
  calculateAsteroidBeltPositions,
} from "./asteroidFactory";
import { generateSystemComets } from "./cometFactory";

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
 * Determine orbital zone based on distance from star (scaled to habitable zone)
 * @param orbitalDistance Distance from star in AU
 * @param habitableZoneMin Inner edge of habitable zone
 * @param habitableZoneMax Outer edge of habitable zone
 */
function getOrbitalZone(
  orbitalDistance: number,
  habitableZoneMin: number,
  habitableZoneMax: number
): import("../types/planet.types").OrbitalZone {
  // Scale zones relative to the habitable zone
  const infernoZone = habitableZoneMin * 0.5; // 50% inside habitable zone
  const hotZone = habitableZoneMin * 0.85; // 85% of habitable zone inner edge
  const coldZone = habitableZoneMax * 1.5; // 150% of habitable zone outer edge
  const outerZone = habitableZoneMax * 2.5; // 250% of habitable zone outer edge

  if (orbitalDistance < infernoZone) return "inferno";
  if (orbitalDistance < hotZone) return "hot";
  if (
    orbitalDistance >= habitableZoneMin &&
    orbitalDistance <= habitableZoneMax
  )
    return "goldilocks";
  if (orbitalDistance < coldZone) return "cold";
  if (orbitalDistance < outerZone) return "outer";
  return "deep_space";
}

/**
 * Select planet type based on orbital distance (scaled to star's habitable zone)
 * @param orbitalDistance Distance from star in AU
 * @param habitableZoneMin Inner edge of habitable zone
 * @param habitableZoneMax Outer edge of habitable zone
 * @param seed Random seed
 */
function selectPlanetTypeByZone(
  orbitalDistance: number,
  habitableZoneMin: number,
  habitableZoneMax: number,
  seed: number
): PlanetType {
  const rand = randomRange(0, 100, seed);

  // Calculate zone boundaries relative to habitable zone
  const infernoZone = habitableZoneMin * 0.5;
  const hotZone = habitableZoneMin * 0.85;
  const coldZone = habitableZoneMax * 1.5;
  const outerZone = habitableZoneMax * 2.5;

  // ZONE 1: INFERNO ZONE (< 50% of habitable zone min) - Always hot!
  if (orbitalDistance < infernoZone) {
    // Extremely hot - lava, volcanic, or barren worlds
    if (rand < 50) return "lava_world";
    if (rand < 80) return "volcanic_world";
    return "barren_world";
  }

  // ZONE 2: HOT ZONE (50%-85% of habitable zone min) - Too hot for comfort
  if (orbitalDistance < hotZone) {
    if (rand < 40) return "volcanic_world";
    if (rand < 70) return "desert_world";
    return "barren_world";
  }

  // ZONE 3: GOLDILOCKS ZONE (habitable zone) - Perfect for life!
  if (
    orbitalDistance >= habitableZoneMin &&
    orbitalDistance <= habitableZoneMax
  ) {
    if (rand < 30) return "earth_like";
    if (rand < 55) return "ocean_world";
    if (rand < 70) return "terrestrial"; // Habitable terrestrial
    if (rand < 85) return "desert_world"; // Mars-like
    if (rand < 95) return "ice_world"; // Cold edge
    return "gas_giant";
  }

  // ZONE 4: COLD ZONE (100%-150% of habitable zone max) - Getting chilly
  if (orbitalDistance < coldZone) {
    if (rand < 40) return "ice_world";
    if (rand < 60) return "frozen_world";
    if (rand < 85) return "gas_giant"; // Jupiter-like
    return "terrestrial";
  }

  // ZONE 5: OUTER ZONE (150%-250% of habitable zone max) - Very cold
  if (orbitalDistance < outerZone) {
    if (rand < 40) return "ice_giant"; // Neptune/Uranus
    if (rand < 75) return "gas_giant"; // Saturn-like
    if (rand < 90) return "frozen_world";
    return "ice_world";
  }

  // ZONE 6: DEEP SPACE (> 250% of habitable zone max) - Frozen wasteland
  if (rand < 50) return "frozen_world";
  if (rand < 75) return "dwarf_planet";
  if (rand < 90) return "ice_world";
  return "ice_giant";
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
    "binary_star",
    "black_hole",
  ];
  const selectedStarType = starType ?? starTypes[systemSeed % starTypes.length];

  // Get star configuration
  const starConfig = (starConfigs as any)[selectedStarType];

  // Generate system ID first (we need it for star ID)
  const systemId = `system-${systemSeed}`;

  // Create star data
  const star: StarData = {
    id: `${systemId}-star`,
    type: selectedStarType,
    name: starConfig.name,
    color: starConfig.visual.color,
    glowColor: starConfig.visual.glowColor,
    size: starConfig.visual.size,
    temperature: starConfig.visual.temperature,
    luminosity: starConfig.visual.luminosity,
  };

  // Add companion star for binary systems
  if (selectedStarType === "binary_star" && starConfig.companion) {
    const companionConfig = starConfig.companion;
    const possibleCompanionTypes = companionConfig.possibleTypes || [
      "orange_star",
      "red_dwarf",
    ];
    const companionTypeKey = possibleCompanionTypes[
      systemSeed % possibleCompanionTypes.length
    ] as StarType;
    const companionStarConfig = (starConfigs as any)[companionTypeKey];

    if (companionStarConfig) {
      star.companion = {
        type: companionTypeKey,
        color: companionStarConfig.visual.color,
        glowColor: companionStarConfig.visual.glowColor,
        size: companionStarConfig.visual.size * 0.8, // Slightly smaller
        temperature: companionStarConfig.visual.temperature,
        luminosity: companionStarConfig.visual.luminosity * 0.7,
        orbitalDistance: companionConfig.orbitalDistance,
        orbitalSpeed: companionConfig.orbitalSpeed,
        orbitalAngle: randomRange(0, Math.PI * 2, systemSeed + 999),
      };
      // Increase total system luminosity due to second star
      star.luminosity += star.companion.luminosity;
    }
  }

  // Add black hole properties
  if (selectedStarType === "black_hole" && starConfig.blackHoleProperties) {
    star.blackHole = {
      accretionDiskColor:
        starConfig.blackHoleProperties.accretionDiskColor || "#ff6b35",
      accretionDiskInnerRadius:
        starConfig.blackHoleProperties.accretionDiskInnerRadius || 1.5,
      accretionDiskOuterRadius:
        starConfig.blackHoleProperties.accretionDiskOuterRadius || 3.5,
      eventHorizonRadius:
        starConfig.blackHoleProperties.eventHorizonRadius || 0.8,
      hawkingRadiation: starConfig.blackHoleProperties.hawkingRadiation ?? true,
    };
  }

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

  console.log(
    `Generating ${systemName} (${selectedStarType}): ${planetCount} planets, habitable zone ${habitableZoneMin}-${habitableZoneMax} AU`
  );

  /**
   * Calculate minimum safe distance from star (SINGLE SOURCE OF TRUTH)
   * Planets closer than this would visually overlap with or be inside the star
   */
  const minSafeDistance = Math.max(
    0.1, // Absolute minimum: 0.1 AU
    star.size * 2.5, // Visual safety: 2.5x star's visual size
    habitableZoneMin * 0.2 // Astrophysical safety: 20% of inner habitable zone
  );

  /**
   * Helper function: Enforce minimum safe distance for any orbital distance
   */
  const enforceSafeDistance = (distance: number): number => {
    return Math.max(distance, minSafeDistance);
  };

  console.log(
    `Star: ${selectedStarType} (size: ${
      star.size
    }), Habitable: ${habitableZoneMin}-${habitableZoneMax} AU, Min safe: ${minSafeDistance.toFixed(
      3
    )} AU`
  );

  // Calculate system range - inner boundary starts just beyond safe distance
  const innerBoundaryFactor = randomRange(0.15, 0.35, systemSeed + 5000);
  const innerBoundary = enforceSafeDistance(
    habitableZoneMin * innerBoundaryFactor
  );
  // Reduce outer boundary to 3x habitable zone max (was 5x) to keep systems more compact
  const outerBoundary = habitableZoneMax * 3;

  // Generate planet orbital distances with proper spacing
  const orbitalDistances: number[] = [];

  // First, determine planet types and sizes to calculate appropriate spacing
  const planetTypes: PlanetType[] = [];
  const planetSizes: number[] = [];

  for (let i = 0; i < planetCount; i++) {
    const planetSeed = systemSeed + 1000 + i * 100;

    // Pre-determine planet type and size for spacing calculations
    const t = i / (planetCount - 1); // 0 to 1
    const logT = Math.log(1 + t * 9) / Math.log(10); // Logarithmic scale
    let baseDistance = innerBoundary + logT * (outerBoundary - innerBoundary);
    const variance = randomRange(-0.15, 0.15, planetSeed + 50);
    baseDistance = baseDistance * (1 + variance);

    // Select planet type based on orbital zone
    const planetType = selectPlanetTypeByZone(
      baseDistance,
      habitableZoneMin,
      habitableZoneMax,
      planetSeed
    );

    // Determine planet size based on type
    let planetSize = 1.0; // Default Earth-sized
    if (planetType === "gas_giant") {
      planetSize = randomRange(8, 15, planetSeed + 10); // 8-15 Earth radii
    } else if (planetType === "ice_giant") {
      planetSize = randomRange(3, 6, planetSeed + 11); // 3-6 Earth radii
    } else if (planetType === "dwarf_planet") {
      planetSize = randomRange(0.1, 0.3, planetSeed + 12); // 0.1-0.3 Earth radii
    } else {
      planetSize = randomRange(0.5, 2.0, planetSeed + 13); // 0.5-2 Earth radii
    }

    planetTypes.push(planetType);
    planetSizes.push(planetSize);
  }

  for (let i = 0; i < planetCount; i++) {
    const planetSeed = systemSeed + 1000 + i * 100;

    // Special handling for first planet - 50% chance it's very close (inferno zone)
    if (i === 0 && randomRange(0, 100, planetSeed + 40) < 50) {
      const infernoZoneDistance = randomRange(
        habitableZoneMin * 0.5,
        habitableZoneMin * 0.8,
        planetSeed + 41
      );
      const closeDistance = enforceSafeDistance(infernoZoneDistance);

      console.log(
        `First planet in inferno zone: ${closeDistance.toFixed(3)} AU`
      );
      orbitalDistances.push(closeDistance);
      continue;
    }

    // Use a logarithmic distribution for more realistic spacing
    // Inner planets are closer together, outer planets are more spread out
    const t = i / (planetCount - 1); // 0 to 1
    const logT = Math.log(1 + t * 9) / Math.log(10); // Logarithmic scale

    let baseDistance = innerBoundary + logT * (outerBoundary - innerBoundary);

    // Add some randomness to each orbit (±15%)
    const variance = randomRange(-0.15, 0.15, planetSeed + 50);
    baseDistance = baseDistance * (1 + variance);

    // Dynamic spacing based on planet size
    if (i > 0) {
      const currentPlanetSize = planetSizes[i];
      const previousPlanetSize = planetSizes[i - 1];

      // Calculate minimum spacing based on planet sizes
      // Larger planets need more space to avoid visual overlap
      const sizeFactor = Math.max(currentPlanetSize, previousPlanetSize);
      const baseSpacing = 0.3; // Base spacing for Earth-sized planets
      const sizeMultiplier = 1 + (sizeFactor - 1) * 0.5; // Scale spacing with size

      // Extra spacing for gas giants (they often have rings and many moons)
      const gasGiantBonus =
        planetTypes[i] === "gas_giant" || planetTypes[i - 1] === "gas_giant"
          ? 0.5
          : 0;

      const minSpacing = baseSpacing * sizeMultiplier + gasGiantBonus;

      const previousDistance = orbitalDistances[i - 1];
      baseDistance = Math.max(baseDistance, previousDistance + minSpacing);

      console.log(
        `Planet ${i}: type=${planetTypes[i]}, size=${currentPlanetSize.toFixed(
          1
        )}R⊕, spacing=${minSpacing.toFixed(
          2
        )}AU, distance=${baseDistance.toFixed(2)}AU`
      );
    }

    // Always enforce minimum safe distance
    orbitalDistances.push(enforceSafeDistance(baseDistance));
  }

  // Now create planets with calculated distances using pre-determined types
  for (let i = 0; i < planetCount; i++) {
    const planetSeed = systemSeed + 1000 + i * 100;
    const orbitalDistance = orbitalDistances[i];

    // Use pre-determined planet type
    const planetType = planetTypes[i];

    // Determine if this planet should be in the habitable zone
    const inHabitableZone =
      orbitalDistance >= habitableZoneMin &&
      orbitalDistance <= habitableZoneMax;

    // Determine planet size category based on pre-determined size
    let sizeCategory: "tiny" | "small" | "medium" | "large" | "huge";
    const planetSize = planetSizes[i];
    if (planetSize < 0.5) sizeCategory = "tiny";
    else if (planetSize < 1.0) sizeCategory = "small";
    else if (planetSize < 3.0) sizeCategory = "medium";
    else if (planetSize < 8.0) sizeCategory = "large";
    else sizeCategory = "huge";

    // Create planet
    const planet = createPlanet(
      {
        type: planetType,
        size: sizeCategory,
        age: starConfig.systemAge as any,
        habitability: inHabitableZone ? "habitable" : "marginal",
        seed: planetSeed,
      },
      undefined
    );

    // Override orbital distance AND speed to match our calculated values
    // Using Kepler's Third Law: v = √(GM/r) ∝ √(M/r)
    // Scale base speed by star's luminosity as a proxy for mass (more massive stars are brighter)
    // Blue giants: luminosity ~10, Red dwarfs: luminosity ~0.1
    planet.orbitalDistance = orbitalDistance;
    const baseOrbitalSpeed = 0.5; // Base speed factor for 1 AU around a Sun-like star
    const massScaleFactor = Math.sqrt(star.luminosity); // Scale by √luminosity (proxy for √mass)
    planet.orbitalSpeed =
      (baseOrbitalSpeed * massScaleFactor) / Math.sqrt(orbitalDistance);

    // Set the orbital zone for clarity (now scaled to habitable zone)
    planet.orbitalZone = getOrbitalZone(
      orbitalDistance,
      habitableZoneMin,
      habitableZoneMax
    );

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

  // Generate comets
  const comets = generateSystemComets(
    habitableZoneMin,
    habitableZoneMax,
    outerBoundary,
    selectedStarType,
    systemSeed
  );

  // Create solar system
  const solarSystem: SolarSystem = {
    id: systemId,
    name: systemName,
    position: systemPosition,
    star,
    planets: planets as any[], // Convert PlanetData to Planet for now
    asteroidBelts: asteroidBelts.length > 0 ? asteroidBelts : undefined,
    comets: comets.length > 0 ? comets : undefined,
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
