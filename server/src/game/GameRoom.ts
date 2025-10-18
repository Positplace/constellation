import { Socket } from "socket.io";
import { GameState, Player, SolarSystem, Tunnel } from "../types/game.types";

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
    // Create a simple initial solar system
    const homeSystem: SolarSystem = {
      id: "sol-system",
      name: "Sol",
      position: [0, 0, 0] as [number, number, number],
      star: {
        name: "Sol",
        type: "yellow_star",
        color: "#FDB813",
        mass: 1.0,
        radius: 1.0,
      },
      planets: [],
      connections: [],
      colonized: true,
      discovered: true,
      seed: 1000,
    };

    return {
      players: [],
      solarSystems: [homeSystem],
      tunnels: [],
      currentTurn: 1,
      isPlaying: false,
      gameTime: 0,
      activeView: "solar",
      currentSystemId: homeSystem.id,
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

  addSolarSystem(system: SolarSystem): void {
    this.gameState.solarSystems.push(system);
  }

  addTunnel(tunnel: Tunnel): void {
    this.gameState.tunnels.push(tunnel);
  }

  nextTurn(): void {
    this.gameState.currentTurn++;
  }

  togglePlayPause(): void {
    this.gameState.isPlaying = !this.gameState.isPlaying;
  }

  updateGameTime(time: number): void {
    this.gameState.gameTime = time;
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
