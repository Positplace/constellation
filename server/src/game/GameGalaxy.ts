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
import { PlanetType } from "../types/planet.types";

/**
 * Helper function for weighted random selection
 * Uses a better hash function for seed-based randomness
 */
function weightedRandomSelect(
  weights: Record<string, number>,
  seed: number
): string {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [_, w]) => sum + w, 0);

  // Better hash function for seed-based randomness (MurmurHash3-inspired)
  let hash = seed;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  // Convert to 0-1 range
  const random = Math.abs(hash) / 0xffffffff;
  const target = random * totalWeight;

  let cumulative = 0;
  for (const [key, weight] of entries) {
    cumulative += weight;
    if (target < cumulative) {
      return key;
    }
  }

  return entries[0][0]; // Fallback to first option
}

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

      // Find habitable planet in home system - recognize all habitable types
      const habitablePlanetTypes: PlanetType[] = [
        "earth_like",
        "ocean_world",
        "terrestrial",
        "desert_world",
        "jungle_world",
        "ice_world",
      ];

      const habitablePlanet = homeSystem.planets.find((p) =>
        habitablePlanetTypes.includes(p.type)
      );
      if (habitablePlanet) {
        player.homePlanetId = habitablePlanet.id;
        // Mark planet as having life
        habitablePlanet.hasLife = true;
        console.log(
          `🏠 Home planet: ${habitablePlanet.name} (${habitablePlanet.type}) in ${homeSystem.name}`
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

    // Randomly select a suitable star type for life-bearing systems
    // Yellow stars are most common, but red dwarfs and white dwarfs can support life too
    const starTypeWeights = {
      yellow_star: 50, // Most Earth-like conditions
      red_dwarf: 35, // Smaller, cooler, but can have habitable zones
      white_dwarf: 15, // Rare but interesting
    };
    const selectedStarType = weightedRandomSelect(
      starTypeWeights,
      seed
    ) as StarType;

    // Generate the home system with selected star type
    const homeSystem = generateSolarSystem(
      selectedStarType,
      seed,
      position,
      player.name + "'s Home"
    );

    // Define interesting habitable planet types for home worlds
    const habitablePlanetTypes: PlanetType[] = [
      "earth_like",
      "ocean_world",
      "terrestrial",
      "desert_world",
      "jungle_world",
      "ice_world",
    ];

    // Ensure at least one habitable planet exists
    let hasHabitablePlanet = homeSystem.planets.some((p) =>
      habitablePlanetTypes.includes(p.type)
    );

    // If no habitable planet, convert the first suitable planet to a random habitable type
    if (!hasHabitablePlanet && homeSystem.planets.length > 0) {
      const planetToConvert = homeSystem.planets[0];

      // Randomly select a habitable planet type with varied weights
      const planetTypeWeights = {
        earth_like: 18, // Balanced Earth-like world
        ocean_world: 22, // Water-dominated world
        terrestrial: 18, // Rocky world with varied terrain
        desert_world: 18, // Arid but habitable world
        jungle_world: 14, // Dense vegetation world
        ice_world: 10, // Cold, harsh but survivable world
      };

      const selectedPlanetType = weightedRandomSelect(
        planetTypeWeights,
        seed + 1000
      ) as PlanetType;
      planetToConvert.type = selectedPlanetType;

      console.log(
        `🌍 Converted ${planetToConvert.name} to ${selectedPlanetType} home world`
      );
    }

    this.gameState.solarSystems.push(homeSystem);
    console.log(
      `🏠 Generated home system: ${
        homeSystem.name
      } (${selectedStarType}) at [${position
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
