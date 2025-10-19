import { create } from "zustand";
import {
  Player,
  SolarSystem,
  Tunnel,
  ViewType,
  StarType,
} from "../types/game.types";
import {
  generateSolarSystem,
  calculateConnectedSystemPosition,
} from "../utils/systemFactory";

const STORAGE_KEY = "constellation-game-state";

interface GameStore {
  // View state
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Game state
  players: Player[];
  solarSystems: SolarSystem[];
  tunnels: Tunnel[];
  currentSystemId: string | null;
  currentTurn: number;
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  timeScale: number; // 0..1 smooth playback factor
  selectedPlanetId: string | null; // Currently selected planet in solar view
  selectedAsteroidId: string | null; // Currently selected asteroid in solar view
  selectedMoonId: string | null; // Currently selected moon in solar view
  showPlanetDetails: boolean; // Whether to show planet details card

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
  setSelectedPlanet: (planetId: string | null) => void;
  setSelectedAsteroid: (asteroidId: string | null) => void;
  setSelectedMoon: (moonId: string | null) => void;
  updateSystemPosition: (
    systemId: string,
    position: [number, number, number]
  ) => void;
  initializeGame: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  activeView: "solar",
  players: [],
  solarSystems: [],
  tunnels: [],
  currentSystemId: null,
  currentTurn: 1,
  isPlaying: false,
  gameTime: 0,
  timeScale: 0,
  selectedPlanetId: null,
  selectedAsteroidId: null,
  selectedMoonId: null,

  // Actions
  setActiveView: (view) => {
    set({ activeView: view });
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
    set({ currentSystemId: id, selectedPlanetId: null });
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

  setSelectedPlanet: (planetId) => {
    // Validate that the planet exists in the current system
    if (planetId) {
      const state = get();
      const currentSystem = state.solarSystems.find(
        (s) => s.id === state.currentSystemId
      );
      if (
        currentSystem &&
        !currentSystem.planets.find((p) => p.id === planetId)
      ) {
        console.warn(
          `Planet ${planetId} not found in current system ${state.currentSystemId}`
        );
        set({ selectedPlanetId: null });
        return;
      }
    }
    set({
      selectedPlanetId: planetId,
      selectedAsteroidId: null,
      selectedMoonId: null,
    });
  },

  setSelectedAsteroid: (asteroidId) => {
    // Validate that the asteroid exists in the current system
    if (asteroidId) {
      const state = get();
      const currentSystem = state.solarSystems.find(
        (s) => s.id === state.currentSystemId
      );
      if (
        currentSystem &&
        !currentSystem.asteroidBelts?.some((belt) =>
          belt.asteroids.find((a) => a.id === asteroidId)
        )
      ) {
        console.warn(
          `Asteroid ${asteroidId} not found in current system ${state.currentSystemId}`
        );
        set({ selectedAsteroidId: null });
        return;
      }
    }
    set({
      selectedAsteroidId: asteroidId,
      selectedPlanetId: null,
      selectedMoonId: null,
    });
  },

  setSelectedMoon: (moonId) => {
    // Validate that the moon exists in the current system
    if (moonId) {
      const state = get();
      const currentSystem = state.solarSystems.find(
        (s) => s.id === state.currentSystemId
      );
      if (
        currentSystem &&
        !currentSystem.planets?.some((planet) =>
          planet.moons?.find((m) => m.id === moonId)
        )
      ) {
        console.warn(
          `Moon ${moonId} not found in current system ${state.currentSystemId}`
        );
        set({ selectedMoonId: null });
        return;
      }
    }
    set({
      selectedMoonId: moonId,
      selectedPlanetId: null,
      selectedAsteroidId: null,
    });
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
        selectedPlanetId: state.selectedPlanetId,
        selectedAsteroidId: state.selectedAsteroidId,
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
        set({
          solarSystems: data.solarSystems || [],
          tunnels: data.tunnels || [],
          currentSystemId: data.currentSystemId || null,
          currentTurn: data.currentTurn || 1,
          selectedPlanetId: data.selectedPlanetId || null,
          selectedAsteroidId: data.selectedAsteroidId || null,
        });
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  },
}));
