export interface PlanetData {
  // Basic properties
  id: string;
  name: string;
  type: PlanetType;

  // Physical properties
  radius: number; // in kilometers
  mass: number; // in Earth masses
  gravity: number; // in g
  rotationSpeed: number; // in hours per day
  axialTilt: number; // in degrees
  // Spin properties
  spinAxis: [number, number, number]; // normalized axis vector
  spinSpeed: number; // radians per second
  spinDirection: 1 | -1;

  // Orbital properties
  orbitalDistance: number; // in AU
  orbitalSpeed: number; // in km/s
  orbitalEccentricity: number; // 0-1
  orbitalInclination: number; // in degrees

  // Surface properties
  surface: SurfaceData;

  // Atmospheric properties
  atmosphere: AtmosphereData;

  // Visual properties
  appearance: AppearanceData;

  // Generation seed for reproducibility
  seed: number;
}

export type PlanetType =
  | "terrestrial"
  | "ocean_world"
  | "desert_world"
  | "ice_world"
  | "gas_giant"
  | "ice_giant"
  | "dwarf_planet"
  | "lava_world"
  | "jungle_world"
  | "arctic_world"
  | "earth_like";

export interface SurfaceData {
  // Terrain types and their coverage percentages
  terrainCoverage: {
    ocean: number; // 0-1
    land: number; // 0-1
    ice: number; // 0-1
    desert: number; // 0-1
    forest: number; // 0-1
    mountains: number; // 0-1
    plains: number; // 0-1
    tundra: number; // 0-1
    jungle: number; // 0-1
    lava: number; // 0-1
  };

  // Elevation data
  elevation: {
    minHeight: number; // in meters
    maxHeight: number; // in meters
    averageHeight: number; // in meters
    roughness: number; // 0-1, how jagged the terrain is
  };

  // Continental data
  continents: ContinentData[];

  // City data
  cities: CityData[];

  // Temperature zones
  temperatureZones: {
    polar: number; // coverage 0-1
    temperate: number; // coverage 0-1
    tropical: number; // coverage 0-1
    equatorial: number; // coverage 0-1
  };
}

export interface ContinentData {
  id: string;
  name: string;
  // Continental shape defined by control points for procedural generation
  shape: {
    centerLat: number; // -90 to 90
    centerLng: number; // -180 to 180
    size: number; // 0-1, relative to planet size
    shapeType: "irregular" | "circular" | "elongated" | "fragmented";
    controlPoints: Array<{
      lat: number;
      lng: number;
      weight: number; // influence on shape
    }>;
  };

  // Terrain composition
  terrain: {
    primary: TerrainType;
    secondary: TerrainType[];
    elevation: number; // average elevation multiplier
  };

  // Climate
  climate: {
    temperature: number; // -1 to 1 (cold to hot)
    humidity: number; // 0-1
    precipitation: number; // 0-1
  };
}

export type TerrainType =
  | "ocean"
  | "plains"
  | "forest"
  | "desert"
  | "mountains"
  | "tundra"
  | "ice"
  | "jungle"
  | "grassland"
  | "swamp"
  | "volcanic"
  | "canyon"
  | "mesa"
  | "badlands";

export interface CityData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  size: number; // 0-1, relative to planet size
  population: number;
  type: "metropolis" | "city" | "town" | "settlement";
  culture: string; // cultural theme
  technology: number; // 0-1, tech level
  // Visual properties
  glowIntensity: number; // 0-1
  glowColor: string; // hex color
  lightPattern: "grid" | "organic" | "sparse" | "dense";
}

export interface AtmosphereData {
  present: boolean;
  composition: {
    nitrogen: number; // percentage
    oxygen: number; // percentage
    carbonDioxide: number; // percentage
    argon: number; // percentage
    waterVapor: number; // percentage
    methane: number; // percentage
    other: number; // percentage
  };

  // Physical properties
  pressure: number; // in atmospheres
  density: number; // relative to Earth
  height: number; // in kilometers

  // Visual properties
  color: string; // hex color
  opacity: number; // 0-1
  scattering: number; // 0-1, how much light scatters

  // Weather
  clouds: CloudData;
  weather: WeatherData;
}

export interface CloudData {
  present: boolean;
  coverage: number; // 0-1, global cloud coverage
  types: CloudType[];
  patterns: CloudPattern[];
  opacity: number; // 0-1
  speed: number; // wind speed affecting clouds
  altitude: number; // in kilometers
}

export type CloudType =
  | "cumulus"
  | "stratus"
  | "cirrus"
  | "nimbus"
  | "altocumulus"
  | "altostratus"
  | "cirrocumulus"
  | "cirrostratus";

export interface CloudPattern {
  type: CloudType;
  coverage: number; // 0-1, how much of the planet this covers
  density: number; // 0-1, how dense the clouds are
  size: number; // 0-1, average cloud size
  distribution: "uniform" | "polar" | "equatorial" | "continental" | "random";
}

export interface WeatherData {
  temperature: {
    min: number; // in Celsius
    max: number; // in Celsius
    average: number; // in Celsius
    variation: number; // 0-1, how much temperature varies
  };

  precipitation: {
    type: "rain" | "snow" | "hail" | "acid_rain" | "none";
    frequency: number; // 0-1
    intensity: number; // 0-1
    seasonal: boolean;
  };

  wind: {
    speed: number; // in km/h
    direction: number; // in degrees
    variability: number; // 0-1, how much wind direction changes
  };

  storms: {
    frequency: number; // 0-1
    intensity: number; // 0-1
    type: "thunderstorm" | "hurricane" | "blizzard" | "dust_storm" | "none";
  };
}

export interface AppearanceData {
  // Base colors
  baseColor: string; // hex color
  secondaryColor: string; // hex color
  accentColor: string; // hex color

  // Surface appearance
  surface: {
    albedo: number; // 0-1, how reflective
    roughness: number; // 0-1, surface roughness
    metallic: number; // 0-1, metallic properties
    emission: number; // 0-1, self-illumination
  };

  // Atmospheric appearance
  atmosphere: {
    color: string; // hex color
    opacity: number; // 0-1
    glowColor: string; // hex color
    glowIntensity: number; // 0-1
  };

  // Special effects
  effects: {
    aurora: boolean;
    auroraColor: string;
    auroraIntensity: number; // 0-1
    rings: boolean;
    ringColor: string;
    ringOpacity: number; // 0-1
    moons: number; // number of visible moons
  };
}

// Generation parameters for procedural creation
export interface PlanetGenerationParams {
  type: PlanetType;
  size: "tiny" | "small" | "medium" | "large" | "huge";
  age: "young" | "mature" | "old" | "ancient";
  habitability: "hostile" | "marginal" | "habitable" | "ideal";
  seed?: number; // for reproducible generation
  customParams?: {
    [key: string]: any;
  };
}

// Preset planet configurations
export interface PlanetPreset {
  name: string;
  description: string;
  type: PlanetType;
  generationParams: PlanetGenerationParams;
  // Override specific properties if needed
  overrides?: Partial<PlanetData>;
}

// Utility types for generation
export interface NoiseConfig {
  octaves: number;
  frequency: number;
  amplitude: number;
  lacunarity: number;
  persistence: number;
  seed: number;
}

export interface TerrainGenerationConfig {
  noise: NoiseConfig;
  erosion: number; // 0-1
  smoothing: number; // 0-1
  detail: number; // 0-1
}
