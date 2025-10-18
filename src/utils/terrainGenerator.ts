import { ContinentData, CityData, TerrainType } from "../types/planet.types";
import {
  continentNoise,
  elevationNoise,
  temperatureNoise,
  NoiseConfig,
  remap,
} from "./noiseUtils";
import { generateContinentName, generateCityName } from "./nameGenerator";

interface GenerateContinentsOptions {
  seed: number;
  count: number;
  planetRadius: number; // kilometers
  noise: NoiseConfig;
  preferredTerrains?: TerrainType[];
}

interface GenerateCitiesOptions {
  seed: number;
  continents: ContinentData[];
  density: number; // 0-0.1 typical
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function choose<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function jitter(rng: () => number, amount: number): number {
  return (rng() * 2 - 1) * amount;
}

const DEFAULT_TERRAINS: TerrainType[] = [
  "plains",
  "forest",
  "desert",
  "mountains",
  "tundra",
  "grassland",
  "jungle",
];

export function generateContinents(
  options: GenerateContinentsOptions
): ContinentData[] {
  const { seed, count, planetRadius, noise, preferredTerrains } = options;
  const rng = mulberry32(seed >>> 0);
  const continents: ContinentData[] = [];

  for (let i = 0; i < count; i++) {
    // Distribute centers roughly evenly over the globe using latitude weighting
    const lat = remap(rng(), 0, 1, -60, 75); // avoid extreme poles for most continents
    const lng = remap(rng(), 0, 1, -180, 180);

    // Determine size from noise + randomness
    const base = continentNoise(lat, lng, noise);
    const size = Math.min(1, Math.max(0.05, base));

    // Primary/secondary terrain selection
    const terrainPool =
      preferredTerrains && preferredTerrains.length > 0
        ? preferredTerrains
        : DEFAULT_TERRAINS;
    const primary = choose(rng, terrainPool);
    const secondaryChoices = terrainPool.filter((t) => t !== primary);
    const secondary: TerrainType[] = [];
    if (secondaryChoices.length > 0 && rng() < 0.7)
      secondary.push(choose(rng, secondaryChoices));
    if (secondaryChoices.length > 1 && rng() < 0.35)
      secondary.push(choose(rng, secondaryChoices));

    // Climate approximations from latitude and temperature noise
    const temp = Math.max(
      -1,
      Math.min(1, temperatureNoise(lat, lng, noise) * 1.2)
    );
    const humidity = Math.max(0, Math.min(1, 0.5 + jitter(rng, 0.3)));
    const precipitation = Math.max(0, Math.min(1, 0.5 + jitter(rng, 0.3)));

    // Shape control points: generate a ring of points around the center
    const controlPoints: Array<{ lat: number; lng: number; weight: number }> =
      [];
    const numPoints = 8 + Math.floor(rng() * 6); // 8-13
    for (let p = 0; p < numPoints; p++) {
      const angle = (p / numPoints) * Math.PI * 2;
      const radiusDeg = remap(size, 0, 1, 5, 25) + jitter(rng, 3);
      const cpLat =
        lat + Math.cos(angle) * radiusDeg * (1 - Math.abs(lat) / 120);
      const cpLng =
        lng + (Math.sin(angle) * radiusDeg) / Math.cos((lat * Math.PI) / 180);
      const weight = 0.7 + rng() * 0.6; // 0.7 - 1.3
      controlPoints.push({ lat: cpLat, lng: cpLng, weight });
    }

    const elevationBase = elevationNoise(lat, lng, noise);
    const elevation = Math.max(0.3, Math.min(2.0, 0.8 + elevationBase));

    continents.push({
      id: `cont-${seed}-${i}`,
      name: generateContinentName(seed + i),
      shape: {
        centerLat: lat,
        centerLng: lng,
        size,
        shapeType: "irregular",
        controlPoints,
      },
      terrain: {
        primary,
        secondary,
        elevation,
      },
      climate: {
        temperature: temp,
        humidity,
        precipitation,
      },
    });
  }

  return continents;
}

export function generateCities(options: GenerateCitiesOptions): CityData[] {
  const { seed, continents, density } = options;
  const rng = mulberry32((seed + 12345) >>> 0);

  const cities: CityData[] = [];
  continents.forEach((continent, idx) => {
    // Number of cities scales with continent size and global density
    const baseCount = Math.round(continent.shape.size * 20 * density * 100);
    const count = Math.max(1, Math.min(50, baseCount + Math.floor(rng() * 3)));

    for (let i = 0; i < count; i++) {
      // Place near center with jitter; larger jitter for larger continents
      const latJitter = jitter(rng, 6 + continent.shape.size * 8);
      const lngJitter = jitter(rng, 8 + continent.shape.size * 12);
      const lat = continent.shape.centerLat + latJitter;
      const lng = continent.shape.centerLng + lngJitter;

      // City characteristics
      const size = Math.max(0.01, Math.min(0.08, 0.02 + rng() * 0.06));
      const population = Math.floor(10000 + rng() * 9_000_000 * size);
      const glowIntensity = Math.max(0.2, Math.min(1, 0.5 + jitter(rng, 0.4)));
      const glowColor = rng() < 0.5 ? "#ffff88" : "#ffd966";
      const types: CityData["type"][] = [
        "metropolis",
        "city",
        "town",
        "settlement",
      ];
      const type = choose(rng, types);

      cities.push({
        id: `ct-${seed}-${idx}-${i}`,
        name: generateCityName(seed + idx * 100 + i),
        lat,
        lng,
        size,
        population,
        type,
        culture: rng() < 0.5 ? "coastal" : "inland",
        technology: Math.max(0, Math.min(1, 0.5 + jitter(rng, 0.3))),
        glowIntensity,
        glowColor,
        lightPattern: rng() < 0.5 ? "grid" : "organic",
      });
    }
  });

  return cities;
}
