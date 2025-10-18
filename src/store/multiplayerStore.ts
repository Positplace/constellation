import { create } from "zustand";
import { Player } from "../types/game.types";

interface MultiplayerStore {
  isConnected: boolean;
  currentRoom: string | null;
  playerName: string;
  players: Player[];
  showConnectionDialog: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setPlayerName: (name: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setShowConnectionDialog: (show: boolean) => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  isConnected: false,
  currentRoom: null,
  playerName: "",
  players: [],
  showConnectionDialog: false,

  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
  setPlayerName: (name) => set({ playerName: name }),
  setShowConnectionDialog: (show) => set({ showConnectionDialog: show }),

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
