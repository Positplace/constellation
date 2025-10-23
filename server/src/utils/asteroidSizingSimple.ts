/**
 * SIMPLIFIED ASTEROID SIZING - For debugging the sizing issue
 * This replaces the complex sizing system with a simple, traceable one
 */

// EXTREMELY small sizes - let's start with these values
export const SIMPLE_ASTEROID_SIZES = {
  // These are the actual asteroid sizes in Earth radii
  MIN_SIZE: 0.0000005, // ~3.2 km (smaller minimum)
  MAX_SIZE: 0.00003, // ~190 km (larger maximum for more variety)

  // This is the render scale - how we convert real size to 3D units
  RENDER_SCALE: 0.000000001, // 1 BILLION times smaller than planets

  // Maximum final render size in 3D units
  MAX_FINAL_SIZE: 0.00000001, // 0.00000001 units maximum
};

/**
 * Simple asteroid size calculation - no complex logic
 */
export function getSimpleAsteroidSize(
  asteroidSizeInEarthRadii: number
): number {
  // Convert to km
  const radiusInKm = asteroidSizeInEarthRadii * 6371;

  // Apply simple render scale
  const finalSize = radiusInKm * SIMPLE_ASTEROID_SIZES.RENDER_SCALE;

  // Clamp to maximum
  const clampedSize = Math.min(finalSize, SIMPLE_ASTEROID_SIZES.MAX_FINAL_SIZE);

  return clampedSize;
}

/**
 * Compute a visibility scale so extremely small asteroids are still visible in world units.
 * This does not change data size, only visual scale.
 */
export function getVisibilityScale(
  baseRadiusWorldUnits: number,
  minWorldSize: number = 0.02
): number {
  if (baseRadiusWorldUnits <= 0) return 1;
  if (baseRadiusWorldUnits >= minWorldSize) return 1;
  return minWorldSize / baseRadiusWorldUnits;
}

/**
 * Debug asteroid size calculation - only called when clicking on asteroids
 */
export function debugAsteroidSize(asteroidSizeInEarthRadii: number): void {
  console.log("=== ASTEROID SIZE DEBUG (ON CLICK) ===");
  console.log("Input size (Earth radii):", asteroidSizeInEarthRadii);

  // Convert to km
  const radiusInKm = asteroidSizeInEarthRadii * 6371;
  console.log("Radius in km:", radiusInKm.toFixed(2));

  // Apply simple render scale
  const finalSize = radiusInKm * SIMPLE_ASTEROID_SIZES.RENDER_SCALE;
  console.log("Render scale:", SIMPLE_ASTEROID_SIZES.RENDER_SCALE);
  console.log("Final size before clamp:", finalSize.toFixed(10));

  // Clamp to maximum
  const clampedSize = Math.min(finalSize, SIMPLE_ASTEROID_SIZES.MAX_FINAL_SIZE);
  console.log("Final clamped size:", clampedSize.toFixed(10));
  console.log("=====================================");
}

/**
 * Get the render scale being used
 */
export function getSimpleRenderScale(): number {
  return SIMPLE_ASTEROID_SIZES.RENDER_SCALE;
}
