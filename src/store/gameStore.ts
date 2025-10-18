import { create } from "zustand";
import {
  Country,
  Player,
  SolarSystem,
  Tunnel,
  ViewType,
} from "../types/game.types";

interface GameStore {
  // View state
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Game state
  players: Player[];
  countries: Map<string, Country>;
  solarSystems: SolarSystem[];
  tunnels: Tunnel[];
  currentTurn: number;
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  timeScale: number; // 0..1 smooth playback factor

  // Layer visibility state
  layers: {
    continents: boolean;
    cities: boolean;
    atmosphere: boolean;
    clouds: boolean;
  };

  // UI state
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country | null) => void;

  // Actions
  addPlayer: (player: Player) => void;
  updateCountry: (countryId: string, updates: Partial<Country>) => void;
  addSolarSystem: (system: SolarSystem) => void;
  addTunnel: (tunnel: Tunnel) => void;
  nextTurn: () => void;
  togglePlayPause: () => void;
  updateGameTime: (time: number) => void;
  setTimeScale: (scale: number) => void;
  toggleLayer: (layer: keyof GameStore["layers"]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  activeView: "earth",
  players: [],
  countries: new Map(),
  solarSystems: [],
  tunnels: [],
  currentTurn: 1,
  isPlaying: false,
  gameTime: 0,
  timeScale: 0,
  layers: {
    continents: true,
    cities: true,
    atmosphere: true,
    clouds: true,
  },
  selectedCountry: null,

  // Actions
  setActiveView: (view) => set({ activeView: view }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  updateCountry: (countryId, updates) =>
    set((state) => {
      const newCountries = new Map(state.countries);
      const existing = newCountries.get(countryId);
      if (existing) {
        newCountries.set(countryId, { ...existing, ...updates });
      }
      return { countries: newCountries };
    }),

  addSolarSystem: (system) =>
    set((state) => ({
      solarSystems: [...state.solarSystems, system],
    })),

  addTunnel: (tunnel) =>
    set((state) => ({
      tunnels: [...state.tunnels, tunnel],
    })),

  nextTurn: () =>
    set((state) => ({
      currentTurn: state.currentTurn + 1,
    })),

  togglePlayPause: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),

  updateGameTime: (time) => set({ gameTime: time }),

  setTimeScale: (scale) => set({ timeScale: Math.max(0, Math.min(1, scale)) }),

  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
    })),
}));
