import { randomInt, randomRange } from "./noiseUtils";
import {
  PlanetData,
  MoonData,
  RingData,
  RingBand,
} from "../types/planet.types";

const EARTH_RADIUS_KM = 6371;

/**
 * Migrate old ring format to new multi-ring format
 */
export function migrateRingData(oldRingData: any): RingData | null {
  if (!oldRingData) return null;

  // If it's already the new format, return as is
  if (oldRingData.bands && Array.isArray(oldRingData.bands)) {
    return oldRingData;
  }

  // If it's the old format, convert to new format
  if (
    oldRingData.innerRadius !== undefined &&
    oldRingData.outerRadius !== undefined
  ) {
    return {
      bands: [
        {
          innerRadius: oldRingData.innerRadius,
          outerRadius: oldRingData.outerRadius,
          color: oldRingData.color || "#C0C0C0",
          opacity: oldRingData.opacity || 0.5,
          texturePattern: oldRingData.texturePattern || "solid",
        },
      ],
      rotationSpeed: oldRingData.rotationSpeed || 0.2,
      seed: oldRingData.seed || Math.floor(Math.random() * 1000000),
    };
  }

  return null;
}

/**
 * Generate moon name based on planet name and index
 */
function generateMoonName(planetName: string, index: number): string {
  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ];
  const greekLetters = [
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
  ];

  // Use Roman numerals for first 10 moons, then Greek letters
  if (index < 10) {
    return `${planetName} ${romanNumerals[index]}`;
  } else {
    const greekIndex = (index - 10) % greekLetters.length;
    return `${planetName} ${greekLetters[greekIndex]}`;
  }
}

/**
 * Determine moon count based on planet size and type
 */
function getMoonCount(planet: PlanetData, seed: number): number {
  const planetRadiusEarth = planet.radius / EARTH_RADIUS_KM;
  const rand = randomRange(0, 100, seed);

  // Tiny/Small terrestrial: 0 moons
  if (planetRadiusEarth < 0.5) {
    return 0;
  }

  // Medium terrestrial: 0-1 moons (30% chance)
  if (
    planetRadiusEarth < 1.5 &&
    [
      "terrestrial",
      "ocean_world",
      "desert_world",
      "ice_world",
      "earth_like",
    ].includes(planet.type)
  ) {
    return rand < 30 ? 1 : 0;
  }

  // Large terrestrial: 1-2 moons
  if (
    planetRadiusEarth < 3.0 &&
    [
      "terrestrial",
      "ocean_world",
      "desert_world",
      "ice_world",
      "earth_like",
    ].includes(planet.type)
  ) {
    return randomInt(1, 3, seed + 1);
  }

  // Gas giants: 3-8 moons
  if (planet.type === "gas_giant") {
    return randomInt(3, 9, seed + 2);
  }

  // Ice giants: 2-5 moons
  if (planet.type === "ice_giant") {
    return randomInt(2, 6, seed + 3);
  }

  // Other large planets: 1-3 moons
  if (planetRadiusEarth >= 3.0) {
    return randomInt(1, 4, seed + 4);
  }

  return 0;
}

/**
 * Generate moons for a planet
 */
export function generateMoonsForPlanet(
  planet: PlanetData,
  seed: number
): MoonData[] {
  const moonCount = getMoonCount(planet, seed);
  const moons: MoonData[] = [];

  for (let i = 0; i < moonCount; i++) {
    const moonSeed = seed + 1000 + i * 100;
    const moonName = generateMoonName(planet.name, i);

    // Moon size: vary based on moon count - fewer moons = larger sizes
    const sizeRandom = randomRange(0, 1, moonSeed + 1);
    const powerLaw = Math.pow(sizeRandom, 1.8); // Less steep than asteroids

    // Check for exceptional moons (rare large moons like Ganymede or Titan)
    const exceptionalChance = randomRange(0, 100, moonSeed + 10);
    const isExceptional = exceptionalChance < 15; // 15% chance for exceptional moon
    const isFirstMoon = i === 0; // First moons can be larger (mimicking major moons)

    // Size scaling based on moon count and special conditions
    let minSize, maxSize;
    if (moonCount === 1) {
      // Single moon can be quite large (like Earth's Moon)
      minSize = 0.15; // 15% of Earth radius
      maxSize = 0.4; // 40% of Earth radius
    } else if (moonCount <= 3) {
      // Few moons - medium to large sizes
      minSize = 0.08; // 8% of Earth radius
      maxSize = 0.25; // 25% of Earth radius
    } else {
      // Many moons - smaller sizes to avoid overcrowding
      // But allow for rare exceptional moons or larger first moons
      if (isExceptional && planet.type === "gas_giant") {
        // Rare major moon for gas giants (like Ganymede, Titan)
        minSize = 0.25; // 25% of Earth radius
        maxSize = 0.42; // 42% of Earth radius (Ganymede is ~41%)
      } else if (isFirstMoon && moonCount > 3) {
        // First moon slightly larger than others
        minSize = 0.08; // 8% of Earth radius
        maxSize = 0.2; // 20% of Earth radius
      } else {
        // Regular small moons
        minSize = 0.03; // 3% of Earth radius
        maxSize = 0.12; // 12% of Earth radius
      }
    }

    const sizeKm = (minSize + powerLaw * (maxSize - minSize)) * EARTH_RADIUS_KM;

    // Orbital distance: calculate based on BOTH planet size and moon size
    const planetRadiusRender = (planet.radius / EARTH_RADIUS_KM) * 0.16; // Approximate render size
    const moonRadiusRender = (sizeKm / EARTH_RADIUS_KM) * 0.16; // Moon render size

    // Calculate moon-to-planet size ratio to determine spacing needs
    const sizeRatio = moonRadiusRender / planetRadiusRender;

    // Gas giants and ice giants get tighter, more compact moon systems
    const isGasGiant =
      planet.type === "gas_giant" || planet.type === "ice_giant";
    const compactnessFactor = isGasGiant ? 0.7 : 1.0; // Gas giants get 30% tighter spacing

    // Base minimum distance (close for small moons, even closer for gas giants)
    const baseMinDistance = planetRadiusRender * (isGasGiant ? 1.3 : 1.5);

    // Add extra distance based on moon size - only large moons get pushed out significantly
    // Small moons (< 10% planet size): minimal extra distance
    // Large moons (> 30% planet size): substantial extra distance
    const sizeBasedPushout =
      planetRadiusRender * Math.pow(sizeRatio, 1.5) * 8 * compactnessFactor;
    const minDistance = baseMinDistance + sizeBasedPushout;

    // Spacing between moons should also consider moon size
    // Gas giants get tighter spacing to create dense moon systems like Jupiter/Saturn
    const baseSpacing = planetRadiusRender * (isGasGiant ? 0.25 : 0.4);
    const moonSizeMultiplier = 1 + sizeRatio * (isGasGiant ? 2 : 3); // Less size-based spacing for gas giants
    const spacing = baseSpacing * moonSizeMultiplier;

    // Calculate orbital distance with progressive spacing
    const orbitalDistance = minDistance + spacing * i;

    // Add small random variation to avoid perfect alignment
    const randomVariation = randomRange(-0.05, 0.05, moonSeed + 2);
    const finalOrbitalDistance = orbitalDistance * (1 + randomVariation);

    // Orbital speed: faster for closer moons (Kepler's law)
    const baseSpeed = 0.3; // Base orbital speed
    const orbitalSpeed = baseSpeed / Math.sqrt(finalOrbitalDistance);

    // Orbital angle - spread moons around planet
    const orbitalAngle = randomRange(0, Math.PI * 2, moonSeed + 3);

    // Orbital eccentricity (small for most moons)
    const orbitalEccentricity = randomRange(0, 0.1, moonSeed + 4);

    // Orbital inclination - much more variety for gaming fun!
    // Some moons orbit in different planes for visual interest
    const inclinationRandom = randomRange(0, 1, moonSeed + 5);
    let orbitalInclination;
    if (inclinationRandom < 0.3) {
      // 30% chance: nearly equatorial (0-10 degrees)
      orbitalInclination = randomRange(0, 10, moonSeed + 5);
    } else if (inclinationRandom < 0.7) {
      // 40% chance: moderate inclination (10-45 degrees)
      orbitalInclination = randomRange(10, 45, moonSeed + 5);
    } else {
      // 30% chance: high inclination (45-90 degrees) - polar or retrograde orbits!
      orbitalInclination = randomRange(45, 90, moonSeed + 5);
    }

    // Moon planet type - restricted to realistic moon types
    const typeRand = randomRange(0, 100, moonSeed + 6);
    let moonType: PlanetType;

    if (
      planet.type === "ice_giant" ||
      planet.orbitalZone === "outer" ||
      planet.orbitalZone === "deep_space"
    ) {
      // Outer planets - mostly ice worlds, some rocky
      if (typeRand < 60) moonType = "ice_world";
      else if (typeRand < 80) moonType = "rocky_world";
      else if (typeRand < 90) moonType = "dwarf_planet";
      else moonType = "terrestrial";
    } else {
      // Inner planets - mostly rocky, some terrestrial
      if (typeRand < 50) moonType = "rocky_world";
      else if (typeRand < 70) moonType = "terrestrial";
      else if (typeRand < 85) moonType = "dwarf_planet";
      else if (typeRand < 95) moonType = "ice_world";
      else moonType = "desert_world";
    }

    // Material type based on moon planet type
    const materialRand = randomRange(0, 100, moonSeed + 7);
    let material: "silicate" | "ice" | "carbonaceous" | "iron";

    switch (moonType) {
      case "ice_world":
        material = "ice";
        break;
      case "rocky_world":
        if (materialRand < 70) material = "silicate";
        else if (materialRand < 90) material = "carbonaceous";
        else material = "iron";
        break;
      case "terrestrial":
        if (materialRand < 60) material = "silicate";
        else if (materialRand < 80) material = "carbonaceous";
        else material = "iron";
        break;
      case "desert_world":
        if (materialRand < 80) material = "silicate";
        else material = "carbonaceous";
        break;
      case "dwarf_planet":
        if (materialRand < 50) material = "ice";
        else if (materialRand < 80) material = "silicate";
        else material = "carbonaceous";
        break;
      default:
        material = "silicate";
    }

    // Debug logging
    const sizeCategory =
      moonCount === 1 ? "single" : moonCount <= 3 ? "few" : "many";
    const specialTag =
      isExceptional && planet.type === "gas_giant"
        ? " [MAJOR MOON]"
        : isFirstMoon && moonCount > 3
        ? " [PRIMARY]"
        : "";
    const sizePercentage = ((sizeKm / planet.radius) * 100).toFixed(1);
    console.log(
      `Moon ${i + 1}/${moonCount} for ${
        planet.name
      } (${sizeCategory}): type=${moonType}, size=${(sizeKm / 1000).toFixed(
        0
      )}km (${sizePercentage}% of planet), orbitalDist=${finalOrbitalDistance.toFixed(
        3
      )} units${specialTag}`
    );

    // Rotation properties
    const axisTheta = randomRange(0, Math.PI, moonSeed + 7);
    const axisPhi = randomRange(0, Math.PI * 2, moonSeed + 8);
    const rotationAxis: [number, number, number] = [
      Math.sin(axisTheta) * Math.cos(axisPhi),
      Math.cos(axisTheta),
      Math.sin(axisTheta) * Math.sin(axisPhi),
    ];
    const rotationDirection: 1 | -1 = Math.random() < 0.2 ? -1 : 1;
    const rotationSpeed = randomRange(0.1, 1.5, moonSeed + 9);

    const moon: MoonData = {
      id: `moon-${planet.id}-${i}`,
      name: moonName,
      size: sizeKm,
      orbitalDistance: finalOrbitalDistance,
      orbitalSpeed,
      orbitalAngle,
      orbitalEccentricity,
      orbitalInclination,
      type: moonType,
      material,
      rotation: {
        axis: rotationAxis,
        speed: rotationSpeed,
        direction: rotationDirection,
      },
      seed: moonSeed,
    };

    moons.push(moon);
  }

  return moons;
}

/**
 * Generate rings for a planet
 */
export function generateRingsForPlanet(
  planet: PlanetData,
  seed: number
): RingData | null {
  const planetRadiusEarth = planet.radius / EARTH_RADIUS_KM;
  const rand = randomRange(0, 100, seed);

  // Generate rings for:
  // Gas giants > 8 Earth radii: 60% chance
  // Ice giants > 5 Earth radii: 40% chance
  let shouldHaveRings = false;

  if (planet.type === "gas_giant" && planetRadiusEarth > 8) {
    shouldHaveRings = rand < 60;
  } else if (planet.type === "ice_giant" && planetRadiusEarth > 5) {
    shouldHaveRings = rand < 40;
  }

  if (!shouldHaveRings) {
    return null;
  }

  // Ring properties - starting from planet surface
  // Use the same render scale calculation as in SolarSystemView
  const SUN_RADIUS_UNITS = 1; // Default star size
  const renderScale = Math.min(
    0.16,
    (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, planet.radius / EARTH_RADIUS_KM)
  );
  const planetRadiusRender = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Generate multiple ring bands (3-5 rings)
  const ringCount = randomInt(3, 6, seed + 1);
  const bands: RingBand[] = [];

  // Base colors for different ring types
  const getRingColors = (planetType: string, seed: number) => {
    if (planetType === "gas_giant") {
      const colorVariants = [
        "#D2B48C",
        "#CD853F",
        "#A0522D",
        "#8B4513",
        "#DEB887",
      ];
      return colorVariants[randomInt(0, colorVariants.length, seed)];
    } else if (planetType === "ice_giant") {
      const colorVariants = [
        "#B0E0E6",
        "#87CEEB",
        "#F0F8FF",
        "#E6E6FA",
        "#ADD8E6",
      ];
      return colorVariants[randomInt(0, colorVariants.length, seed)];
    } else {
      return "#C0C0C0"; // Default silver
    }
  };

  // Generate ring bands with varying thicknesses and gaps
  let currentRadius = planetRadiusRender * randomRange(1.001, 1.005, seed + 2);

  for (let i = 0; i < ringCount; i++) {
    const bandSeed = seed + 10 + i;

    // Ring thickness varies - some thin, some thick (doubled for wider rings)
    const thicknessFactor =
      i % 3 === 0
        ? randomRange(0.004, 0.01, bandSeed)
        : randomRange(0.016, 0.03, bandSeed);
    const innerRadius = currentRadius;
    const outerRadius = currentRadius + planetRadiusRender * thicknessFactor;

    // Gap between rings (smaller gaps for more realistic look)
    const gapSize =
      planetRadiusRender * randomRange(0.001, 0.003, bandSeed + 1);
    currentRadius = outerRadius + gapSize;

    // Varying opacity for depth effect
    const opacity = randomRange(0.3, 0.8, bandSeed + 2);

    // Slightly different colors for each band
    const color = getRingColors(planet.type, bandSeed + 3);

    // Texture patterns
    const texturePatterns: ("solid" | "banded" | "particulate")[] = [
      "solid",
      "banded",
      "particulate",
    ];
    const texturePattern =
      texturePatterns[randomInt(0, texturePatterns.length, bandSeed + 4)];

    bands.push({
      innerRadius,
      outerRadius,
      color,
      opacity,
      texturePattern,
    });
  }

  const rotationSpeed = randomRange(0.1, 0.3, seed + 7);

  return {
    bands,
    rotationSpeed,
    seed,
  };
}
