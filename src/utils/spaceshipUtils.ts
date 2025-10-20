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
  fixedDestinationPosition?: THREE.Vector3,
  _config: LaunchConfig = DEFAULT_LAUNCH_CONFIG,
  debugMode: boolean = false
): SpaceshipData {
  const spaceship: SpaceshipData = {
    id,
    position: startPosition.clone(),
    velocity: new THREE.Vector3(0, 0, 0),
    state: "orbiting_origin", // Start orbiting around origin
    origin,
    destination,
    stateStartTime: Date.now(),
    currentPathIndex: 0,
    trail: [startPosition.clone()],
    speed: 1.0,
    totalFlightTime: 0,
    color: "#00ffff",
    size: 0.06,
    glowIntensity: 1.0,
    trailPositions: [startPosition.clone()],
    maxTrailLength: 30,
  };

  // Store the fixed destination position to prevent chasing moving targets
  if (fixedDestinationPosition) {
    (spaceship as any).fixedDestination = fixedDestinationPosition.clone();
  }

  // Enable debug mode for this spaceship
  if (debugMode) {
    (spaceship as any).debugMode = true;
  }

  return spaceship;
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
 * Enable debug mode for a spaceship (for debugging trajectory issues)
 */
export function enableSpaceshipDebugMode(spaceship: SpaceshipData): void {
  (spaceship as any).debugMode = true;
  console.log(`🐛 Debug mode enabled for spaceship ${spaceship.id}`);
}

/**
 * Disable debug mode for a spaceship
 */
export function disableSpaceshipDebugMode(spaceship: SpaceshipData): void {
  (spaceship as any).debugMode = false;
  console.log(`🐛 Debug mode disabled for spaceship ${spaceship.id}`);
}

/**
 * Predict where an object will be in the future based on current orbital mechanics
 * This helps with trajectory planning for spaceships
 */
export function predictObjectPosition(
  objectId: string,
  objectType: ObjectType,
  system: SolarSystem,
  currentGameTime: number,
  futureTime: number
): THREE.Vector3 | null {
  const timeOffset = futureTime - currentGameTime;

  switch (objectType) {
    case "planet": {
      const planet = system.planets.find((p) => p.id === objectId);
      if (!planet) return null;

      const planetIndex = system.planets.findIndex((p) => p.id === objectId);
      if (planetIndex === -1) return null;

      const distance = planet.orbitalDistance * 1.5;
      const speed = 0.08 / Math.sqrt(planet.orbitalDistance);
      const initialAngle =
        (planetIndex * Math.PI) / (system.planets.length || 1);
      const futureAngle = initialAngle + (currentGameTime + timeOffset) * speed;

      const orbitalPosition = new THREE.Vector3(
        Math.cos(futureAngle) * distance,
        0,
        Math.sin(futureAngle) * distance
      );

      // Add surface offset
      const SUN_RADIUS_UNITS = system.star?.size || 1;
      const renderScale = Math.min(
        0.16,
        (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, planet.radius / 6371)
      );
      const planetRadius = (planet.radius / 6371) * renderScale;
      orbitalPosition.y = planetRadius * 1.1;

      return orbitalPosition;
    }

    case "moon": {
      // Similar logic for moons - predict parent planet position and moon orbit
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

      // Predict parent planet position
      const planetIndex = system.planets.findIndex(
        (p) => p.id === parentPlanet.id
      );
      if (planetIndex === -1) return null;

      const planetDistance = parentPlanet.orbitalDistance * 1.5;
      const planetSpeed = 0.08 / Math.sqrt(parentPlanet.orbitalDistance);
      const planetInitialAngle =
        (planetIndex * Math.PI) / (system.planets.length || 1);
      const planetFutureAngle =
        planetInitialAngle + (currentGameTime + timeOffset) * planetSpeed;

      const planetPos = new THREE.Vector3(
        Math.cos(planetFutureAngle) * planetDistance,
        0,
        Math.sin(planetFutureAngle) * planetDistance
      );

      // Predict moon position relative to planet
      const moonAngle =
        ((currentGameTime + timeOffset) * moon.orbitalSpeed) % (Math.PI * 2);
      const moonDistance = moon.orbitalDistance;
      const moonOffset = new THREE.Vector3(
        Math.cos(moonAngle) * moonDistance,
        0,
        Math.sin(moonAngle) * moonDistance
      );

      const moonOrbitalPosition = planetPos.clone().add(moonOffset);
      const moonRadius = (moon.size / 1000) * 0.01;
      moonOrbitalPosition.y = moonRadius * 1.1;

      return moonOrbitalPosition;
    }

    default:
      return null;
  }
}

/**
 * Get the next position for a spaceship based on its current state
 * Uses hybrid orbital approach: start from orbit, travel to fixed destination, end in orbit
 */
export function getNextSpaceshipPosition(
  spaceship: SpaceshipData,
  originPos: THREE.Vector3,
  destinationPos: THREE.Vector3,
  config: LaunchConfig = DEFAULT_LAUNCH_CONFIG,
  delta: number = 1 / 60 // Default to 60fps delta
): THREE.Vector3 {
  const now = Date.now();
  const stateElapsed = (now - spaceship.stateStartTime) / 1000; // seconds

  // Use the original launch position for origin (from trail positions)
  const launchOrigin = spaceship.trailPositions[0] || originPos;

  switch (spaceship.state) {
    case "orbiting_origin": {
      // Orbit around the origin object using proper orbital mechanics
      const orbitRadius = config.orbitRadius || 2.0;
      const orbitSpeed = 0.8; // Orbital speed

      // Initialize orbital phase if not exists
      if (!(spaceship as any).orbitalPhase) {
        (spaceship as any).orbitalPhase = 0;
      }

      // Accumulate orbital phase (like MoonOrbit: phaseRef.current += delta * speed * timeScale)
      (spaceship as any).orbitalPhase += delta * orbitSpeed;

      // Calculate orbital position using accumulated phase
      const orbitAngle = (spaceship as any).orbitalPhase;

      // Orbit around the origin position
      const x = launchOrigin.x + Math.cos(orbitAngle) * orbitRadius;
      const z = launchOrigin.z + Math.sin(orbitAngle) * orbitRadius;
      const y = launchOrigin.y; // Keep same Y as origin

      // DEBUG: Log orbital information
      if ((spaceship as any).debugMode || Math.random() < 0.02) {
        // 2% chance or debug mode
        console.log(`🚀 Spaceship ${spaceship.id} ORBITING ORIGIN DEBUG:`, {
          state: spaceship.state,
          stateElapsed: stateElapsed.toFixed(2),
          orbitAngle: orbitAngle.toFixed(3),
          launchOrigin: launchOrigin.toArray().map((v: number) => v.toFixed(2)),
          orbitalPosition: [x.toFixed(2), y.toFixed(2), z.toFixed(2)],
          orbitRadius: orbitRadius.toFixed(2),
          orbitalPhase: (spaceship as any).orbitalPhase.toFixed(3),
        });
      }

      return new THREE.Vector3(x, y, z);
    }

    case "traveling": {
      // Use FIXED destination position (calculated at launch time)
      // This prevents the spaceship from chasing moving targets
      const fixedDestination =
        (spaceship as any).fixedDestination || destinationPos;

      const distance = launchOrigin.distanceTo(fixedDestination);
      const travelTime = distance / config.travelSpeed;
      const progress = Math.min(stateElapsed / travelTime, 1);
      const easedProgress = easeInOutCubic(progress);

      // DEBUG: Log trajectory information for selected spaceships
      if ((spaceship as any).debugMode || Math.random() < 0.01) {
        // 1% chance or debug mode
        console.log(`🚀 Spaceship ${spaceship.id} TRAVELING DEBUG:`, {
          state: spaceship.state,
          stateElapsed: stateElapsed.toFixed(2),
          progress: progress.toFixed(3),
          easedProgress: easedProgress.toFixed(3),
          launchOrigin: launchOrigin.toArray().map((v: number) => v.toFixed(2)),
          fixedDestination: fixedDestination
            .toArray()
            .map((v: number) => v.toFixed(2)),
          currentDestination: destinationPos
            .toArray()
            .map((v: number) => v.toFixed(2)),
          distance: distance.toFixed(2),
          travelTime: travelTime.toFixed(2),
          distanceFromFixed: spaceship.position
            .distanceTo(fixedDestination)
            .toFixed(2),
          distanceFromCurrent: spaceship.position
            .distanceTo(destinationPos)
            .toFixed(2),
          fixedVsCurrentDistance: fixedDestination
            .distanceTo(destinationPos)
            .toFixed(2),
        });
      }

      // Bezier curve travel from launch position to FIXED destination
      const midPoint = launchOrigin
        .clone()
        .add(fixedDestination)
        .multiplyScalar(0.5);
      const perpendicular = new THREE.Vector3(
        -(fixedDestination.z - launchOrigin.z),
        0,
        fixedDestination.x - launchOrigin.x
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
      const temp2 = controlPoint2.clone().lerp(fixedDestination, easedProgress);
      point.lerpVectors(point, temp1, easedProgress);
      point.lerpVectors(point, temp2, easedProgress);

      return point;
    }

    case "orbiting_destination": {
      // Orbit around the CURRENT destination position (not the fixed predicted position)
      // This ensures the spaceship follows the planet as it moves
      const currentDestination = destinationPos; // Use current planet position
      const orbitSpeed = 0.5; // Orbital speed (slower for stability)
      const orbitRadius = config.orbitRadius || 2.0;

      // Initialize orbital phase if not exists (similar to MoonOrbit phaseRef)
      if (!(spaceship as any).orbitalPhase) {
        (spaceship as any).orbitalPhase = 0;
      }

      // Accumulate orbital phase (like MoonOrbit: phaseRef.current += delta * speed * timeScale)
      (spaceship as any).orbitalPhase += delta * orbitSpeed;

      // Calculate orbital position using accumulated phase
      const orbitAngle = (spaceship as any).orbitalPhase;

      const x = currentDestination.x + Math.cos(orbitAngle) * orbitRadius;
      const z = currentDestination.z + Math.sin(orbitAngle) * orbitRadius;
      const y = currentDestination.y; // Keep same Y as destination

      // DEBUG: Log orbital information
      if ((spaceship as any).debugMode || Math.random() < 0.02) {
        console.log(
          `🚀 Spaceship ${spaceship.id} ORBITING DESTINATION DEBUG:`,
          {
            state: spaceship.state,
            stateElapsed: stateElapsed.toFixed(2),
            orbitAngle: orbitAngle.toFixed(3),
            currentDestination: currentDestination
              .toArray()
              .map((v: number) => v.toFixed(2)),
            fixedDestination: (spaceship as any).fixedDestination
              ?.toArray()
              .map((v: number) => v.toFixed(2)),
            orbitalPosition: [x.toFixed(2), y.toFixed(2), z.toFixed(2)],
            orbitRadius: orbitRadius.toFixed(2),
            orbitalPhase: (spaceship as any).orbitalPhase.toFixed(3),
            destinationMovement: (spaceship as any).fixedDestination
              ? currentDestination
                  .distanceTo((spaceship as any).fixedDestination)
                  .toFixed(2)
              : "N/A",
          }
        );
      }

      return new THREE.Vector3(x, y, z);
    }

    default:
      return spaceship.position;
  }
}
