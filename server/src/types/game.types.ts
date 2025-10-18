export interface Player {
  id: string;
  name: string;
  color: string;
  researchPoints: number;
  tunnelCapacity: number;
}

export interface SolarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  planets: Planet[];
  discovered: boolean;
  colonized: boolean;
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
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  activeView: "solar" | "constellation";
}

export type ViewType = "solar" | "constellation";
