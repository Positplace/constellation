import configs from "../data/planetConfigs.json";
import {
  PlanetData,
  PlanetGenerationParams,
  PlanetType,
  AppearanceData,
} from "../types/planet.types";
import { NoiseConfig, randomInt, randomRange, mulberry32 } from "./noiseUtils";
import { generateAtmosphere } from "./atmosphereGenerator";
import { generateContinents, generateCities } from "./terrainGenerator";
import { generatePlanetName } from "./nameGenerator";
import { generateMoonsForPlanet, generateRingsForPlanet } from "./moonFactory";

const EARTH_RADIUS_KM = 6371;

function noiseDefaults(seed: number): NoiseConfig {
  return {
    octaves: 5,
    frequency: 0.8,
    amplitude: 1,
    lacunarity: 2,
    persistence: 0.5,
    seed,
  };
}

export function createPlanet(
  params: PlanetGenerationParams,
  customName?: string
): PlanetData {
  const seed = params.seed ?? Math.floor(Math.random() * 1e9);
  let type: PlanetType = params.type;

  // Fallback for missing planet types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cfg: any = (configs as any)[type];
  if (!cfg) {
    console.warn(
      `Planet type "${type}" not found in configs, falling back to "terrestrial"`
    );
    type = "terrestrial";
    cfg = (configs as any)[type];
  }

  const name = customName ?? generatePlanetName(seed);

  // Physical
  const radiusEarth = randomRange(
    cfg.baseProperties.radius.min,
    cfg.baseProperties.radius.max,
    seed + 1
  );
  const radius = radiusEarth * EARTH_RADIUS_KM;
  const mass = randomRange(
    cfg.baseProperties.mass.min,
    cfg.baseProperties.mass.max,
    seed + 2
  );
  const gravity = randomRange(
    cfg.baseProperties.gravity.min,
    cfg.baseProperties.gravity.max,
    seed + 3
  );
  const rotationSpeed = randomRange(
    cfg.baseProperties.rotationSpeed.min,
    cfg.baseProperties.rotationSpeed.max,
    seed + 4
  );
  const axialTilt = randomRange(
    cfg.baseProperties.axialTilt.min,
    cfg.baseProperties.axialTilt.max,
    seed + 5
  );

  // Spin axis and speed (visual spin)
  const axisTheta = randomRange(0, Math.PI, seed + 501);
  const axisPhi = randomRange(0, Math.PI * 2, seed + 502);
  const spinAxis: [number, number, number] = [
    Math.sin(axisTheta) * Math.cos(axisPhi),
    Math.cos(axisTheta),
    Math.sin(axisTheta) * Math.sin(axisPhi),
  ];
  const spinDirection: 1 | -1 = Math.random() < 0.2 ? -1 : 1; // 20% retrograde
  const spinSpeed = randomRange(0.5, 1.5, seed + 503); // rad/s - visible but natural rotation speed

  // Orbit (simple plausible ranges)
  const orbitalDistance = randomRange(0.3, 15, seed + 6); // AU
  // Orbital speed using Kepler's Third Law: v ∝ 1/√r
  // Closer planets orbit faster, farther planets orbit slower
  const baseOrbitalSpeed = 0.5; // Base speed factor for 1 AU
  const orbitalSpeed = baseOrbitalSpeed / Math.sqrt(orbitalDistance);
  const orbitalEccentricity = randomRange(0, 0.2, seed + 8);
  const orbitalInclination = randomRange(0, 5, seed + 9);

  const noise = noiseDefaults(seed + 1000);

  // Surface coverage
  const landDefault = cfg.surface.terrainCoverage.land?.default ?? 0.5;
  const oceanDefault = cfg.surface.terrainCoverage.ocean?.default ?? 0.5;
  const iceDefault = cfg.surface.terrainCoverage.ice?.default ?? 0.0;
  const desertDefault = cfg.surface.terrainCoverage.desert?.default ?? 0.2;
  const forestDefault = cfg.surface.terrainCoverage.forest?.default ?? 0.3;
  const mountainsDefault =
    cfg.surface.terrainCoverage.mountains?.default ?? 0.2;
  const plainsDefault = cfg.surface.terrainCoverage.plains?.default ?? 0.3;

  const continentsCount = randomInt(
    cfg.surface.continentCount.min ?? 1,
    cfg.surface.continentCount.max ?? 6,
    seed + 10
  );

  const continents = generateContinents({
    seed,
    count: continentsCount,
    planetRadius: radius,
    noise,
  });

  // Only generate cities for planets that could support life
  const habitablePlanetTypes: PlanetType[] = [
    "earth_like",
    "ocean_world",
    "jungle_world",
    "terrestrial", // Can have some settlements
  ];
  const shouldGenerateCities = habitablePlanetTypes.includes(type);

  const cityDensity = cfg.surface.cityDensity?.default ?? 0.02;
  const cities = shouldGenerateCities
    ? generateCities({ seed, continents, density: cityDensity })
    : []; // Empty array for uninhabitable planets

  // Generate satellites for planets with cities
  const satellites = cities.length > 0 ? generateSatellites(seed, cities) : [];

  const surface = {
    terrainCoverage: {
      ocean: oceanDefault,
      land: landDefault,
      ice: iceDefault,
      desert: desertDefault,
      forest: forestDefault,
      mountains: mountainsDefault,
      plains: plainsDefault,
      tundra: 0.1,
      jungle: 0.1,
      lava: type === "lava_world" ? 0.3 : 0,
    },
    elevation: {
      minHeight: -8000,
      maxHeight: 12000,
      averageHeight: 300,
      roughness: 0.4,
    },
    continents,
    cities,
    satellites,
    volcanoes: [], // Empty array to maintain compatibility with saved data
    temperatureZones: {
      polar: 0.15,
      temperate: 0.45,
      tropical: 0.3,
      equatorial: 0.1,
    },
  };

  const atmosphere = generateAtmosphere({ seed, type, noise });

  const appearance: AppearanceData = {
    baseColor: chooseColor(cfg.appearance?.baseColors?.primary, "#4A90E2"),
    secondaryColor: chooseColor(
      cfg.appearance?.baseColors?.secondary,
      "#1E90FF"
    ),
    accentColor: chooseColor(cfg.appearance?.baseColors?.accent, "#87CEEB"),
    surface: {
      albedo: cfg.appearance?.surface?.albedo?.default ?? 0.3,
      roughness: cfg.appearance?.surface?.roughness?.default ?? 0.5,
      metallic: 0,
      emission: type === "lava_world" ? 0.3 : 0,
    },
    atmosphere: {
      color: atmosphere.color,
      opacity: atmosphere.opacity,
      glowColor: "#ff8c00",
      glowIntensity: 0.2,
    },
    effects: {
      aurora: type === "ice_world",
      auroraColor: "#7fffd4",
      auroraIntensity: type === "ice_world" ? 0.4 : 0,
      rings: false,
      ringColor: "#cccccc",
      ringOpacity: 0.3,
      moons: randomInt(0, 3, seed + 11),
    },
  };

  // Determine orbital zone based on distance
  const getOrbitalZone = (
    distance: number
  ): import("../types/planet.types").OrbitalZone => {
    if (distance < 0.4) return "inferno";
    if (distance < 0.7) return "hot";
    if (distance <= 2.0) return "goldilocks";
    if (distance < 5.0) return "cold";
    if (distance < 10.0) return "outer";
    return "deep_space";
  };

  const planet: PlanetData = {
    id: `pl-${seed}`,
    name,
    type,
    radius,
    mass,
    gravity,
    rotationSpeed,
    axialTilt,
    orbitalDistance,
    orbitalSpeed,
    orbitalEccentricity,
    orbitalInclination,
    orbitalZone: getOrbitalZone(orbitalDistance),
    surface,
    atmosphere,
    appearance,
    moons: [],
    rings: null,
    seed,
    spinAxis,
    spinSpeed,
    spinDirection,
  };

  // Generate moons and rings for the planet
  planet.moons = generateMoonsForPlanet(planet, seed);
  planet.rings = generateRingsForPlanet(planet, seed);

  // Update appearance effects based on rings
  if (planet.rings) {
    planet.appearance.effects.rings = true;
    planet.appearance.effects.ringColor = planet.rings.color;
    planet.appearance.effects.ringOpacity = planet.rings.opacity;
  }

  return planet;
}

function chooseColor(list: string[] | undefined, fallback: string): string {
  if (!list || list.length === 0) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate artificial satellites for civilized planets
 */
function generateSatellites(
  seed: number,
  cities: import("../types/planet.types").CityData[]
): import("../types/planet.types").SatelliteData[] {
  if (cities.length === 0) return [];

  const rng = mulberry32((seed + 99999) >>> 0);
  const satellites: import("../types/planet.types").SatelliteData[] = [];

  // Average technology level of cities
  const avgTech =
    cities.reduce((sum, c) => sum + c.technology, 0) / cities.length;

  // Number of satellites based on tech level and city count
  // Low tech: 1-3 satellites
  // High tech: 5-15 satellites
  const baseSatelliteCount = Math.floor(avgTech * 10 + 2);
  const cityBonus = Math.min(5, Math.floor(cities.length / 20));
  const count = Math.min(20, baseSatelliteCount + cityBonus);

  const satelliteTypes: Array<{
    type: import("../types/planet.types").SatelliteData["type"];
    weight: number;
  }> = [
    { type: "communications", weight: 0.3 },
    { type: "observation", weight: 0.25 },
    { type: "navigation", weight: 0.2 },
    { type: "weather", weight: 0.15 },
    { type: "research", weight: 0.08 },
    { type: "military", weight: 0.02 },
  ];

  for (let i = 0; i < count; i++) {
    // Select satellite type based on weights
    const roll = rng();
    let cumulative = 0;
    let selectedType: import("../types/planet.types").SatelliteData["type"] =
      "communications";

    for (const { type, weight } of satelliteTypes) {
      cumulative += weight;
      if (roll < cumulative) {
        selectedType = type;
        break;
      }
    }

    // Orbital parameters
    // Low Earth Orbit equivalent: 1.01-1.05 planet radii
    // Medium orbit: 1.05-1.15 planet radii
    // High orbit: 1.15-1.5 planet radii
    let orbitalDistance: number;
    if (selectedType === "weather" || selectedType === "observation") {
      // Low orbit for detailed observation
      orbitalDistance = 1.01 + rng() * 0.04;
    } else if (
      selectedType === "navigation" ||
      selectedType === "communications"
    ) {
      // Medium orbit for coverage
      orbitalDistance = 1.05 + rng() * 0.1;
    } else {
      // High orbit for research/military
      orbitalDistance = 1.15 + rng() * 0.35;
    }

    // Faster orbit for closer satellites (Kepler's laws)
    const orbitalSpeed = 3.0 / Math.sqrt(orbitalDistance);

    // Much more varied orbital inclinations to cover the entire planet
    // Mix of equatorial, mid-inclination, and polar orbits
    const orbitType = rng();
    let orbitalInclination: number;
    if (orbitType < 0.3) {
      // 30% equatorial (0-25 degrees)
      orbitalInclination = rng() * 25;
    } else if (orbitType < 0.6) {
      // 30% mid-inclination (25-65 degrees)
      orbitalInclination = 25 + rng() * 40;
    } else {
      // 40% polar/highly inclined (65-180 degrees)
      orbitalInclination = 65 + rng() * 115;
    }

    // Random starting angle
    const orbitalAngle = rng() * Math.PI * 2;

    // Size varies by type
    const size =
      selectedType === "research" || selectedType === "military"
        ? 0.003 + rng() * 0.002 // Larger
        : 0.001 + rng() * 0.001; // Smaller

    satellites.push({
      id: `sat-${seed}-${i}`,
      name: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}-${
        i + 1
      }`,
      type: selectedType,
      orbitalDistance,
      orbitalSpeed,
      orbitalAngle,
      orbitalInclination,
      size,
      technology: avgTech,
      active: rng() < 0.95, // 95% active, 5% defunct
    });
  }

  return satellites;
}
