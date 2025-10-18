import { Socket } from "socket.io";
import {
  GameState,
  Player,
  Country,
  SolarSystem,
  Tunnel,
} from "../types/game.types";

export class GameRoom {
  public id: string;
  public players: Map<string, Player>;
  public gameState: GameState;
  public maxPlayers: number = 8;

  constructor(roomId: string) {
    this.id = roomId;
    this.players = new Map();
    this.gameState = this.initializeGameState();
  }

  private initializeGameState(): GameState {
    return {
      players: [],
      countries: new Map(),
      solarSystems: [],
      tunnels: [],
      currentTurn: 1,
      activeView: "earth",
    };
  }

  addPlayer(socket: Socket, playerName: string): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      color: this.generatePlayerColor(),
      countries: [],
      researchPoints: 100,
      tunnelCapacity: 1,
    };

    this.players.set(socket.id, player);
    this.gameState.players = Array.from(this.players.values());

    return true;
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
    this.gameState.players = Array.from(this.players.values());
  }

  updateCountry(countryId: string, updates: Partial<Country>): void {
    const existing = this.gameState.countries.get(countryId);
    if (existing) {
      this.gameState.countries.set(countryId, { ...existing, ...updates });
    }
  }

  addSolarSystem(system: SolarSystem): void {
    this.gameState.solarSystems.push(system);
  }

  addTunnel(tunnel: Tunnel): void {
    this.gameState.tunnels.push(tunnel);
  }

  nextTurn(): void {
    this.gameState.currentTurn++;
  }

  private generatePlayerColor(): string {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    const usedColors = Array.from(this.players.values()).map((p) => p.color);
    const availableColors = colors.filter((c) => !usedColors.includes(c));
    return (
      availableColors[0] || colors[Math.floor(Math.random() * colors.length)]
    );
  }

  getGameState(): GameState {
    return this.gameState;
  }
}
