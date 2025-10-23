import * as fs from "fs";
import * as path from "path";
import { GameState } from "../types/game.types";

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
 * Save a galaxy's game state to a JSON file
 */
export function saveGameGalaxy(galaxyId: string, gameState: GameState): void {
  try {
    ensureSaveDir();
    const filePath = path.join(SAVE_DIR, `${galaxyId}.json`);
    const data = JSON.stringify(gameState, null, 2);
    fs.writeFileSync(filePath, data, "utf8");
    console.log(`✅ Galaxy '${galaxyId}' saved successfully`);
  } catch (error) {
    console.error(`❌ Failed to save galaxy '${galaxyId}':`, error);
  }
}

/**
 * Load a galaxy's game state from a JSON file
 */
export function loadGameGalaxy(galaxyId: string): GameState | null {
  try {
    const filePath = path.join(SAVE_DIR, `${galaxyId}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  No saved game found for galaxy '${galaxyId}'`);
      return null;
    }

    const data = fs.readFileSync(filePath, "utf8");
    const gameState = JSON.parse(data) as GameState;
    console.log(`✅ Galaxy '${galaxyId}' loaded successfully`);
    return gameState;
  } catch (error) {
    console.error(`❌ Failed to load galaxy '${galaxyId}':`, error);
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
    const filePath = path.join(SAVE_DIR, `${galaxyId}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  No saved game found for galaxy '${galaxyId}'`);
      return false;
    }

    fs.unlinkSync(filePath);
    console.log(`✅ Galaxy '${galaxyId}' deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete galaxy '${galaxyId}':`, error);
    return false;
  }
}
