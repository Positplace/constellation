import { Socket } from "socket.io";
import {
  GameState,
  Player,
  SolarSystem,
  Tunnel,
  StarType,
} from "../types/game.types";
import {
  generateSolarSystem,
  calculateConnectedSystemPosition,
} from "../utils/systemFactory";
import { saveGameGalaxy, loadGameGalaxy } from "./GamePersistence";

export class GameGalaxy {
  public id: string;
  public players: Map<string, Player>;
  public gameState: GameState;
  public maxPlayers: number = 8;

  constructor(galaxyId: string) {
    this.id = galaxyId;
    this.players = new Map();

    // Try to load existing game state, or initialize new one
    const loadedState = loadGameGalaxy(galaxyId);
    if (
      loadedState &&
      loadedState.solarSystems &&
      Array.isArray(loadedState.solarSystems)
    ) {
      this.gameState = loadedState;
      console.log(`🌌 Loaded existing game state for galaxy '${galaxyId}'`);
    } else {
      if (loadedState) {
        console.log(
          `⚠️ Loaded state was corrupted, reinitializing galaxy '${galaxyId}'`
        );
      }
      this.gameState = this.initializeGameState();
      this.persist();
      console.log(`🌌 Created new game state for galaxy '${galaxyId}'`);
    }
  }

  private initializeGameState(): GameState {
    // Start with an empty galaxy - players will create their own home systems
    return {
      players: [],
      solarSystems: [],
      tunnels: [],
      currentTurn: 1,
      isPlaying: false,
      gameTime: 0,
      activeView: "solar",
      currentSystemId: "", // Will be set when first player joins
    };
  }

  addPlayer(socket: Socket, playerName: string, playerUUID: string): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }

    // Check if this player UUID already exists (returning player)
    const existingPlayer = Array.from(this.players.values()).find(
      (p) => p.uuid === playerUUID
    );

    let player: Player;

    if (existingPlayer) {
      // Returning player - update their socket ID and name
      console.log(`🔄 Returning player: ${playerName} (${playerUUID})`);
      console.log(`🏠 Home system: ${existingPlayer.homeSystemId}`);
      player = {
        ...existingPlayer,
        id: socket.id,
        name: playerName, // Update name in case it changed
      };
    } else {
      // New player - generate home system
      console.log(`🆕 New player: ${playerName} (${playerUUID})`);

      player = {
        id: socket.id,
        uuid: playerUUID,
        name: playerName,
        color: this.generatePlayerColor(),
        researchPoints: 100,
        tunnelCapacity: 1,
      };

      // Generate home system for new player
      const homeSystem = this.generateHomeSystemForPlayer(player);
      player.homeSystemId = homeSystem.id;

      // Find habitable planet in home system
      const habitablePlanet = homeSystem.planets.find(
        (p) => p.type === "earth_like" || p.type === "ocean_world"
      );
      if (habitablePlanet) {
        player.homePlanetId = habitablePlanet.id;
        // Mark planet as having life
        habitablePlanet.hasLife = true;
        console.log(
          `🏠 Home planet: ${habitablePlanet.name} in ${homeSystem.name}`
        );
      }
    }

    this.players.set(socket.id, player);
    this.gameState.players = Array.from(this.players.values());
    this.persist();

    return true;
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
    this.gameState.players = Array.from(this.players.values());
  }

  addSolarSystem(system: SolarSystem): void {
    this.gameState.solarSystems.push(system);
    this.persist();
  }

  addTunnel(tunnel: Tunnel): void {
    this.gameState.tunnels.push(tunnel);
    this.persist();
  }

  nextTurn(): void {
    this.gameState.currentTurn++;
    this.persist();
  }

  togglePlayPause(): void {
    this.gameState.isPlaying = !this.gameState.isPlaying;
  }

  updateGameTime(time: number): void {
    this.gameState.gameTime = time;
  }

  /**
   * Generate a home system for a new player with a guaranteed habitable planet
   */
  generateHomeSystemForPlayer(player: Player): SolarSystem {
    // Ensure solarSystems array exists
    if (!this.gameState.solarSystems) {
      this.gameState.solarSystems = [];
    }

    const seed =
      Date.now() + this.gameState.solarSystems.length + Math.random() * 1000;

    // Calculate position for new home system (spread them out in galaxy)
    const angle = this.gameState.solarSystems.length * 137.5 * (Math.PI / 180); // Golden angle
    const distance = 50 + this.gameState.solarSystems.length * 30; // Spiral outward
    const position: [number, number, number] = [
      Math.cos(angle) * distance,
      (Math.random() - 0.5) * 20, // Some vertical variation
      Math.sin(angle) * distance,
    ];

    // Generate a yellow star system (good for life)
    const homeSystem = generateSolarSystem(
      "yellow_star",
      seed,
      position,
      player.name + "'s Home"
    );

    // Ensure at least one habitable planet exists
    let hasHabitablePlanet = homeSystem.planets.some(
      (p) => p.type === "earth_like" || p.type === "ocean_world"
    );

    // If no habitable planet, convert the first planet to earth_like
    if (!hasHabitablePlanet && homeSystem.planets.length > 0) {
      const planetToConvert = homeSystem.planets[0];
      planetToConvert.type = "earth_like";
      planetToConvert.name = "Earth"; // or generate a name
      console.log(`🌍 Converted ${planetToConvert.name} to earth_like planet`);
    }

    this.gameState.solarSystems.push(homeSystem);
    console.log(
      `🏠 Generated home system: ${homeSystem.name} at [${position
        .map((p) => p.toFixed(1))
        .join(", ")}]`
    );

    return homeSystem;
  }

  /**
   * Get systems available for connection (have space for more connections)
   */
  getDiscoverableSystems(excludeSystemId?: string): SolarSystem[] {
    return this.gameState.solarSystems.filter((system) => {
      // Never allow a system to connect to itself
      if (excludeSystemId && system.id === excludeSystemId) return false;

      const maxConnections = system.maxConnections || 3;
      // Only return systems that still have unexplored gates
      return system.connections.length < maxConnections;
    });
  }

  /**
   * Generate a new solar system connected to an existing one
   * Randomly chooses between generating a new system or connecting to existing
   */
  generateSystem(fromSystemId?: string, starType?: StarType): SolarSystem {
    const seed = Date.now() + this.gameState.solarSystems.length;
    let position: [number, number, number] = [0, 0, 0];
    let targetSystem: SolarSystem;

    if (fromSystemId) {
      const fromSystem = this.gameState.solarSystems.find(
        (s) => s.id === fromSystemId
      );
      if (!fromSystem) {
        throw new Error("Source system not found");
      }

      // Check connection limit
      if (fromSystem.connections.length >= (fromSystem.maxConnections || 3)) {
        throw new Error("Source system has reached maximum connections");
      }

      // Get systems available for connection (excluding the source system and already connected ones)
      // Only consider systems that:
      // 1. Are NOT the source system (no self-loops)
      // 2. Still have unexplored gates (connections.length < maxConnections)
      // 3. Are NOT already connected to the source system
      const discoverableSystems = this.getDiscoverableSystems(
        fromSystemId
      ).filter((system) => {
        // Double-check: never allow connecting to self
        if (system.id === fromSystemId) return false;
        // Exclude already connected systems
        return !fromSystem.connections.includes(system.id);
      });

      // 40% chance to connect to existing system if available
      const shouldConnectToExisting =
        discoverableSystems.length > 0 && Math.random() < 0.4;

      if (shouldConnectToExisting) {
        // Connect to random existing system that still has unexplored gates
        const randomIndex = Math.floor(
          Math.random() * discoverableSystems.length
        );
        targetSystem = discoverableSystems[randomIndex];

        console.log(
          `🔗 Connecting to existing system: ${targetSystem.name} (has ${targetSystem.connections.length}/${targetSystem.maxConnections} connections)`
        );
      } else {
        // Generate new system
        position = calculateConnectedSystemPosition(fromSystem.position, seed);
        targetSystem = generateSolarSystem(starType, seed, position);
        this.gameState.solarSystems.push(targetSystem);

        console.log(`✨ Generated new system: ${targetSystem.name}`);
      }

      // Final safety check: never create self-loops
      if (targetSystem.id === fromSystemId) {
        throw new Error("Cannot create a gate connecting a star to itself");
      }

      // Create tunnel connection
      const tunnel: Tunnel = {
        id: `tunnel-${seed}`,
        from: fromSystemId,
        to: targetSystem.id,
        capacity: 100,
        status: "active",
      };

      // Update connections
      fromSystem.connections.push(targetSystem.id);

      // Add connection to target system if it's not already there
      if (!targetSystem.connections.includes(fromSystemId)) {
        targetSystem.connections.push(fromSystemId);
      }

      this.gameState.tunnels.push(tunnel);

      console.log(
        `🔗 Created tunnel: ${fromSystem.name} ↔️ ${targetSystem.name}`
      );
    } else {
      // Generate standalone system (shouldn't happen in normal gameplay)
      targetSystem = generateSolarSystem(starType, seed, position);
      this.gameState.solarSystems.push(targetSystem);
    }

    this.persist();

    return targetSystem;
  }

  /**
   * Persist the game state to disk
   */
  persist(): void {
    saveGameGalaxy(this.id, this.gameState);
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
