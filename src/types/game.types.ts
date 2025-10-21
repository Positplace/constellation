import { PlanetData } from "./planet.types";
import { AsteroidBeltData } from "./asteroid.types";
import { CometData } from "./comet.types";
import { NebulaData } from "./nebula.types";

export interface Player {
  id: string;
  name: string;
  color: string;
  researchPoints: number;
  tunnelCapacity: number;
}

export type StarType =
  | "red_dwarf"
  | "orange_star"
  | "yellow_star"
  | "white_star"
  | "blue_giant"
  | "red_giant"
  | "white_dwarf"
  | "binary_star"
  | "black_hole";

export interface CompanionStarData {
  type: StarType;
  color: string;
  glowColor: string;
  size: number;
  temperature: number;
  luminosity: number;
  orbitalDistance: number; // Distance from primary star
  orbitalSpeed: number;
  orbitalAngle: number; // Current angle in orbit
}

export interface BlackHoleData {
  accretionDiskColor: string;
  accretionDiskInnerRadius: number;
  accretionDiskOuterRadius: number;
  eventHorizonRadius: number;
  hawkingRadiation: boolean;
}

export interface StarData {
  id: string;
  type: StarType;
  name: string;
  color: string;
  glowColor: string;
  size: number;
  temperature: number;
  luminosity: number;
  companion?: CompanionStarData; // For binary star systems
  blackHole?: BlackHoleData; // For black hole systems
}

export interface SolarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  star: StarData;
  planets: PlanetData[]; // Use full PlanetData instead of simple Planet
  asteroidBelts?: AsteroidBeltData[]; // Optional asteroid belts
  comets?: CometData[]; // Optional comets
  nebulae?: NebulaData[]; // Optional nebulae
  connections: string[]; // IDs of connected systems
  discovered: boolean;
  colonized: boolean;
  seed: number;
}

export interface Planet {
  id: string;
  name: string;
  type: "terrestrial" | "gas_giant" | "ice_giant" | "dwarf";
  size: number;
  distance: number; // from sun
  orbitalSpeed: number;
  colonized: boolean;
  controlledBy?: string;
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
  activeView: "solar" | "constellation";
}

export type ViewType = "solar" | "constellation";

export type SelectedObjectType =
  | "sun"
  | "planet"
  | "asteroid"
  | "moon"
  | "spaceship"
  | "comet";

export interface SelectedObject {
  id: string;
  type: SelectedObjectType;
}
