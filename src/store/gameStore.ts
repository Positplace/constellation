import { create } from "zustand";
import * as THREE from "three";
import {
  Player,
  SolarSystem,
  Tunnel,
  ViewType,
  StarType,
  SelectedObject,
} from "../types/game.types";
import {
  generateSolarSystem,
  calculateConnectedSystemPosition,
} from "../utils/systemFactory";
import { SpaceshipData, ObjectType } from "../types/spaceship.types";
import {
  createSpaceship,
  getObjectWorldPosition,
  calculateFlightTime,
  getNextSpaceshipPosition,
  predictObjectPosition,
} from "../utils/spaceshipUtils";

const STORAGE_KEY = "constellation-game-state";

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

interface GameStore {
  // View state
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  constellationCameraState: CameraState | null; // Saved camera state for constellation view
  saveConstellationCameraState: (state: CameraState) => void;

  // Game state
  players: Player[];
  solarSystems: SolarSystem[];
  tunnels: Tunnel[];
  currentSystemId: string | null;
  currentTurn: number;
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  timeScale: number; // 0..1 smooth playback factor
  selectedObject: SelectedObject | null; // Currently selected object in solar view (sun, planet, asteroid, or moon)
  showPlanetDetails: boolean; // Whether to show planet details card

  // Spaceship state
  spaceships: SpaceshipData[];

  // Actions
  addPlayer: (player: Player) => void;
  addSolarSystem: (system: SolarSystem) => void;
  addTunnel: (tunnel: Tunnel) => void;
  setCurrentSystem: (id: string) => void;
  generateAndAddSystem: (
    fromSystemId?: string,
    starType?: StarType
  ) => SolarSystem;
  canAddConnection: (systemId: string) => boolean;
  nextTurn: () => void;
  togglePlayPause: () => void;
  updateGameTime: (time: number) => void;
  setTimeScale: (scale: number) => void;
  setSelectedObject: (object: SelectedObject | null) => void;
  updateSystemPosition: (
    systemId: string,
    position: [number, number, number]
  ) => void;
  initializeGame: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  clearSavedGame: () => void; // Clear localStorage and restart
  regenerateAllSystems: () => void; // Regenerate systems with latest features

  // Spaceship actions
  launchShip: (
    fromId: string,
    fromType: ObjectType,
    toId: string,
    toType: ObjectType
  ) => void;
  updateSpaceship: (id: string, updates: Partial<SpaceshipData>) => void;
  changeSpaceshipDestination: (
    id: string,
    newDestination: { id: string; type: ObjectType }
  ) => void;
  removeSpaceship: (id: string) => void;
  updateSpaceships: () => void;
  lastSpaceshipUpdate: number;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  activeView: "solar",
  constellationCameraState: null,
  players: [],
  solarSystems: [],
  tunnels: [],
  currentSystemId: null,
  currentTurn: 1,
  isPlaying: false,
  gameTime: 0,
  timeScale: 0,
  selectedObject: null,
  showPlanetDetails: false,
  spaceships: [],
  lastSpaceshipUpdate: 0,

  // Actions
  setActiveView: (view) => {
    set({ activeView: view });
    get().saveToLocalStorage();
  },

  saveConstellationCameraState: (state) => {
    set({ constellationCameraState: state });
    get().saveToLocalStorage();
  },

  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players, player],
    }));
    get().saveToLocalStorage();
  },

  addSolarSystem: (system) => {
    set((state) => ({
      solarSystems: [...state.solarSystems, system],
    }));
    get().saveToLocalStorage();
  },

  addTunnel: (tunnel) => {
    set((state) => ({
      tunnels: [...state.tunnels, tunnel],
    }));
    get().saveToLocalStorage();
  },

  setCurrentSystem: (id) => {
    set({ currentSystemId: id, selectedObject: null });
    get().saveToLocalStorage();
  },

  canAddConnection: (systemId: string) => {
    const system = get().solarSystems.find((s) => s.id === systemId);
    if (!system) return false;
    return system.connections.length < 3;
  },

  generateAndAddSystem: (fromSystemId?: string, starType?: StarType) => {
    const state = get();
    const seed = Date.now() + state.solarSystems.length;

    let position: [number, number, number] = [0, 0, 0];
    let newSystem: SolarSystem;

    if (fromSystemId) {
      const fromSystem = state.solarSystems.find((s) => s.id === fromSystemId);
      if (!fromSystem) {
        throw new Error("Source system not found");
      }

      // Check connection limit
      if (!state.canAddConnection(fromSystemId)) {
        throw new Error("Source system has reached maximum connections");
      }

      // Calculate new position relative to source system
      position = calculateConnectedSystemPosition(fromSystem.position, seed);

      // Generate new system
      newSystem = generateSolarSystem(starType, seed, position);

      // Create tunnel connection
      const tunnel: Tunnel = {
        id: `tunnel-${seed}`,
        from: fromSystemId,
        to: newSystem.id,
        capacity: 100,
        status: "active",
      };

      // Update connections
      const updatedFromSystem = {
        ...fromSystem,
        connections: [...fromSystem.connections, newSystem.id],
      };

      newSystem.connections = [fromSystemId];

      // Update state
      set((state) => ({
        solarSystems: [
          ...state.solarSystems.filter((s) => s.id !== fromSystemId),
          updatedFromSystem,
          newSystem,
        ],
        tunnels: [...state.tunnels, tunnel],
      }));
    } else {
      // Generate standalone system
      newSystem = generateSolarSystem(starType, seed, position);
      set((state) => ({
        solarSystems: [...state.solarSystems, newSystem],
      }));
    }

    get().saveToLocalStorage();
    return newSystem;
  },

  nextTurn: () => {
    set((state) => ({
      currentTurn: state.currentTurn + 1,
    }));
    get().saveToLocalStorage();
  },

  togglePlayPause: () => {
    set((state) => ({
      isPlaying: !state.isPlaying,
    }));
  },

  updateGameTime: (time) => set({ gameTime: time }),

  setTimeScale: (scale) => set({ timeScale: Math.max(0, Math.min(1, scale)) }),

  setSelectedObject: (object) => {
    // Validate that the object exists in the current system (if not null)
    if (object) {
      const state = get();
      const currentSystem = state.solarSystems.find(
        (s) => s.id === state.currentSystemId
      );

      if (!currentSystem) {
        console.warn("No current system found");
        set({ selectedObject: null });
        return;
      }

      // Validate based on object type
      switch (object.type) {
        case "sun":
          if (currentSystem.star.id !== object.id) {
            console.warn(
              `Sun ${object.id} not found in current system ${state.currentSystemId}`
            );
            set({ selectedObject: null });
            return;
          }
          break;
        case "planet":
          if (!currentSystem.planets.find((p) => p.id === object.id)) {
            console.warn(
              `Planet ${object.id} not found in current system ${state.currentSystemId}`
            );
            set({ selectedObject: null });
            return;
          }
          break;
        case "asteroid":
          if (
            !currentSystem.asteroidBelts?.some((belt) =>
              belt.asteroids.find((a) => a.id === object.id)
            )
          ) {
            console.warn(
              `Asteroid ${object.id} not found in current system ${state.currentSystemId}`
            );
            set({ selectedObject: null });
            return;
          }
          break;
        case "moon":
          if (
            !currentSystem.planets?.some((planet) =>
              planet.moons?.find((m) => m.id === object.id)
            )
          ) {
            console.warn(
              `Moon ${object.id} not found in current system ${state.currentSystemId}`
            );
            set({ selectedObject: null });
            return;
          }
          break;
        case "spaceship":
          if (!state.spaceships.find((s) => s.id === object.id)) {
            console.warn(
              `Spaceship ${object.id} not found in current system ${state.currentSystemId}`
            );
            set({ selectedObject: null });
            return;
          }
          break;
      }
    }

    set({ selectedObject: object });
  },

  updateSystemPosition: (systemId, position) => {
    set((state) => ({
      solarSystems: state.solarSystems.map((system) =>
        system.id === systemId ? { ...system, position } : system
      ),
    }));
    get().saveToLocalStorage();
  },

  initializeGame: () => {
    // Try to load from localStorage first
    get().loadFromLocalStorage();

    // If no saved game, create initial home system
    if (get().solarSystems.length === 0) {
      const homeSystem = generateSolarSystem(
        "yellow_star",
        1000,
        [0, 0, 0],
        "Sol"
      );
      homeSystem.colonized = true;

      // Mark the first earth-like or habitable planet as colonized (home planet)
      const homePlanet =
        homeSystem.planets.find((p: any) => p.type === "earth_like") ||
        homeSystem.planets.find((p: any) =>
          ["earth_like", "terrestrial", "ocean_world"].includes(p.type)
        ) ||
        homeSystem.planets[0];

      if (homePlanet) {
        (homePlanet as any).colonized = true;
      }

      set({
        solarSystems: [homeSystem],
        currentSystemId: homeSystem.id,
      });

      get().saveToLocalStorage();
    }
  },

  saveToLocalStorage: () => {
    try {
      const state = get();
      const dataToSave = {
        solarSystems: state.solarSystems,
        tunnels: state.tunnels,
        currentSystemId: state.currentSystemId,
        currentTurn: state.currentTurn,
        selectedObject: state.selectedObject,
        constellationCameraState: state.constellationCameraState,
        // Temporarily disable spaceships saving to avoid circular dependency
        // spaceships: state.spaceships,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);

        // Restore spaceships with proper Vector3 objects
        const restoredSpaceships = (data.spaceships || []).map((ship: any) => ({
          ...ship,
          position: new THREE.Vector3(
            ship.position.x,
            ship.position.y,
            ship.position.z
          ),
          velocity: new THREE.Vector3(
            ship.velocity.x,
            ship.velocity.y,
            ship.velocity.z
          ),
          trailPositions: ship.trailPositions.map(
            (pos: any) => new THREE.Vector3(pos.x, pos.y, pos.z)
          ),
        }));

        set({
          solarSystems: data.solarSystems || [],
          tunnels: data.tunnels || [],
          currentSystemId: data.currentSystemId || null,
          currentTurn: data.currentTurn || 1,
          selectedObject: data.selectedObject || null,
          constellationCameraState: data.constellationCameraState || null,
          spaceships: restoredSpaceships,
        });
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  },

  // Spaceship actions
  launchShip: (fromId, fromType, toId, toType) => {
    const state = get();
    const currentSystem = state.solarSystems.find(
      (s) => s.id === state.currentSystemId
    );
    if (!currentSystem) return;

    // Get current positions
    const originPos = getObjectWorldPosition(
      fromId,
      fromType,
      currentSystem,
      state.gameTime
    );
    const destinationPos = getObjectWorldPosition(
      toId,
      toType,
      currentSystem,
      state.gameTime
    );

    // Calculate estimated travel time and predict where destination will be
    const estimatedTravelTime =
      originPos && destinationPos
        ? originPos.distanceTo(destinationPos) / 4.0
        : 0;
    const predictedDestinationPos =
      originPos && destinationPos
        ? predictObjectPosition(
            toId,
            toType,
            currentSystem,
            state.gameTime,
            state.gameTime + estimatedTravelTime
          )
        : null;

    // DEBUG: Log spaceship launch information
    console.log("🚀 Spaceship LAUNCH DEBUG:", {
      fromId,
      fromType,
      toId,
      toType,
      gameTime: state.gameTime.toFixed(2),
      originPos: originPos?.toArray().map((v: number) => v.toFixed(2)),
      currentDestinationPos: destinationPos
        ?.toArray()
        .map((v: number) => v.toFixed(2)),
      predictedDestinationPos: predictedDestinationPos
        ?.toArray()
        .map((v: number) => v.toFixed(2)),
      usingPredictedDestination: !!predictedDestinationPos,
      distance:
        originPos && destinationPos
          ? originPos.distanceTo(destinationPos).toFixed(2)
          : "N/A",
      estimatedTravelTime: estimatedTravelTime.toFixed(2) + "s",
      predictionAccuracy:
        predictedDestinationPos && destinationPos
          ? predictedDestinationPos.distanceTo(destinationPos).toFixed(2)
          : "N/A",
    });

    if (!originPos || !destinationPos) {
      console.warn(
        "Could not find origin or destination positions for spaceship launch"
      );
      return;
    }

    // Create new spaceship with slight random offset to avoid overlapping
    const spaceshipId = `spaceship-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add very small random offset to prevent multiple ships from launching at exact same position
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02, // Very small random X offset
      (Math.random() - 0.5) * 0.02, // Very small random Y offset
      (Math.random() - 0.5) * 0.02 // Very small random Z offset
    );
    const launchPosition = originPos.clone().add(offset);

    const spaceship = createSpaceship(
      spaceshipId,
      { id: fromId, type: fromType },
      { id: toId, type: toType },
      launchPosition,
      predictedDestinationPos || destinationPos // Use predicted position if available
    );

    // Calculate total flight time
    spaceship.totalFlightTime = calculateFlightTime(originPos, destinationPos);

    set((state) => ({
      spaceships: [...state.spaceships, spaceship],
    }));

    // Automatically select the launched spaceship for tracking
    set({ selectedObject: { id: spaceship.id, type: "spaceship" } });

    // Enable debug mode for the newly launched spaceship
    (spaceship as any).debugMode = true;
    console.log(
      `🐛 Debug mode enabled for newly launched spaceship ${spaceship.id}`
    );
  },

  updateSpaceship: (id, updates) => {
    set((state) => ({
      spaceships: state.spaceships.map((ship) =>
        ship.id === id ? { ...ship, ...updates } : ship
      ),
    }));
  },

  changeSpaceshipDestination: (id, newDestination) => {
    const state = get();
    const currentSystem = state.solarSystems.find(
      (s) => s.id === state.currentSystemId
    );
    if (!currentSystem) return;

    // Get the new destination position
    const newDestinationPos = getObjectWorldPosition(
      newDestination.id,
      newDestination.type,
      currentSystem,
      state.gameTime
    );

    if (!newDestinationPos) {
      console.warn(
        "Could not find new destination position for spaceship rerouting"
      );
      return;
    }

    // Calculate predicted destination position for the new journey
    const spaceship = state.spaceships.find((ship) => ship.id === id);
    if (!spaceship) {
      console.warn("Spaceship not found for destination change");
      return;
    }

    const estimatedTravelTime =
      spaceship.position.distanceTo(newDestinationPos) / 4.0;
    const predictedNewDestinationPos = predictObjectPosition(
      newDestination.id,
      newDestination.type,
      currentSystem,
      state.gameTime,
      state.gameTime + estimatedTravelTime
    );

    console.log("🚀 Spaceship DESTINATION CHANGE DEBUG:", {
      spaceshipId: id,
      newDestination: newDestination,
      currentDestinationPos: newDestinationPos
        .toArray()
        .map((v: number) => v.toFixed(2)),
      predictedNewDestinationPos: predictedNewDestinationPos
        ?.toArray()
        .map((v: number) => v.toFixed(2)),
      estimatedTravelTime: estimatedTravelTime.toFixed(2) + "s",
      predictionAccuracy: predictedNewDestinationPos
        ? predictedNewDestinationPos.distanceTo(newDestinationPos).toFixed(2)
        : "N/A",
    });

    // Update the spaceship's destination and reset its state to traveling
    // Update the trail positions to start from current position
    set((state) => ({
      ...state,
      spaceships: state.spaceships.map((ship) =>
        ship.id === id
          ? {
              ...ship,
              destination: newDestination,
              state: "traveling",
              stateStartTime: Date.now(),
              // Update trail to start from current position for new journey
              trailPositions: [ship.position.clone()], // Start new trail from current position
              // Store the new fixed destination position (use predicted if available)
              fixedDestination: predictedNewDestinationPos
                ? predictedNewDestinationPos.clone()
                : newDestinationPos.clone(),
            }
          : ship
      ),
    }));
  },

  removeSpaceship: (id) => {
    set((state) => ({
      spaceships: state.spaceships.filter((ship) => ship.id !== id),
    }));
  },

  clearSavedGame: () => {
    localStorage.removeItem(STORAGE_KEY);
    // Reset to initial state
    set({
      solarSystems: [],
      tunnels: [],
      currentSystemId: null,
      currentTurn: 1,
      selectedObject: null,
      spaceships: [],
    });
    // Initialize new game
    get().initializeGame();
    console.log("Game cleared and restarted with latest features!");
  },

  regenerateAllSystems: () => {
    const state = get();
    const oldSystems = state.solarSystems;

    // Regenerate each system with the same seed to preserve structure but add new features
    const newSystems = oldSystems.map((oldSystem) => {
      const newSystem = generateSolarSystem(
        oldSystem.star.type,
        oldSystem.seed,
        oldSystem.position,
        oldSystem.name
      );
      // Preserve important state
      newSystem.colonized = oldSystem.colonized;
      newSystem.connections = oldSystem.connections;
      newSystem.discovered = oldSystem.discovered;
      return newSystem;
    });

    set({ solarSystems: newSystems });
    get().saveToLocalStorage();
    console.log(
      "All systems regenerated with latest features (nebulae, etc.)!"
    );
  },

  updateSpaceships: () => {
    const state = get();
    if (!state.isPlaying || state.spaceships.length === 0) return;

    // Throttle updates to 30fps max to prevent performance issues
    const now = Date.now();
    if (state.lastSpaceshipUpdate && now - state.lastSpaceshipUpdate < 33) {
      return; // Skip update if less than 33ms since last update (~30fps max)
    }

    const currentSystem = state.solarSystems.find(
      (s) => s.id === state.currentSystemId
    );
    if (!currentSystem) return;

    // Process spaceships efficiently
    const updatedSpaceships: SpaceshipData[] = [];

    for (const spaceship of state.spaceships) {
      // Get current positions (cached to avoid repeated calculations)
      const originPos = getObjectWorldPosition(
        spaceship.origin.id,
        spaceship.origin.type,
        currentSystem,
        state.gameTime
      );
      const destinationPos = getObjectWorldPosition(
        spaceship.destination.id,
        spaceship.destination.type,
        currentSystem,
        state.gameTime
      );

      if (!originPos || !destinationPos) {
        updatedSpaceships.push(spaceship);
        continue;
      }

      // Calculate delta time for orbital mechanics
      const delta = state.lastSpaceshipUpdate
        ? (now - state.lastSpaceshipUpdate) / 1000
        : 1 / 60;

      // Calculate new position
      const newPosition = getNextSpaceshipPosition(
        spaceship,
        originPos,
        destinationPos,
        undefined, // Use default config
        delta
      );

      // Debug logging for selected spaceships
      if (
        spaceship.id === state.selectedObject?.id &&
        state.selectedObject?.type === "spaceship"
      ) {
        console.log(`Spaceship ${spaceship.id} debug:`, {
          state: spaceship.state,
          stateElapsed: (now - spaceship.stateStartTime) / 1000,
          position: newPosition.toArray(),
          originPos: originPos.toArray(),
          destinationPos: destinationPos.toArray(),
          distance: originPos.distanceTo(destinationPos),
          distanceToDestination: newPosition.distanceTo(destinationPos),
        });
      }

      // Update trail efficiently
      const newTrail = [...spaceship.trailPositions, newPosition.clone()];
      if (newTrail.length > spaceship.maxTrailLength) {
        newTrail.shift(); // Remove oldest position
      }

      // Check for state transitions
      const stateElapsed = (now - spaceship.stateStartTime) / 1000;
      let newState = spaceship.state;
      let newStateStartTime = spaceship.stateStartTime;

      switch (spaceship.state) {
        case "orbiting_origin":
          // After orbiting origin for a few seconds, start traveling
          if (stateElapsed >= 3.0) {
            newState = "traveling";
            newStateStartTime = now;
            console.log(
              `Spaceship ${
                spaceship.id
              } transitioning from orbiting_origin to traveling after ${stateElapsed.toFixed(
                2
              )}s`
            );
          }
          break;
        case "traveling": {
          // Use the fixed destination for travel time calculation (where we're traveling TO)
          const fixedDestination =
            (spaceship as any).fixedDestination || destinationPos;
          const launchOrigin = spaceship.trailPositions[0] || originPos;
          const distance = launchOrigin.distanceTo(fixedDestination);
          const travelTime = distance / 4.0;
          if (stateElapsed >= travelTime) {
            newState = "orbiting_destination";
            newStateStartTime = now;
            console.log(
              `Spaceship ${
                spaceship.id
              } transitioning from traveling to orbiting_destination after ${stateElapsed.toFixed(
                2
              )}s (travelTime: ${travelTime.toFixed(
                2
              )}s, distance: ${distance.toFixed(2)})`
            );
          }
          break;
        }
        case "orbiting_destination":
          // Ship continues orbiting destination indefinitely - no state change needed
          break;
      }

      // Create updated spaceship
      updatedSpaceships.push({
        ...spaceship,
        position: newPosition,
        state: newState,
        stateStartTime: newStateStartTime,
        trailPositions: newTrail,
      });
    }

    // Update state efficiently
    set((state) => ({
      ...state,
      spaceships: updatedSpaceships,
      lastSpaceshipUpdate: now,
    }));
  },
}));
