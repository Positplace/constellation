/**
 * Player identity management using localStorage for persistence
 */

const PLAYER_UUID_KEY = "constellation_player_uuid";
const PLAYER_NAME_KEY = "constellation_player_name";

/**
 * Generate a unique player UUID
 */
function generatePlayerUUID(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create a persistent player UUID
 */
export function getPlayerUUID(): string {
  if (typeof window === "undefined") {
    return generatePlayerUUID();
  }

  let uuid = localStorage.getItem(PLAYER_UUID_KEY);

  if (!uuid) {
    uuid = generatePlayerUUID();
    localStorage.setItem(PLAYER_UUID_KEY, uuid);
    console.log(`🆔 Generated new player UUID: ${uuid}`);
  }
  // Don't log on every load - only log when creating new UUID

  return uuid;
}

/**
 * Get stored player name
 */
export function getStoredPlayerName(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(PLAYER_NAME_KEY);
}

/**
 * Store player name
 */
export function storePlayerName(name: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

/**
 * Clear player identity (for debugging/testing)
 */
export function clearPlayerIdentity(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(PLAYER_UUID_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
  console.log("🗑️ Cleared player identity");
}
