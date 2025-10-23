import configs from "../data/planetConfigs.json";
import { AtmosphereData, CloudData, PlanetType } from "../types/planet.types";
import { NoiseConfig, cloudNoise, randomRange } from "./noiseUtils";

interface GenerateAtmosphereOptions {
  seed: number;
  type: PlanetType;
  noise: NoiseConfig;
}

export function generateAtmosphere(
  options: GenerateAtmosphereOptions
): AtmosphereData {
  const { seed, type, noise } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = (configs as any)[type];

  // Make atmosphere presence probabilistic for variety (gas giants always have)
  let present: boolean = cfg?.atmosphere?.present ?? true;
  const r = randomRange(0, 1, seed + 12);
  if (type === "gas_giant") present = true;
  else if (type === "lava_world") present = r < 0.6;
  else if (
    type === "desert_world" ||
    type === "ice_world" ||
    type === "terrestrial" ||
    type === "ocean_world"
  )
    present = r < 0.85;
  const color: string = cfg?.atmosphere?.color ?? "#87CEEB";
  const baseOpacity = cfg?.atmosphere?.opacity?.default ?? 0.2;
  const pressureMin = cfg?.atmosphere?.pressure?.min ?? 0.1;
  const pressureMax = cfg?.atmosphere?.pressure?.max ?? 5.0;
  const heightMin = cfg?.atmosphere?.height?.min ?? 50;
  const heightMax = cfg?.atmosphere?.height?.max ?? 200;

  const pressure = randomRange(pressureMin, pressureMax, seed + 13);
  const density = Math.max(0.05, Math.min(5, pressure));
  const height = randomRange(heightMin, heightMax, seed + 17);
  const opacity = Math.max(
    0.05,
    Math.min(1, baseOpacity + (density - 1) * 0.05)
  );

  const clouds = generateClouds({ seed: seed + 101, type, noise });

  return {
    present,
    composition: {
      nitrogen: cfg?.atmosphere?.composition?.nitrogen?.default ?? 0.78,
      oxygen: cfg?.atmosphere?.composition?.oxygen?.default ?? 0.21,
      carbonDioxide:
        cfg?.atmosphere?.composition?.carbonDioxide?.default ?? 0.01,
      argon: cfg?.atmosphere?.composition?.argon?.default ?? 0.009,
      waterVapor: cfg?.atmosphere?.composition?.waterVapor?.default ?? 0.01,
      methane: cfg?.atmosphere?.composition?.methane?.default ?? 0.0,
      other: 0.0,
    },
    pressure,
    density,
    height,
    color,
    opacity,
    scattering: 0.5,
    clouds,
    weather: {
      temperature: {
        min: -80,
        max: 60,
        average: 10,
        variation: 0.4,
      },
      precipitation: {
        type: "rain",
        frequency: 0.3,
        intensity: 0.3,
        seasonal: true,
      },
      wind: {
        speed: 25,
        direction: 90,
        variability: 0.5,
      },
      storms: {
        frequency: 0.1,
        intensity: 0.4,
        type: "thunderstorm",
      },
    },
  };
}

function generateClouds(params: {
  seed: number;
  type: PlanetType;
  noise: NoiseConfig;
}): CloudData {
  const { seed, type, noise } = params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = (configs as any)[type];
  const coverageDefault = cfg?.atmosphere?.clouds?.coverage?.default ?? 0.35;
  const present = cfg?.atmosphere?.clouds?.present ?? true;

  // Sample cloud noise at several bands to estimate global coverage modifier
  const samples = [
    cloudNoise(0, 0, noise),
    cloudNoise(30, 60, { ...noise, seed: noise.seed + 1 }),
    cloudNoise(-30, -120, { ...noise, seed: noise.seed + 2 }),
    cloudNoise(60, 180, { ...noise, seed: noise.seed + 3 }),
  ];
  const avgNoise = samples.reduce((a, b) => a + b, 0) / samples.length;

  const coverage = Math.max(0, Math.min(1, coverageDefault + avgNoise * 0.2));
  const opacity = Math.max(0.2, Math.min(0.9, 0.4 + (coverage - 0.3)));

  return {
    present,
    coverage,
    types: ["cumulus", "stratus", "cirrus"],
    patterns: [
      {
        type: "cumulus",
        coverage: coverage * 0.5,
        density: 0.6,
        size: 0.6,
        distribution: "continental",
      },
      {
        type: "stratus",
        coverage: coverage * 0.3,
        density: 0.4,
        size: 0.9,
        distribution: "uniform",
      },
      {
        type: "cirrus",
        coverage: coverage * 0.2,
        density: 0.3,
        size: 0.3,
        distribution: "equatorial",
      },
    ],
    opacity,
    speed: randomRange(20, 120, seed + 7),
    altitude: randomRange(5, 15, seed + 9),
  };
}
