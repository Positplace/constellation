import * as THREE from "three";

export type SpaceshipState =
  | "launching"
  | "traveling"
  | "orbiting"
  | "landing"
  | "waiting";
export type ObjectType = "planet" | "moon" | "asteroid" | "sun"; // Added sun for completeness, though not used for launch yet

export interface FlightPath {
  points: THREE.Vector3[];
  duration: number; // Duration for this specific segment
}

export interface SpaceshipData {
  id: string;
  origin: { id: string; type: ObjectType };
  destination: { id: string; type: ObjectType };
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  state: SpaceshipState;
  stateStartTime: number; // Timestamp when the current state began
  currentPathIndex: number; // For tracking progress along a path segment
  trail: THREE.Vector3[]; // Array of past positions for the trail
  color: string;
  speed: number; // Base speed multiplier
  totalFlightTime: number; // Total estimated time for the entire journey
  size: number;
  glowIntensity: number;
  trailPositions: THREE.Vector3[];
  maxTrailLength: number;
}

export interface LaunchConfig {
  takeoffDuration: number; // seconds
  travelSpeed: number; // units per second
  orbitDuration: number; // seconds
  landingDuration: number; // seconds
  takeoffAltitude: number; // units above surface
  landingAltitude: number; // units above surface
  orbitRadius: number; // units around destination
  trailLength: number; // number of points in the trail
  trailFadeTime: number; // seconds for trail to fade
  takeoffHeight: number; // height for takeoff phase
}

export const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  takeoffDuration: 2.0,
  travelSpeed: 4.0, // Adjust as needed
  orbitDuration: 1.0,
  landingDuration: 2.0,
  takeoffAltitude: 0.5,
  landingAltitude: 0.2,
  orbitRadius: 0.3,
  trailLength: 50,
  trailFadeTime: 1.5,
  takeoffHeight: 0.3,
};
