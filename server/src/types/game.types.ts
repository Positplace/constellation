import { PlanetData } from "./planet.types";
import { AsteroidBeltData } from "./asteroid.types";
import { CometData } from "./comet.types";
import { NebulaData } from "./nebula.types";

export interface Player {
  id: string; // Socket ID
  uuid: string; // Persistent player UUID
  name: string;
  color: string;
  researchPoints: number;
  tunnelCapacity: number;
  homeSystemId?: string; // ID of player's home system
  homePlanetId?: string; // ID of player's home planet
}

export type StarType =
  | "yellow_star"
  | "red_dwarf"
  | "blue_giant"
  | "white_dwarf"
  | "orange_star"
  | "binary_star"
  | "neutron_star"
  | "black_hole";

export interface StarData {
  id: string;
  type: StarType;
  name: string;
  color: string;
  glowColor?: string;
  size: number;
  temperature: number;
  luminosity: number;
  companion?: {
    type: StarType;
    color: string;
    glowColor?: string;
    size: number;
    temperature: number;
    luminosity: number;
    orbitalDistance: number;
    orbitalSpeed: number;
    orbitalAngle: number;
  };
  blackHole?: {
    accretionDiskColor: string;
    accretionDiskInnerRadius: number;
    accretionDiskOuterRadius: number;
    eventHorizonRadius: number;
    hawkingRadiation: boolean;
  };
}

export interface SolarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  star: StarData;
  planets: PlanetData[];
  asteroidBelts?: AsteroidBeltData[];
  comets?: CometData[];
  nebulae?: NebulaData[];
  dysonSphere?: {
    completionPercentage: number;
  };
  connections: string[];
  maxConnections: number;
  discovered: boolean;
  colonized: boolean;
  seed: number;
}

export interface Tunnel {
  id: string;
  from: string; // solar system ID
  to: string; // solar system ID
  capacity: number;
  status: "planned" | "under_construction" | "active";
  controlledBy?: string;
}

export interface GameState {
  players: Player[];
  solarSystems: SolarSystem[];
  tunnels: Tunnel[];
  currentTurn: number;
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  activeView: "solar" | "constellation";
  currentSystemId?: string;
  spaceships?: any[]; // SpaceshipData[] - using any to avoid circular dependencies
}

export type ViewType = "solar" | "constellation";

export interface SelectedObject {
  id: string;
  type: "sun" | "planet" | "asteroid" | "moon" | "spaceship" | "comet";
}
