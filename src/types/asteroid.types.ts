export type MaterialType =
  | "silicate"
  | "iron"
  | "nickel"
  | "carbonaceous"
  | "ice"
  | "platinum"
  | "gold"
  | "rare_earth";

export interface ResourceData {
  material: MaterialType;
  abundance: number; // percentage (0-100)
  rareMetals: string[]; // array of rare metal names like ["Platinum", "Gold", "Iridium"]
}

export interface AsteroidData {
  id: string;
  name: string;
  position: [number, number, number]; // orbital position in 3D space
  size: number; // radius in Earth radii
  rotation: {
    axis: [number, number, number]; // normalized rotation axis
    speed: number; // radians per second
    direction: 1 | -1; // rotation direction
  };
  orbital: {
    distance: number; // distance from sun in AU
    speed: number; // orbital speed
    angle: number; // current orbital angle in radians
    eccentricity: number; // orbital eccentricity (0-1)
  };
  material: MaterialType;
  resources: ResourceData;
  shapeSeed: number; // seed for procedural shape generation
  seed: number; // general generation seed
}

export interface AsteroidBeltData {
  id: string;
  name: string;
  innerRadius: number; // inner edge in AU
  outerRadius: number; // outer edge in AU
  asteroidCount: number;
  asteroids: AsteroidData[];
  seed: number;
  materialDistribution: {
    [key in MaterialType]: number; // percentage distribution
  };
}

// Generation parameters for asteroid belts
export interface AsteroidBeltGenerationParams {
  innerRadius: number;
  outerRadius: number;
  asteroidCount: number;
  beltType: "inner" | "outer"; // affects material distribution
  seed?: number;
}

// Generation parameters for individual asteroids
export interface AsteroidGenerationParams {
  beltType: "inner" | "outer";
  orbitalDistance: number;
  seed: number;
}
