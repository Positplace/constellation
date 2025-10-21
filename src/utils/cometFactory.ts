import { randomInt, randomRange } from "./noiseUtils";
import {
  CometData,
  CometType,
  CometGenerationParams,
  CometComposition,
  CometTailData,
} from "../types/comet.types";

// Comet name components for procedural generation
const COMET_PREFIXES = [
  "Halley's",
  "Swift",
  "Tuttle's",
  "Encke's",
  "Brorsen",
  "Biela's",
  "Faye's",
  "D'Arrest",
  "Tempel",
  "Giacobini",
  "Brooks",
  "Finlay",
  "Lexell's",
  "Olbers",
  "Pons",
  "Westphal",
  "Hale",
  "Kohoutek",
  "Hyakutake",
  "McNaught",
];

const COMET_SUFFIXES = [
  "Comet",
  "Wanderer",
  "Visitor",
  "Traveler",
  "Runner",
  "Streak",
  "Flash",
  "Bolt",
];

/**
 * Generate a comet name
 */
function generateCometName(seed: number, type: CometType): string {
  const prefixIndex = seed % COMET_PREFIXES.length;
  const suffixIndex =
    Math.floor(seed / COMET_PREFIXES.length) % COMET_SUFFIXES.length;

  if (type === "long_period" && seed % 3 === 0) {
    return `C/${1900 + (seed % 200)}-${COMET_PREFIXES[prefixIndex]}`;
  }

  return `${COMET_PREFIXES[prefixIndex]} ${COMET_SUFFIXES[suffixIndex]}`;
}

/**
 * Generate comet composition
 */
function generateComposition(type: CometType, seed: number): CometComposition {
  // Long-period comets tend to have more ice (pristine from outer system)
  // Short-period comets have lost more ice from repeated passes
  const baseIce =
    type === "long_period"
      ? randomRange(70, 85, seed)
      : randomRange(50, 70, seed);
  const baseDust = randomRange(10, 25, seed + 100);
  const baseRock = 100 - baseIce - baseDust;

  return {
    ice: Math.max(0, baseIce),
    dust: Math.max(0, baseDust),
    rock: Math.max(0, baseRock),
  };
}

/**
 * Calculate tail intensity based on distance from star
 * Tails are most prominent near perihelion
 */
function calculateTailIntensity(
  distanceFromStar: number,
  perihelion: number
): number {
  // Tail becomes visible within ~3 AU of star, peaks at perihelion
  if (distanceFromStar > 3.5) return 0;

  const maxTailDistance = 3.5;
  const intensity = 1 - Math.min(1, distanceFromStar / maxTailDistance);

  // Apply power curve for more dramatic effect near star
  return Math.pow(intensity, 0.7);
}

/**
 * Generate initial tail data (will be updated dynamically during orbit)
 */
function generateInitialTailData(
  type: CometType,
  distanceFromStar: number,
  perihelion: number,
  composition: CometComposition,
  seed: number
): CometTailData {
  const intensity = calculateTailIntensity(distanceFromStar, perihelion);

  // Dust tail: yellowish, curved (affected by solar radiation pressure)
  // More prominent in dust-rich comets
  const dustTailColor = composition.dust > 20 ? "#ffd700" : "#ffeb99";

  // Ion tail: bluish, straight (follows magnetic field lines)
  // More prominent in ice-rich comets
  const ionTailColor = composition.ice > 60 ? "#4da6ff" : "#99ccff";

  // Tail length scales with intensity (longer near star)
  const baseLength = type === "long_period" ? 2.5 : 1.8;
  const length = baseLength * (0.3 + intensity * 0.7);

  return {
    dustTailColor,
    ionTailColor,
    intensity,
    length,
  };
}

/**
 * Calculate orbital parameters based on comet type
 */
function calculateOrbitalParameters(
  type: CometType,
  habitableZoneMin: number,
  habitableZoneMax: number,
  systemOuterBoundary: number,
  seed: number
) {
  let perihelion: number;
  let aphelion: number;
  let eccentricity: number;
  let inclination: number;

  switch (type) {
    case "short_period":
      // Short-period comets: 3-20 year orbits, perihelion near inner system
      perihelion = randomRange(
        habitableZoneMin * 0.3,
        habitableZoneMin * 1.5,
        seed
      );
      aphelion = randomRange(
        systemOuterBoundary * 0.8,
        systemOuterBoundary * 1.2,
        seed + 50
      );
      eccentricity = randomRange(0.5, 0.8, seed + 100);
      inclination = randomRange(-0.3, 0.3, seed + 150); // Low inclination (prograde)
      break;

    case "halley_type":
      // Halley-type: 20-200 year orbits, moderate eccentricity
      perihelion = randomRange(
        habitableZoneMin * 0.5,
        habitableZoneMax * 0.8,
        seed
      );
      aphelion = randomRange(
        systemOuterBoundary * 1.5,
        systemOuterBoundary * 3,
        seed + 50
      );
      eccentricity = randomRange(0.7, 0.9, seed + 100);
      inclination = randomRange(-0.5, 0.5, seed + 150); // Can be retrograde
      break;

    case "long_period":
      // Long-period comets: 200+ year orbits, very eccentric
      perihelion = randomRange(
        habitableZoneMin * 0.4,
        habitableZoneMax * 1.0,
        seed
      );
      aphelion = randomRange(
        systemOuterBoundary * 3,
        systemOuterBoundary * 6,
        seed + 50
      );
      eccentricity = randomRange(0.85, 0.995, seed + 100);
      inclination = randomRange(-Math.PI * 0.7, Math.PI * 0.7, seed + 150); // Any inclination
      break;
  }

  // Calculate semi-major axis from perihelion and aphelion
  const semiMajorAxis = (perihelion + aphelion) / 2;

  // Calculate orbital period using Kepler's third law (simplified)
  // T² ∝ a³ (period squared proportional to semi-major axis cubed)
  const period = Math.pow(semiMajorAxis, 1.5); // Simplified orbital period

  return {
    semiMajorAxis,
    perihelion,
    aphelion,
    eccentricity,
    inclination,
    period,
  };
}

/**
 * Generate a single comet
 */
export function generateComet(params: CometGenerationParams): CometData {
  const {
    cometType,
    habitableZoneMin,
    habitableZoneMax,
    systemOuterBoundary,
    seed,
  } = params;

  const name = generateCometName(seed, cometType);
  const composition = generateComposition(cometType, seed);

  // Calculate orbital parameters
  const orbital = calculateOrbitalParameters(
    cometType,
    habitableZoneMin,
    habitableZoneMax,
    systemOuterBoundary,
    seed
  );

  // Start comet at a random position in its orbit
  const initialAngle = randomRange(0, Math.PI * 2, seed + 200);

  // Calculate initial distance from star based on orbital parameters
  // Using ellipse equation: r = a(1-e²)/(1+e*cos(θ))
  const { semiMajorAxis, eccentricity, inclination } = orbital;
  const r =
    (semiMajorAxis * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(initialAngle));

  // Calculate 3D position with inclination
  const x = r * Math.cos(initialAngle);
  const y = r * Math.sin(inclination) * Math.sin(initialAngle);
  const z = r * Math.cos(inclination) * Math.sin(initialAngle);

  // Initial tail data (will be updated dynamically)
  const tail = generateInitialTailData(
    cometType,
    r,
    orbital.perihelion,
    composition,
    seed
  );

  // Nucleus size (typically 1-50 km)
  // Long-period comets tend to be larger (more pristine)
  const nucleusSize =
    cometType === "long_period"
      ? randomRange(10, 50, seed + 300)
      : randomRange(1, 20, seed + 300);

  // Rotation properties
  const axisTheta = randomRange(0, Math.PI, seed + 400);
  const axisPhi = randomRange(0, Math.PI * 2, seed + 450);
  const rotationAxis: [number, number, number] = [
    Math.sin(axisTheta) * Math.cos(axisPhi),
    Math.cos(axisTheta),
    Math.sin(axisTheta) * Math.sin(axisPhi),
  ];
  const rotationDirection: 1 | -1 =
    randomRange(0, 1, seed + 500) < 0.5 ? 1 : -1;
  const rotationSpeed = randomRange(0.5, 3.0, seed + 550);

  // Calculate orbital speed at this position
  // v = √(GM(2/r - 1/a)) - simplified as v ∝ √(2/r - 1/a)
  const orbitalSpeed = Math.sqrt(2 / r - 1 / semiMajorAxis) * 0.05;

  return {
    id: `comet-${seed}`,
    name,
    type: cometType,
    position: [x, y, z],
    nucleusSize,
    rotation: {
      axis: rotationAxis,
      speed: rotationSpeed,
      direction: rotationDirection,
    },
    orbital: {
      semiMajorAxis,
      eccentricity,
      inclination,
      angle: initialAngle,
      speed: orbitalSpeed,
      perihelion: orbital.perihelion,
      aphelion: orbital.aphelion,
      period: orbital.period,
    },
    composition,
    tail,
    discovered: false,
    lastPerihelion: 0, // Will be set by game logic
    seed,
  };
}

/**
 * Generate comets for a solar system
 * Returns an array of comets based on star type and system characteristics
 */
export function generateSystemComets(
  habitableZoneMin: number,
  habitableZoneMax: number,
  systemOuterBoundary: number,
  starType: string,
  seed: number
): CometData[] {
  const comets: CometData[] = [];

  // Determine number of comets based on star type
  // Older, more stable systems have fewer active comets
  let cometCount = 0;
  let shortPeriodChance = 0;
  let halleyTypeChance = 0;
  let longPeriodChance = 0;

  switch (starType) {
    case "red_dwarf":
    case "white_dwarf":
      // Old systems, few comets left
      cometCount = randomInt(0, 1, seed);
      shortPeriodChance = 0.5;
      halleyTypeChance = 0.3;
      longPeriodChance = 0.2;
      break;

    case "orange_star":
    case "yellow_star":
      // Mature systems, moderate comet activity
      cometCount = randomInt(1, 2, seed);
      shortPeriodChance = 0.4;
      halleyTypeChance = 0.35;
      longPeriodChance = 0.25;
      break;

    case "white_star":
    case "blue_giant":
      // Young systems, slightly more comets
      cometCount = randomInt(1, 2, seed);
      shortPeriodChance = 0.3;
      halleyTypeChance = 0.3;
      longPeriodChance = 0.4;
      break;

    case "red_giant":
      // Dying star, comets mostly vaporized or ejected
      cometCount = randomInt(0, 1, seed);
      shortPeriodChance = 0.1;
      halleyTypeChance = 0.2;
      longPeriodChance = 0.7;
      break;

    case "binary_star":
      // Binary systems can have disrupted comet populations
      cometCount = randomInt(1, 2, seed);
      shortPeriodChance = 0.2;
      halleyTypeChance = 0.4;
      longPeriodChance = 0.4;
      break;

    case "black_hole":
      // Black holes rarely have comets (most were accreted or ejected)
      cometCount = randomInt(0, 1, seed);
      shortPeriodChance = 0.0;
      halleyTypeChance = 0.2;
      longPeriodChance = 0.8;
      break;

    default:
      cometCount = randomInt(0, 2, seed);
      shortPeriodChance = 0.4;
      halleyTypeChance = 0.3;
      longPeriodChance = 0.3;
  }

  // Generate comets
  for (let i = 0; i < cometCount; i++) {
    const cometSeed = seed + 50000 + i * 1000;

    // Select comet type based on probabilities
    const typeRand = randomRange(0, 1, cometSeed);
    let cometType: CometType;

    if (typeRand < shortPeriodChance) {
      cometType = "short_period";
    } else if (typeRand < shortPeriodChance + halleyTypeChance) {
      cometType = "halley_type";
    } else {
      cometType = "long_period";
    }

    const comet = generateComet({
      cometType,
      habitableZoneMin,
      habitableZoneMax,
      systemOuterBoundary,
      seed: cometSeed,
    });

    comets.push(comet);
  }

  return comets;
}

/**
 * Update comet tail based on current distance from star
 * This should be called each frame to update tail intensity
 */
export function updateCometTail(
  comet: CometData,
  currentDistanceFromStar: number
): CometTailData {
  const intensity = calculateTailIntensity(
    currentDistanceFromStar,
    comet.orbital.perihelion
  );

  // Tail length scales with intensity
  const baseLength = comet.type === "long_period" ? 2.5 : 1.8;
  const length = baseLength * (0.3 + intensity * 0.7);

  return {
    ...comet.tail,
    intensity,
    length,
  };
}
