import * as THREE from "three";
import { SolarSystem } from "../types/game.types";
import { PlanetData, MoonData } from "../types/planet.types";
// import { AsteroidBeltData } from "../types/asteroid.types";
import {
  SpaceshipData,
  LaunchConfig,
  DEFAULT_LAUNCH_CONFIG,
  ObjectType,
} from "../types/spaceship.types";

/**
 * Get the current world position of any object in the solar system
 */
export function getObjectWorldPosition(
  objectId: string,
  objectType: ObjectType,
  system: SolarSystem,
  gameTime: number
): THREE.Vector3 | null {
  switch (objectType) {
    case "planet": {
      const planet = system.planets.find((p) => p.id === objectId);
      if (!planet) return null;

      // Find the planet's index to get the correct angle calculation
      const planetIndex = system.planets.findIndex((p) => p.id === objectId);
      if (planetIndex === -1) return null;

      // Use the same calculation as SolarSystemView
      const distance = planet.orbitalDistance * 1.5; // Same scale as rendering
      const speed = 0.08 / Math.sqrt(planet.orbitalDistance); // Proportional to distance
      const initialAngle =
        (planetIndex * Math.PI) / (system.planets.length || 1);
      const currentAngle = initialAngle + gameTime * speed;

      const orbitalPosition = new THREE.Vector3(
        Math.cos(currentAngle) * distance,
        0,
        Math.sin(currentAngle) * distance
      );

      // For spaceship launches, we want the position on the planet's surface
      // Calculate planet's visual radius (same as in SolarSystemView)
      const SUN_RADIUS_UNITS = system.star?.size || 1;
      const renderScale = Math.min(
        0.16,
        (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, planet.radius / 6371)
      );
      const planetRadius = (planet.radius / 6371) * renderScale;

      // Position the ship on the planet's surface (slightly above)
      const surfacePosition = orbitalPosition.clone();
      surfacePosition.y = planetRadius * 1.1; // Slightly above surface

      return surfacePosition;
    }

    case "moon": {
      // Find the moon and its parent planet
      let moon: MoonData | null = null;
      let parentPlanet: PlanetData | null = null;

      for (const planet of system.planets) {
        if (planet.moons) {
          const foundMoon = planet.moons.find((m) => m.id === objectId);
          if (foundMoon) {
            moon = foundMoon;
            parentPlanet = planet;
            break;
          }
        }
      }

      if (!moon || !parentPlanet) return null;

      // Calculate parent planet position using the same logic as SolarSystemView
      const planetIndex = system.planets.findIndex(
        (p) => p.id === parentPlanet.id
      );
      if (planetIndex === -1) return null;

      const planetDistance = parentPlanet.orbitalDistance * 1.5;
      const planetSpeed = 0.08 / Math.sqrt(parentPlanet.orbitalDistance);
      const planetInitialAngle =
        (planetIndex * Math.PI) / (system.planets.length || 1);
      const planetCurrentAngle = planetInitialAngle + gameTime * planetSpeed;

      const planetPos = new THREE.Vector3(
        Math.cos(planetCurrentAngle) * planetDistance,
        0,
        Math.sin(planetCurrentAngle) * planetDistance
      );

      // Calculate moon position relative to planet
      const moonAngle = (gameTime * moon.orbitalSpeed) % (Math.PI * 2);
      const moonDistance = moon.orbitalDistance;
      const moonOffset = new THREE.Vector3(
        Math.cos(moonAngle) * moonDistance,
        0,
        Math.sin(moonAngle) * moonDistance
      );

      const moonOrbitalPosition = planetPos.clone().add(moonOffset);

      // Position the ship on the moon's surface
      const moonRadius = (moon.size / 1000) * 0.01; // Convert km to render units
      const moonSurfacePosition = moonOrbitalPosition.clone();
      moonSurfacePosition.y = moonRadius * 1.1; // Slightly above surface

      return moonSurfacePosition;
    }

    case "asteroid": {
      // Find the asteroid in any belt
      for (const belt of system.asteroidBelts || []) {
        const asteroid = belt.asteroids.find((a) => a.id === objectId);
        if (asteroid) {
          // Calculate asteroid position (simplified - assumes circular orbit)
          const angle = (gameTime * 0.1) % (Math.PI * 2); // Use fixed orbital speed
          const distance =
            belt.innerRadius + (belt.outerRadius - belt.innerRadius) * 0.5;
          const orbitalPosition = new THREE.Vector3(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
          );

          // Position the ship on the asteroid's surface
          const asteroidRadius = (asteroid.size / 1000) * 0.005; // Convert km to render units
          const asteroidSurfacePosition = orbitalPosition.clone();
          asteroidSurfacePosition.y = asteroidRadius * 1.1; // Slightly above surface

          return asteroidSurfacePosition;
        }
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Calculate a smooth launch trajectory from a planet surface
 */
export function calculateLaunchPath(
  startPosition: THREE.Vector3,
  direction: THREE.Vector3,
  config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const steps = Math.ceil(config.takeoffDuration * 60); // 60 FPS

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const easedT = easeInOutCubic(t);

    // Launch upward along the direction vector
    const height = config.takeoffHeight * easedT;
    const position = startPosition
      .clone()
      .add(direction.clone().multiplyScalar(height));

    points.push(position);
  }

  return points;
}

/**
 * Calculate a smooth Bezier curve path between two points
 */
export function calculateTravelPath(
  origin: THREE.Vector3,
  destination: THREE.Vector3,
  config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const distance = origin.distanceTo(destination);
  const duration = distance / config.travelSpeed;
  const steps = Math.ceil(duration * 60); // 60 FPS

  // Create control points for a smooth curve
  const midPoint = origin.clone().add(destination).multiplyScalar(0.5);
  const perpendicular = new THREE.Vector3(
    -(destination.z - origin.z),
    0,
    destination.x - origin.x
  ).normalize();

  // Add some height to the curve
  const curveHeight = Math.min(distance * 0.3, 5);
  const controlPoint1 = midPoint
    .clone()
    .add(perpendicular.multiplyScalar(distance * 0.2));
  controlPoint1.y = curveHeight;

  const controlPoint2 = midPoint
    .clone()
    .add(perpendicular.multiplyScalar(-distance * 0.2));
  controlPoint2.y = curveHeight;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // const _easedT = easeInOutCubic(t);

    // Cubic Bezier curve
    const point = new THREE.Vector3();
    point.lerpVectors(origin, controlPoint1, t);
    const temp1 = controlPoint1.clone().lerp(controlPoint2, t);
    const temp2 = controlPoint2.clone().lerp(destination, t);
    point.lerpVectors(point, temp1, t);
    point.lerpVectors(point, temp2, t);

    points.push(point);
  }

  return points;
}

/**
 * Calculate a circular orbit around a target point
 */
export function calculateOrbitPath(
  center: THREE.Vector3,
  radius: number,
  config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const steps = Math.ceil(config.orbitDuration * 60); // 60 FPS

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, center.y, z));
  }

  return points;
}

/**
 * Calculate a smooth landing trajectory
 */
export function calculateLandingPath(
  startPosition: THREE.Vector3,
  targetPosition: THREE.Vector3,
  _config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const steps = Math.ceil(_config.landingDuration * 60); // 60 FPS

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const easedT = easeInOutCubic(t);

    // Smooth descent
    const position = startPosition.clone().lerp(targetPosition, easedT);
    points.push(position);
  }

  return points;
}

/**
 * Create a new spaceship with initial state
 */
export function createSpaceship(
  id: string,
  origin: { id: string; type: ObjectType },
  destination: { id: string; type: ObjectType },
  startPosition: THREE.Vector3,
  _config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): SpaceshipData {
  return {
    id,
    position: startPosition.clone(),
    velocity: new THREE.Vector3(0, 0, 0),
    state: "launching",
    origin,
    destination,
    stateStartTime: Date.now(),
    totalFlightTime: 0,
    color: "#00ffff",
    size: 0.06,
    glowIntensity: 1.0,
    trailPositions: [startPosition.clone()],
    maxTrailLength: 30,
  };
}

/**
 * Calculate the total flight time for a journey
 */
export function calculateFlightTime(
  origin: THREE.Vector3,
  destination: THREE.Vector3,
  _config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): number {
  const distance = origin.distanceTo(destination);
  const travelTime = distance / _config.travelSpeed;
  return (
    _config.takeoffDuration +
    travelTime +
    _config.orbitDuration +
    _config.landingDuration
  );
}

/**
 * Easing function for smooth animations
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Update spaceship trail with new position
 */
export function updateSpaceshipTrail(
  spaceship: SpaceshipData,
  newPosition: THREE.Vector3
): void {
  spaceship.trailPositions.push(newPosition.clone());

  // Keep trail length within limits
  if (spaceship.trailPositions.length > spaceship.maxTrailLength) {
    spaceship.trailPositions.shift();
  }
}

/**
 * Get the next position for a spaceship based on its current state
 */
export function getNextSpaceshipPosition(
  spaceship: SpaceshipData,
  originPos: THREE.Vector3,
  destinationPos: THREE.Vector3,
  config: LaunchConfig = DEFAULT_LAUNCH_CONFIG
): THREE.Vector3 {
  const now = Date.now();
  const stateElapsed = (now - spaceship.stateStartTime) / 1000; // seconds

  // Use the original launch position for origin (from trail positions)
  const launchOrigin = spaceship.trailPositions[0] || originPos;

  switch (spaceship.state) {
    case "launching": {
      const progress = Math.min(stateElapsed / config.takeoffDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      // Launch upward from original launch position
      const direction = new THREE.Vector3(0, 1, 0);
      const height = config.takeoffHeight * easedProgress;
      return launchOrigin.clone().add(direction.multiplyScalar(height));
    }

    case "traveling": {
      // Use original launch position as origin, but current destination position
      const distance = launchOrigin.distanceTo(destinationPos);
      const travelTime = distance / config.travelSpeed;
      const progress = Math.min(stateElapsed / travelTime, 1);
      const easedProgress = easeInOutCubic(progress);

      // Bezier curve travel from launch position to current destination
      const midPoint = launchOrigin
        .clone()
        .add(destinationPos)
        .multiplyScalar(0.5);
      const perpendicular = new THREE.Vector3(
        -(destinationPos.z - launchOrigin.z),
        0,
        destinationPos.x - launchOrigin.x
      ).normalize();

      const curveHeight = Math.min(distance * 0.3, 5);
      const controlPoint1 = midPoint
        .clone()
        .add(perpendicular.multiplyScalar(distance * 0.2));
      controlPoint1.y = curveHeight;

      const controlPoint2 = midPoint
        .clone()
        .add(perpendicular.multiplyScalar(-distance * 0.2));
      controlPoint2.y = curveHeight;

      // Cubic Bezier interpolation
      const point = new THREE.Vector3();
      point.lerpVectors(launchOrigin, controlPoint1, easedProgress);
      const temp1 = controlPoint1.clone().lerp(controlPoint2, easedProgress);
      const temp2 = controlPoint2.clone().lerp(destinationPos, easedProgress);
      point.lerpVectors(point, temp1, easedProgress);
      point.lerpVectors(point, temp2, easedProgress);

      return point;
    }

    case "orbiting": {
      // Orbit around the destination at a fixed radius
      // Use a slower orbit speed to make it more stable
      const orbitSpeed = 0.5; // Slower orbit speed
      const progress = (stateElapsed * orbitSpeed) % 1;
      const angle = progress * Math.PI * 2;
      const x = destinationPos.x + Math.cos(angle) * config.orbitRadius;
      const z = destinationPos.z + Math.sin(angle) * config.orbitRadius;
      return new THREE.Vector3(x, destinationPos.y, z);
    }

    case "landing": {
      const progress = Math.min(stateElapsed / config.landingDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      // Start from orbit position and land to current destination
      const orbitPos = new THREE.Vector3(
        destinationPos.x + config.orbitRadius,
        destinationPos.y,
        destinationPos.z
      );
      return orbitPos.clone().lerp(destinationPos, easedProgress);
    }

    case "waiting": {
      // Continue orbiting the destination indefinitely
      // Use the same slower orbit speed as orbiting state
      const orbitSpeed = 0.5; // Slower orbit speed
      const progress = (stateElapsed * orbitSpeed) % 1;
      const angle = progress * Math.PI * 2;
      const x = destinationPos.x + Math.cos(angle) * config.orbitRadius;
      const z = destinationPos.z + Math.sin(angle) * config.orbitRadius;
      return new THREE.Vector3(x, destinationPos.y, z);
    }

    default:
      return spaceship.position;
  }
}
