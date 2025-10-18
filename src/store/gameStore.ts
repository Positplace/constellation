import { create } from "zustand";
import { Player, SolarSystem, Tunnel, ViewType } from "../types/game.types";

interface GameStore {
  // View state
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Game state
  players: Player[];
  solarSystems: SolarSystem[];
  tunnels: Tunnel[];
  currentTurn: number;
  isPlaying: boolean;
  gameTime: number; // Real-time game time in seconds
  timeScale: number; // 0..1 smooth playback factor

  // Actions
  addPlayer: (player: Player) => void;
  addSolarSystem: (system: SolarSystem) => void;
  addTunnel: (tunnel: Tunnel) => void;
  nextTurn: () => void;
  togglePlayPause: () => void;
  updateGameTime: (time: number) => void;
  setTimeScale: (scale: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  activeView: "solar",
  players: [],
  solarSystems: [],
  tunnels: [],
  currentTurn: 1,
  isPlaying: false,
  gameTime: 0,
  timeScale: 0,

  // Actions
  setActiveView: (view) => set({ activeView: view }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

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
}));
