import { create } from "zustand";
import { Player } from "../types/game.types";

interface MultiplayerStore {
  isConnected: boolean;
  currentGalaxy: string | null;
  playerName: string;
  players: Player[];
  showConnectionDialog: boolean;
  playerHomeSystemId: string | null; // Current player's home system
  playerHomePlanetId: string | null; // Current player's home planet

  // Actions
  setConnected: (connected: boolean) => void;
  setCurrentGalaxy: (galaxyId: string | null) => void;
  setPlayerName: (name: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setShowConnectionDialog: (show: boolean) => void;
  setPlayerHomeSystemId: (systemId: string | null) => void;
  setPlayerHomePlanetId: (planetId: string | null) => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  isConnected: false,
  currentGalaxy: null,
  playerName: "",
  players: [],
  showConnectionDialog: false,
  playerHomeSystemId: null,
  playerHomePlanetId: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentGalaxy: (galaxyId) => set({ currentGalaxy: galaxyId }),
  setPlayerName: (name) => set({ playerName: name }),
  setShowConnectionDialog: (show) => set({ showConnectionDialog: show }),
  setPlayerHomeSystemId: (systemId) => set({ playerHomeSystemId: systemId }),
  setPlayerHomePlanetId: (planetId) => set({ playerHomePlanetId: planetId }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    })),
}));
