import configs from "../data/planetConfigs.json";
import {
  PlanetData,
  PlanetGenerationParams,
  PlanetType,
  AppearanceData,
} from "../types/planet.types";
import { NoiseConfig, randomInt, randomRange } from "./noiseUtils";
import { generateAtmosphere } from "./atmosphereGenerator";
import { generateContinents, generateCities } from "./terrainGenerator";
import { generatePlanetName } from "./nameGenerator";

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
  const orbitalSpeed = randomRange(0.05, 1.5, seed + 7); // arbitrary sim units
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

  const cityDensity = cfg.surface.cityDensity?.default ?? 0.02;
  const cities = generateCities({ seed, continents, density: cityDensity });

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
    surface,
    atmosphere,
    appearance,
    seed,
    spinAxis,
    spinSpeed,
    spinDirection,
  };

  return planet;
}

function chooseColor(list: string[] | undefined, fallback: string): string {
  if (!list || list.length === 0) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}
