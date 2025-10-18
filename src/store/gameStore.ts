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

  // UI state
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country | null) => void;

  // Actions
  addPlayer: (player: Player) => void;
  updateCountry: (countryId: string, updates: Partial<Country>) => void;
  addSolarSystem: (system: SolarSystem) => void;
  addTunnel: (tunnel: Tunnel) => void;
  nextTurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  activeView: "earth",
  players: [],
  countries: new Map(),
  solarSystems: [],
  tunnels: [],
  currentTurn: 1,
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
}));
