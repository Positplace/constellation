import * as fs from "fs";
import * as path from "path";
import { GameState, SolarSystem } from "../types/game.types";

const SAVE_DIR = path.join(__dirname, "../../data/saved-galaxies");

/**
 * Ensure the save directory exists
 */
function ensureSaveDir(): void {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }
}

/**
 * Ensure the galaxy directory exists
 */
function ensureGalaxyDir(galaxyId: string): void {
  const galaxyDir = path.join(SAVE_DIR, galaxyId);
  if (!fs.existsSync(galaxyDir)) {
    fs.mkdirSync(galaxyDir, { recursive: true });
  }

  const systemsDir = path.join(galaxyDir, "systems");
  if (!fs.existsSync(systemsDir)) {
    fs.mkdirSync(systemsDir, { recursive: true });
  }
}

/**
 * Save a galaxy's game state using the new split-file format
 * Saves metadata (players, tunnels) separately from solar systems
 */
export function saveGameGalaxy(galaxyId: string, gameState: GameState): void {
  try {
    ensureGalaxyDir(galaxyId);

    // Save metadata (everything except solar systems)
    const metadata = {
      players: gameState.players,
      tunnels: gameState.tunnels,
      isPlaying: gameState.isPlaying,
      gameTime: gameState.gameTime,
      activeView: gameState.activeView,
      currentSystemId: gameState.currentSystemId,
      systemCount: gameState.solarSystems.length,
    };

    const metadataPath = path.join(SAVE_DIR, galaxyId, "galaxy.json");
    const metadataData = JSON.stringify(metadata, null, 2);

    // Save metadata
    fs.writeFile(metadataPath, metadataData, "utf8", (error) => {
      if (error) {
        console.error(
          `❌ Failed to save galaxy metadata '${galaxyId}':`,
          error
        );
      } else {
        console.log(
          `✅ Galaxy '${galaxyId}' metadata saved (${metadata.systemCount} systems)`
        );
      }
    });

    // Save each solar system to its own file (async, in parallel)
    const systemsDir = path.join(SAVE_DIR, galaxyId, "systems");
    gameState.solarSystems.forEach((system) => {
      const systemPath = path.join(systemsDir, `${system.id}.json`);
      const systemData = JSON.stringify(system, null, 2);

      fs.writeFile(systemPath, systemData, "utf8", (error) => {
        if (error) {
          console.error(`❌ Failed to save system '${system.id}':`, error);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Failed to save galaxy '${galaxyId}':`, error);
  }
}

/**
 * Save a single solar system (for incremental updates)
 */
export function saveSolarSystem(galaxyId: string, system: SolarSystem): void {
  try {
    ensureGalaxyDir(galaxyId);
    const systemPath = path.join(
      SAVE_DIR,
      galaxyId,
      "systems",
      `${system.id}.json`
    );
    const systemData = JSON.stringify(system, null, 2);

    fs.writeFile(systemPath, systemData, "utf8", (error) => {
      if (error) {
        console.error(`❌ Failed to save system '${system.id}':`, error);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to save system '${system.id}':`, error);
  }
}

/**
 * Load a galaxy's game state from the split-file format
 */
export function loadGameGalaxy(galaxyId: string): GameState | null {
  try {
    const galaxyDir = path.join(SAVE_DIR, galaxyId);
    const metadataPath = path.join(galaxyDir, "galaxy.json");

    if (!fs.existsSync(metadataPath)) {
      console.log(`⚠️  No saved game found for galaxy '${galaxyId}'`);
      return null;
    }

    // Load metadata
    const metadataData = fs.readFileSync(metadataPath, "utf8");
    const metadata = JSON.parse(metadataData);

    // Load all solar systems from the systems directory
    const systemsDir = path.join(galaxyDir, "systems");
    const solarSystems: SolarSystem[] = [];

    if (fs.existsSync(systemsDir)) {
      const systemFiles = fs.readdirSync(systemsDir);
      for (const file of systemFiles) {
        if (file.endsWith(".json")) {
          const systemPath = path.join(systemsDir, file);
          const systemData = fs.readFileSync(systemPath, "utf8");
          const system = JSON.parse(systemData) as SolarSystem;
          solarSystems.push(system);
        }
      }
    }

    const gameState: GameState = {
      players: metadata.players || [],
      solarSystems,
      tunnels: metadata.tunnels || [],
      isPlaying: metadata.isPlaying || false,
      gameTime: metadata.gameTime || 0,
      activeView: metadata.activeView || "solar",
      currentSystemId: metadata.currentSystemId || "",
    };

    console.log(
      `✅ Galaxy '${galaxyId}' loaded: ${solarSystems.length} systems`
    );
    return gameState;
  } catch (error) {
    console.error(`❌ Failed to load galaxy '${galaxyId}':`, error);
    return null;
  }
}

/**
 * Load a single solar system from disk
 */
export function loadSolarSystem(
  galaxyId: string,
  systemId: string
): SolarSystem | null {
  try {
    const systemPath = path.join(
      SAVE_DIR,
      galaxyId,
      "systems",
      `${systemId}.json`
    );

    if (!fs.existsSync(systemPath)) {
      return null;
    }

    const data = fs.readFileSync(systemPath, "utf8");
    const system = JSON.parse(data) as SolarSystem;
    return system;
  } catch (error) {
    console.error(`❌ Failed to load system '${systemId}':`, error);
    return null;
  }
}

/**
 * List all saved galaxies
 */
export function listSavedGalaxies(): string[] {
  try {
    ensureSaveDir();
    const files = fs.readdirSync(SAVE_DIR);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  } catch (error) {
    console.error("❌ Failed to list saved galaxies:", error);
    return [];
  }
}

/**
 * Delete a saved galaxy
 */
export function deleteGameGalaxy(galaxyId: string): boolean {
  try {
    const galaxyDir = path.join(SAVE_DIR, galaxyId);

    if (!fs.existsSync(galaxyDir)) {
      console.log(`⚠️  No saved game found for galaxy '${galaxyId}'`);
      return false;
    }

    fs.rmSync(galaxyDir, { recursive: true });
    console.log(`✅ Galaxy '${galaxyId}' deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete galaxy '${galaxyId}':`, error);
    return false;
  }
}
