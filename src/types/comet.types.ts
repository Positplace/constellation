export type CometType = "short_period" | "long_period" | "halley_type";

export interface CometComposition {
  ice: number; // percentage (0-100)
  dust: number; // percentage (0-100)
  rock: number; // percentage (0-100)
}

export interface CometTailData {
  dustTailColor: string; // Curved, yellowish tail
  ionTailColor: string; // Straight, bluish tail
  intensity: number; // 0-1, based on distance from star
  length: number; // Visual length in scene units
}

export interface CometData {
  id: string;
  name: string;
  type: CometType;
  position: [number, number, number]; // orbital position in 3D space
  nucleusSize: number; // radius in km (typically 1-50km)
  rotation: {
    axis: [number, number, number]; // normalized rotation axis
    speed: number; // radians per second
    direction: 1 | -1;
  };
  orbital: {
    semiMajorAxis: number; // average distance from sun in AU
    eccentricity: number; // orbital eccentricity (0.2-0.995)
    inclination: number; // orbital inclination in radians
    angle: number; // current orbital angle in radians
    speed: number; // current orbital speed
    perihelion: number; // closest approach to star in AU
    aphelion: number; // farthest distance from star in AU
    period: number; // orbital period in game years
  };
  composition: CometComposition;
  tail: CometTailData;
  discovered: boolean;
  lastPerihelion: number; // game time of last closest approach
  seed: number;
}

// Generation parameters for comets
export interface CometGenerationParams {
  cometType: CometType;
  habitableZoneMin: number; // To determine perihelion
  habitableZoneMax: number; // To determine aphelion range
  systemOuterBoundary: number; // Maximum extent of system
  seed: number;
}
