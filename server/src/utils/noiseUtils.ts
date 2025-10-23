// Simple noise generation utilities for procedural planet generation
// Using simplified Perlin-like noise for performance

export interface NoiseConfig {
  octaves: number;
  frequency: number;
  amplitude: number;
  lacunarity: number;
  persistence: number;
  seed: number;
}

// Simple hash function for seeding
function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) / 2147483648.0;
}

// Smooth interpolation function
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3.0 - 2.0 * t);
}

// Generate 2D noise value at given coordinates
export function noise2D(x: number, y: number, seed: number = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  // Get corner values
  const n00 = hash(xi, yi, seed);
  const n01 = hash(xi, yi + 1, seed);
  const n10 = hash(xi + 1, yi, seed);
  const n11 = hash(xi + 1, yi + 1, seed);

  // Interpolate
  const u = smoothstep(0, 1, xf);
  const v = smoothstep(0, 1, yf);

  const n0 = n00 * (1 - u) + n10 * u;
  const n1 = n01 * (1 - u) + n11 * u;

  return n0 * (1 - v) + n1 * v;
}

// Generate fractal noise using multiple octaves
export function fractalNoise2D(
  x: number,
  y: number,
  config: NoiseConfig
): number {
  let value = 0;
  let amplitude = config.amplitude;
  let frequency = config.frequency;
  let maxValue = 0;

  for (let i = 0; i < config.octaves; i++) {
    value += noise2D(x * frequency, y * frequency, config.seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= config.persistence;
    frequency *= config.lacunarity;
  }

  return value / maxValue;
}

// Generate ridged noise (good for mountain ranges)
export function ridgedNoise2D(
  x: number,
  y: number,
  config: NoiseConfig
): number {
  const value = Math.abs(fractalNoise2D(x, y, config));
  return 1.0 - value;
}

// Generate billowy noise (good for clouds)
export function billowyNoise2D(
  x: number,
  y: number,
  config: NoiseConfig
): number {
  return Math.abs(fractalNoise2D(x, y, config));
}

// Generate domain warped noise (good for organic shapes)
export function domainWarpedNoise2D(
  x: number,
  y: number,
  config: NoiseConfig,
  warpStrength: number = 0.1
): number {
  const warpX = fractalNoise2D(x, y, { ...config, seed: config.seed + 1000 });
  const warpY = fractalNoise2D(x, y, { ...config, seed: config.seed + 2000 });

  return fractalNoise2D(
    x + warpX * warpStrength,
    y + warpY * warpStrength,
    config
  );
}

// Generate noise for spherical coordinates (lat/lng)
export function sphericalNoise(
  lat: number,
  lng: number,
  config: NoiseConfig
): number {
  // Convert spherical to cartesian for better noise distribution
  const x = Math.cos((lat * Math.PI) / 180) * Math.cos((lng * Math.PI) / 180);
  const y = Math.cos((lat * Math.PI) / 180) * Math.sin((lng * Math.PI) / 180);
  const z = Math.sin((lat * Math.PI) / 180);

  // Use 3D noise projected to 2D
  return fractalNoise2D(x * 10, y * 10, config);
}

// Generate continent-like shapes
export function continentNoise(
  lat: number,
  lng: number,
  config: NoiseConfig
): number {
  // Use multiple noise layers for realistic continent shapes
  const baseNoise = sphericalNoise(lat, lng, {
    ...config,
    octaves: 4,
    frequency: 0.5,
    amplitude: 1.0,
  });

  const detailNoise = sphericalNoise(lat, lng, {
    ...config,
    octaves: 2,
    frequency: 2.0,
    amplitude: 0.3,
    seed: config.seed + 100,
  });

  const ridgeNoise = ridgedNoise2D(lat * 0.1, lng * 0.1, {
    ...config,
    octaves: 3,
    frequency: 1.0,
    amplitude: 0.2,
    seed: config.seed + 200,
  });

  return baseNoise + detailNoise + ridgeNoise;
}

// Generate elevation noise
export function elevationNoise(
  lat: number,
  lng: number,
  config: NoiseConfig
): number {
  const baseElevation = sphericalNoise(lat, lng, {
    ...config,
    octaves: 6,
    frequency: 0.8,
    amplitude: 1.0,
  });

  const mountainNoise = ridgedNoise2D(lat * 0.2, lng * 0.2, {
    ...config,
    octaves: 4,
    frequency: 1.5,
    amplitude: 0.5,
    seed: config.seed + 300,
  });

  const detailNoise = sphericalNoise(lat, lng, {
    ...config,
    octaves: 3,
    frequency: 3.0,
    amplitude: 0.2,
    seed: config.seed + 400,
  });

  return baseElevation + mountainNoise + detailNoise;
}

// Generate cloud noise
export function cloudNoise(
  lat: number,
  lng: number,
  config: NoiseConfig
): number {
  const baseClouds = billowyNoise2D(lat * 0.1, lng * 0.1, {
    ...config,
    octaves: 4,
    frequency: 1.0,
    amplitude: 1.0,
  });

  const detailClouds = billowyNoise2D(lat * 0.3, lng * 0.3, {
    ...config,
    octaves: 2,
    frequency: 2.0,
    amplitude: 0.3,
    seed: config.seed + 500,
  });

  return Math.max(0, baseClouds + detailClouds - 0.3);
}

// Generate temperature noise (for climate zones)
export function temperatureNoise(
  lat: number,
  lng: number,
  config: NoiseConfig
): number {
  // Base temperature based on latitude
  const baseTemp = Math.cos((lat * Math.PI) / 180);

  // Add noise for variation
  const tempNoise = sphericalNoise(lat, lng, {
    ...config,
    octaves: 3,
    frequency: 0.5,
    amplitude: 0.2,
    seed: config.seed + 600,
  });

  return baseTemp + tempNoise;
}

// Utility function to remap values from one range to another
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

// Generate random value within range
export function randomRange(
  min: number,
  max: number,
  seed: number = 0
): number {
  const x = Math.sin(seed) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

// Generate random integer within range
export function randomInt(min: number, max: number, seed: number = 0): number {
  return Math.floor(randomRange(min, max + 1, seed));
}

// Generate random choice from array
export function randomChoice<T>(choices: T[], seed: number = 0): T {
  const index = randomInt(0, choices.length - 1, seed);
  return choices[index];
}
