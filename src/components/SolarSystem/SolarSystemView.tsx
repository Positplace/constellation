import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import Planet from "../Planets/Planet";
import TunnelGate from "./TunnelGate";
import UndiscoveredGate from "./UndiscoveredGate";
import TravelAnimation from "./TravelAnimation";
import Starfield from "../Background/Starfield";
import { AsteroidBelt } from "../Asteroids/AsteroidBelt";
import BinaryStar from "./BinaryStar";
import BlackHole from "./BlackHole";
import Comet from "../Comets/Comet";
import Nebula from "../Nebula/Nebula";
// import { SimpleAsteroidTest } from "../Asteroids/SimpleAsteroidTest";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import SpaceshipManager from "../Spaceships/SpaceshipManager";
import DysonSphere from "./DysonSphere";

const SolarSystemView: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const [selectedPos, setSelectedPos] = useState<THREE.Vector3 | null>(null);
  const [travelState, setTravelState] = useState<{
    active: boolean;
    fromSystemId: string;
    toSystemId: string;
    gatePosition: [number, number, number];
    phase: "approach" | "warp" | "exit";
    startTime: number;
    initialCameraPos?: THREE.Vector3;
    initialCameraTarget?: THREE.Vector3;
    isNewSystem?: boolean; // Track if this is a newly discovered system
  } | null>(null);
  // Track selection; camera distance should remain user-controlled
  const {
    isPlaying,
    timeScale,
    solarSystems,
    currentSystemId,
    selectedObject,
    setSelectedObject,
    setCurrentSystem,
    spaceships,
    generateAndAddSystem,
    canAddConnection,
  } = useGameStore();
  const { emitPlanetSelected, emitCurrentSystemChanged } = useSocket();
  const { isConnected } = useMultiplayerStore();

  // Show planet orbital paths when the sun is selected
  const shouldShowPlanetOrbits = selectedObject?.type === "sun";

  // Extract selected IDs for easier access
  const selectedPlanetId =
    selectedObject?.type === "planet" ? selectedObject.id : null;
  const selectedAsteroidId =
    selectedObject?.type === "asteroid" ? selectedObject.id : null;
  const selectedMoonId =
    selectedObject?.type === "moon" ? selectedObject.id : null;
  const selectedSpaceshipId =
    selectedObject?.type === "spaceship" ? selectedObject.id : null;
  const selectedCometId =
    selectedObject?.type === "comet" ? selectedObject.id : null;

  // Get current system
  const currentSystem = useMemo(() => {
    return solarSystems.find((s) => s.id === currentSystemId);
  }, [solarSystems, currentSystemId]);

  // Calculate maximum camera distance based on system size
  const maxCameraDistance = useMemo(() => {
    if (!currentSystem) return 20; // Default fallback

    let maxOrbitalDistance = 0;

    // Check planets
    if (currentSystem.planets) {
      for (const planet of currentSystem.planets) {
        const visualDistance = planet.orbitalDistance * 1.5; // Same scale as rendering
        maxOrbitalDistance = Math.max(maxOrbitalDistance, visualDistance);
      }
    }

    // Check asteroid belts
    if (currentSystem.asteroidBelts) {
      for (const belt of currentSystem.asteroidBelts) {
        const visualDistance = belt.outerRadius * 1.5; // Same scale as rendering
        maxOrbitalDistance = Math.max(maxOrbitalDistance, visualDistance);
      }
    }

    // Add buffer: allow zooming out to 2x the farthest object + 5 units
    const calculatedMax = maxOrbitalDistance * 2 + 5;

    // Ensure minimum of 20 for small systems
    return Math.max(20, calculatedMax);
  }, [currentSystem]);

  // Smooth zoom animation state for planet focus
  const zoomAnimRef = useRef<{
    active: boolean;
    start: number;
    duration: number;
    fromDistance: number;
    toDistance: number;
    dir: THREE.Vector3;
    fromTarget?: THREE.Vector3;
    toTarget?: THREE.Vector3;
  }>({
    active: false,
    start: 0,
    duration: 700,
    fromDistance: 0,
    toDistance: 0,
    dir: new THREE.Vector3(0, 0, 1),
  });
  // Track pending focus distance for zoom animation
  const pendingFocusDistanceRef = useRef<number | null>(null);

  // Start the game loop so gameTime advances when playing
  useGameLoop();

  // Calculate initial camera distance based on system size
  const initialCameraDistance = useMemo(() => {
    if (!currentSystem) return 12;

    const starSize = currentSystem.star.size;
    const isBlackHole = currentSystem.star.type === "black_hole";
    let maxDistance = 0;

    // Check planets
    if (currentSystem.planets && currentSystem.planets.length > 0) {
      for (const planet of currentSystem.planets) {
        const visualDistance = planet.orbitalDistance * 1.5;
        maxDistance = Math.max(maxDistance, visualDistance);
      }
    }

    // Check asteroid belts
    if (currentSystem.asteroidBelts && currentSystem.asteroidBelts.length > 0) {
      for (const belt of currentSystem.asteroidBelts) {
        const visualDistance = belt.outerRadius * 1.5;
        maxDistance = Math.max(maxDistance, visualDistance);
      }
    }

    // Black holes need special handling - they have large accretion disks and gravitational lensing
    if (isBlackHole) {
      // Account for accretion disk size (typically ~3.5 star radius)
      const accretionDiskSize = starSize * 3.5;
      const blackHoleMinDistance = accretionDiskSize * 4; // Give plenty of space to see the lensing effects

      if (maxDistance > 0) {
        const cameraDistance = Math.max(
          blackHoleMinDistance,
          maxDistance * 1.5
        );
        console.log(
          `🕳️ Black hole camera: accretionDisk=${accretionDiskSize.toFixed(
            2
          )}, maxDist=${maxDistance.toFixed(
            2
          )}, camera=${cameraDistance.toFixed(2)}`
        );
        return cameraDistance;
      }

      // Even if no objects, black hole needs more distance to be fully visible
      const cameraDistance = Math.max(blackHoleMinDistance, 12);
      console.log(
        `🕳️ Black hole camera (empty system): accretionDisk=${accretionDiskSize.toFixed(
          2
        )}, camera=${cameraDistance.toFixed(2)}`
      );
      return cameraDistance;
    }

    // If we have objects, zoom to show them all
    if (maxDistance > 0) {
      return Math.max(starSize * 5, maxDistance * 1.5);
    }

    // Otherwise, base it on star size
    return Math.max(starSize * 8, 3);
  }, [currentSystem]);

  // Set default top-down camera view on mount or when system changes
  useEffect(() => {
    if (controlsRef.current && currentSystem) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;
      controls.target.set(0, 0, 0);
      cam.position.set(0, initialCameraDistance, 0); // top-down view from above
      controls.update();
    }
  }, [currentSystemId, initialCameraDistance]);

  // Listen for focusPlanet requests coming from HUD
  useEffect(() => {
    const onFocusPlanet = (e: Event) => {
      const detail = (e as CustomEvent).detail as { planetId: string };
      if (!detail || !currentSystem || !controlsRef.current) return;
      const planet = currentSystem.planets.find(
        (p) => p.id === detail.planetId
      );
      if (!planet) return;

      // Select planet; onSelectedFrame will provide its world position
      setSelectedObject({ id: planet.id, type: "planet" });

      // Compute a reasonable focus distance based on planet size similar to Home focus
      const SUN_RADIUS_UNITS = currentSystem?.star?.size || 1;
      const renderScale = Math.min(
        0.16,
        (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, planet.radius / 6371)
      );
      const radiusUnits = (planet.radius / 6371) * renderScale;
      const atmosphereRadius = radiusUnits * 1.06;
      const minSafeDistance = (atmosphereRadius * 2) / 0.6;
      const focusDistance = Math.max(
        minSafeDistance,
        Math.min(4, radiusUnits * 2.5)
      );
      pendingFocusDistanceRef.current = focusDistance;
    };

    window.addEventListener("focusPlanet", onFocusPlanet as EventListener);
    return () =>
      window.removeEventListener("focusPlanet", onFocusPlanet as EventListener);
  }, [currentSystem, setSelectedObject]);

  // Listen for focusRandomAsteroid requests coming from HUD
  useEffect(() => {
    const onFocusRandomAsteroid = () => {
      if (!currentSystem || !controlsRef.current) return;
      const allAsteroids =
        currentSystem.asteroidBelts?.flatMap((b) => b.asteroids) || [];
      if (allAsteroids.length === 0) return;
      const rand = Math.floor(Math.random() * allAsteroids.length);
      const asteroid = allAsteroids[rand];

      // Focus on this random asteroid with zoom animation
      focusOnAsteroid(asteroid.id);
    };

    window.addEventListener("focusRandomAsteroid", onFocusRandomAsteroid);
    return () =>
      window.removeEventListener("focusRandomAsteroid", onFocusRandomAsteroid);
  }, [currentSystem, setSelectedObject]);

  // Listen for focusAsteroidBelt requests (focus on specific belt)
  useEffect(() => {
    const onFocusAsteroidBelt = (event: Event) => {
      const customEvent = event as CustomEvent<{ beltId: string }>;
      if (!currentSystem || !controlsRef.current) return;
      const belt = currentSystem.asteroidBelts?.find(
        (b) => b.id === customEvent.detail.beltId
      );
      if (!belt || belt.asteroids.length === 0) return;

      // Pick a random asteroid from this specific belt
      const rand = Math.floor(Math.random() * belt.asteroids.length);
      const asteroid = belt.asteroids[rand];

      // Focus on this asteroid with zoom animation
      focusOnAsteroid(asteroid.id);
    };

    window.addEventListener(
      "focusAsteroidBelt",
      onFocusAsteroidBelt as EventListener
    );
    return () =>
      window.removeEventListener(
        "focusAsteroidBelt",
        onFocusAsteroidBelt as EventListener
      );
  }, [currentSystem, setSelectedObject]);

  // Helper function to focus on a specific asteroid with zoom animation
  const focusOnAsteroid = (asteroidId: string) => {
    if (!currentSystem || !controlsRef.current) return;
    const allAsteroids =
      currentSystem.asteroidBelts?.flatMap((b) => b.asteroids) || [];
    const asteroid = allAsteroids.find((a) => a.id === asteroidId);
    if (!asteroid) return;

    setSelectedObject({ id: asteroid.id, type: "asteroid" });

    // Immediately set selected position to asteroid's current position for zoom
    const pos = new THREE.Vector3(
      asteroid.position[0],
      asteroid.position[1],
      asteroid.position[2]
    );
    setSelectedPos(pos);

    // Determine a small focus distance appropriate for tiny asteroids
    const focusDistance = 0.3; // close-up
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;
      const offset = cam.position.clone().sub(controls.target);
      const dir =
        offset.length() > 0
          ? offset.clone().normalize()
          : new THREE.Vector3(0, 0, 1);
      zoomAnimRef.current = {
        active: true,
        start: performance.now(),
        duration: 700,
        fromDistance: offset.length(),
        toDistance: focusDistance,
        dir,
        fromTarget: controls.target.clone(),
        toTarget: pos.clone(),
      };
    }
  };

  // Track the last selected sun ID to prevent re-running the effect
  const lastSelectedSunRef = useRef<string | null>(null);

  // Handle sun selection - zoom out to overview and show orbital paths (only once per selection)
  useEffect(() => {
    // Only run when sun is newly selected (not already selected)
    if (
      selectedObject?.type !== "sun" ||
      !controlsRef.current ||
      lastSelectedSunRef.current === selectedObject.id
    ) {
      // Update the ref even if we don't run the effect
      if (selectedObject?.type === "sun") {
        lastSelectedSunRef.current = selectedObject.id;
      } else {
        lastSelectedSunRef.current = null;
      }
      return;
    }

    lastSelectedSunRef.current = selectedObject.id;

    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

    // Current state
    const currentTarget = controls.target.clone();
    const currentOffset = cam.position.clone().sub(currentTarget);
    const currentDistance = currentOffset.length();
    const targetDistance = 12; // Overview distance

    // Target state (overview from above)
    const targetTarget = new THREE.Vector3(0, 0, 0);
    const targetDir = new THREE.Vector3(0, 1, 0); // top-down view

    // Set selected position to sun center
    setSelectedPos(new THREE.Vector3(0, 0, 0));

    // If we're already roughly at the overview, just snap
    if (
      Math.abs(currentDistance - targetDistance) < 1 &&
      currentTarget.distanceTo(targetTarget) < 0.5
    ) {
      controls.target.copy(targetTarget);
      cam.position.set(0, 12, 0);
      controls.update();
    } else {
      // Otherwise, animate smoothly from current position to overview
      const fromDir =
        currentOffset.length() > 0
          ? currentOffset.clone().normalize()
          : new THREE.Vector3(0, 1, 0);

      // Blend the direction during animation
      const blendedDir = fromDir.clone().lerp(targetDir, 0.5).normalize();

      zoomAnimRef.current = {
        active: true,
        start: performance.now(),
        duration: 700,
        fromDistance: currentDistance,
        toDistance: targetDistance,
        dir: blendedDir,
        fromTarget: currentTarget,
        toTarget: targetTarget,
      };
    }

    // Emit to server if connected
    if (isConnected) {
      emitPlanetSelected(null);
      // TODO: Add sun selection socket event
    }
  }, [selectedObject, isConnected, emitPlanetSelected]);

  // Keyboard controls for panning (WASD / Arrow keys)
  useEffect(() => {
    const keyState = {
      w: false,
      a: false,
      s: false,
      d: false,
      arrowUp: false,
      arrowLeft: false,
      arrowDown: false,
      arrowRight: false,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "w":
          keyState.w = true;
          e.preventDefault();
          break;
        case "a":
          keyState.a = true;
          e.preventDefault();
          break;
        case "s":
          keyState.s = true;
          e.preventDefault();
          break;
        case "d":
          keyState.d = true;
          e.preventDefault();
          break;
        case "arrowup":
          keyState.arrowUp = true;
          e.preventDefault();
          break;
        case "arrowleft":
          keyState.arrowLeft = true;
          e.preventDefault();
          break;
        case "arrowdown":
          keyState.arrowDown = true;
          e.preventDefault();
          break;
        case "arrowright":
          keyState.arrowRight = true;
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          keyState.w = false;
          break;
        case "a":
          keyState.a = false;
          break;
        case "s":
          keyState.s = false;
          break;
        case "d":
          keyState.d = false;
          break;
        case "arrowup":
          keyState.arrowUp = false;
          break;
        case "arrowleft":
          keyState.arrowLeft = false;
          break;
        case "arrowdown":
          keyState.arrowDown = false;
          break;
        case "arrowright":
          keyState.arrowRight = false;
          break;
      }
    };

    // Animate camera panning based on key state
    const animate = () => {
      if (!controlsRef.current) {
        requestAnimationFrame(animate);
        return;
      }

      const controls = controlsRef.current;
      const camera = controls.object as THREE.PerspectiveCamera;
      const panSpeed = 0.1; // Adjust for faster/slower panning

      // Calculate pan direction based on camera orientation
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();

      camera.getWorldDirection(forward);
      forward.y = 0; // Keep panning horizontal
      forward.normalize();

      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const movement = new THREE.Vector3();

      // WASD controls
      if (keyState.w || keyState.arrowUp)
        movement.add(forward.clone().multiplyScalar(panSpeed));
      if (keyState.s || keyState.arrowDown)
        movement.add(forward.clone().multiplyScalar(-panSpeed));
      if (keyState.a || keyState.arrowLeft)
        movement.add(right.clone().multiplyScalar(-panSpeed));
      if (keyState.d || keyState.arrowRight)
        movement.add(right.clone().multiplyScalar(panSpeed));

      // Apply movement to both camera and target
      if (movement.lengthSq() > 0) {
        controls.target.add(movement);
        camera.position.add(movement);
        controls.update();
      }

      requestAnimationFrame(animate);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Rotate Sun slowly
  useFrame((_state, delta) => {
    if (sunRef.current && isPlaying) {
      sunRef.current.rotation.y += delta * 0.2;
    }

    // Handle approach and exit phases of travel animation
    if (travelState && controlsRef.current) {
      const elapsed = Date.now() - travelState.startTime;
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;

      if (travelState.phase === "approach") {
        // Phase 1: Fly to the gate (1.5 seconds)
        const duration = 1500;
        const progress = Math.min(elapsed / duration, 1);
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Calculate target position near the gate
        const gatePos = new THREE.Vector3(...travelState.gatePosition);
        const directionToGate = gatePos
          .clone()
          .sub(travelState.initialCameraPos || cam.position)
          .normalize();
        const targetPos = gatePos
          .clone()
          .sub(directionToGate.multiplyScalar(3)); // Stop 3 units before gate

        // Animate camera position to gate
        if (travelState.initialCameraPos) {
          cam.position.lerpVectors(
            travelState.initialCameraPos,
            targetPos,
            eased
          );
        }

        // Smoothly animate camera target from current target to gate
        if (travelState.initialCameraTarget) {
          controls.target.lerpVectors(
            travelState.initialCameraTarget,
            gatePos,
            eased
          );
        }

        controls.update();

        if (progress >= 1) {
          // Switch to warp phase
          setTravelState((prev) =>
            prev ? { ...prev, phase: "warp", startTime: Date.now() } : null
          );
        }
      } else if (travelState.phase === "exit") {
        // Phase 3: Exit from gate to overview (1.5 seconds)
        const duration = 1500;
        const progress = Math.min(elapsed / duration, 1);
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Calculate the exit gate position in the DESTINATION system
        // We need to find where the gate back to the origin system is located
        let exitGatePos = new THREE.Vector3(...travelState.gatePosition);

        if (currentSystem) {
          // Find the index of the connection back to the origin system
          const connectionIndex = currentSystem.connections.indexOf(
            travelState.fromSystemId
          );

          if (connectionIndex !== -1) {
            // Calculate gate position using the same logic as the gate rendering
            const totalGates = currentSystem.maxConnections;
            const angleStep = (Math.PI * 2) / totalGates;
            const angle = connectionIndex * angleStep;

            // Calculate gate distance dynamically (same logic as gate rendering)
            let gateDistance = 15; // Default fallback

            // Collect all occupied orbital distances (planets and asteroid belts)
            const occupiedDistances: number[] = [];

            if (currentSystem.planets && currentSystem.planets.length > 0) {
              currentSystem.planets.forEach((p) => {
                occupiedDistances.push(p.orbitalDistance * 1.5);
              });
            }

            if (
              currentSystem.asteroidBelts &&
              currentSystem.asteroidBelts.length > 0
            ) {
              currentSystem.asteroidBelts.forEach((belt) => {
                occupiedDistances.push(belt.innerRadius * 1.5);
                occupiedDistances.push(belt.outerRadius * 1.5);
              });
            }

            if (occupiedDistances.length > 0) {
              const minOccupiedDistance = Math.min(...occupiedDistances);
              const maxOccupiedDistance = Math.max(...occupiedDistances);

              const innerGateDistance = minOccupiedDistance - 1.5;
              const outerGateDistance = maxOccupiedDistance + 2.0;

              if (innerGateDistance > 3.0) {
                gateDistance = innerGateDistance;
              } else {
                gateDistance = outerGateDistance;
              }
            }

            exitGatePos = new THREE.Vector3(
              Math.cos(angle) * gateDistance,
              0,
              Math.sin(angle) * gateDistance
            );
          }
        }

        const finalTarget = new THREE.Vector3(0, 0, 0);

        // Calculate final position to maintain original camera angle and distance
        let finalPos = new THREE.Vector3(0, 12, 0);
        if (travelState.initialCameraPos && travelState.initialCameraTarget) {
          // Calculate the original offset from center
          const originalOffset = travelState.initialCameraPos
            .clone()
            .sub(travelState.initialCameraTarget);

          // Clamp the offset to respect the destination system's max camera distance
          const originalDistance = originalOffset.length();
          if (originalDistance > maxCameraDistance) {
            // Scale down the offset to fit within the max distance
            originalOffset.multiplyScalar(maxCameraDistance / originalDistance);
          }

          // Apply clamped offset to new system's center
          finalPos = finalTarget.clone().add(originalOffset);
        }

        // Start slightly ahead of the gate (10% offset toward center)
        const startPos = exitGatePos
          .clone()
          .add(
            new THREE.Vector3(-exitGatePos.x * 0.1, 0, -exitGatePos.z * 0.1)
          );

        // Interpolate position
        cam.position.lerpVectors(startPos, finalPos, eased);

        // Look at interpolated target
        const currentTarget = new THREE.Vector3();
        currentTarget.lerpVectors(exitGatePos, finalTarget, eased);
        controls.target.copy(currentTarget);
        controls.update();

        if (progress >= 1) {
          // Complete the travel
          completeTravelAnimation();
        }
      }
    }
  });

  useEffect(() => {
    // Don't immediately jump camera if a zoom animation is active
    if (controlsRef.current && selectedPos && !zoomAnimRef.current.active) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;
      // Preserve current camera offset vector relative to target
      const offset = cam.position.clone().sub(controls.target);
      const distance = offset.length();
      const dir =
        offset.length() > 0 ? offset.normalize() : new THREE.Vector3(0, 0, 1);
      controls.target.copy(selectedPos);
      cam.position.copy(selectedPos.clone().add(dir.multiplyScalar(distance)));
      controls.update();
    }
  }, [selectedPos]);

  // Ease function for smooth zoom (ease-in-out cubic)
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Animate zoom toward selected planet when a zoom is active
  useFrame(() => {
    if (!controlsRef.current) return;
    const anim = zoomAnimRef.current;
    if (!anim.active) return;

    const now = performance.now();
    const t = Math.min(1, (now - anim.start) / anim.duration);
    const k = easeInOutCubic(t);

    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

    // If animating to/from specific targets (zoom out to overview)
    if (anim.fromTarget && anim.toTarget) {
      // Interpolate target position
      const currentTarget = new THREE.Vector3().lerpVectors(
        anim.fromTarget,
        anim.toTarget,
        k
      );
      controls.target.copy(currentTarget);

      // Interpolate distance
      const dist =
        anim.fromDistance + (anim.toDistance - anim.fromDistance) * k;
      cam.position.copy(
        currentTarget.clone().add(anim.dir.clone().multiplyScalar(dist))
      );
    } else if (selectedPos) {
      // Keep tracking the moving selected planet (zoom in)
      controls.target.copy(selectedPos);
      const dist =
        anim.fromDistance + (anim.toDistance - anim.fromDistance) * k;
      cam.position.copy(
        selectedPos.clone().add(anim.dir.clone().multiplyScalar(dist))
      );
    }

    controls.update();

    if (t >= 1) {
      anim.active = false;
    }
  });

  // Prepare planet data for rendering
  const planetsToRender = useMemo(() => {
    if (!currentSystem) return [];

    return (
      currentSystem?.planets?.map((planet, idx) => ({
        planet,
        distance: planet.orbitalDistance * 1.5, // Scale for visualization
        // Use Kepler's law directly: angular speed ∝ 1/√r
        // This ensures inner planets move visibly faster than outer ones
        speed: 0.08 / Math.sqrt(planet.orbitalDistance), // Proportional to distance
        angle: (idx * Math.PI) / (currentSystem.planets.length || 1),
      })) || []
    );
  }, [currentSystem]);

  // Listen for focusMoon requests coming from HUD
  useEffect(() => {
    const onFocusMoon = (e: Event) => {
      const detail = (e as CustomEvent).detail as { moonId: string };
      if (!detail || !currentSystem || !controlsRef.current) return;

      // Find the moon in the system
      let foundMoon = null;
      let parentPlanet = null;

      for (const planet of currentSystem.planets) {
        if (planet.moons) {
          const moon = planet.moons.find((m) => m.id === detail.moonId);
          if (moon) {
            foundMoon = moon;
            parentPlanet = planet;
            break;
          }
        }
      }

      if (!foundMoon || !parentPlanet) return;

      // Select the moon
      setSelectedObject({ id: foundMoon.id, type: "moon" });

      // Calculate moon position for focus
      const moonAngle = foundMoon.orbitalAngle;
      const moonDistance = foundMoon.orbitalDistance;

      // Get planet's actual orbital position from planetsToRender
      const planetRenderData = planetsToRender.find(
        (p) => p.planet.id === parentPlanet.id
      );
      if (!planetRenderData) return;

      const planetPos = new THREE.Vector3(
        Math.cos(planetRenderData.angle) * planetRenderData.distance,
        0,
        Math.sin(planetRenderData.angle) * planetRenderData.distance
      );

      // Calculate moon position relative to planet
      const moonPos = new THREE.Vector3(
        planetPos.x + Math.cos(moonAngle) * moonDistance,
        planetPos.y,
        planetPos.z + Math.sin(moonAngle) * moonDistance
      );

      setSelectedPos(moonPos);

      // Focus on the moon with close-up distance
      const focusDistance = 0.2;
      if (controlsRef.current) {
        const controls = controlsRef.current;
        const cam = controls.object as THREE.PerspectiveCamera;
        const offset = cam.position.clone().sub(controls.target);
        const dir =
          offset.length() > 0
            ? offset.clone().normalize()
            : new THREE.Vector3(0, 0, 1);
        zoomAnimRef.current = {
          active: true,
          start: performance.now(),
          duration: 700,
          fromDistance: offset.length(),
          toDistance: focusDistance,
          dir,
        };
      }
    };

    window.addEventListener("focusMoon", onFocusMoon as EventListener);
    return () =>
      window.removeEventListener("focusMoon", onFocusMoon as EventListener);
  }, [currentSystem, setSelectedObject, setSelectedPos, planetsToRender]);

  // Listen for cycleMoons requests coming from HUD
  useEffect(() => {
    const onCycleMoons = (e: Event) => {
      const detail = (e as CustomEvent).detail as { planetId: string };
      if (!detail || !currentSystem || !controlsRef.current) return;

      // Find the planet
      const planet = currentSystem.planets.find(
        (p) => p.id === detail.planetId
      );
      if (!planet || !planet.moons || planet.moons.length === 0) return;

      // Find current moon index
      const currentMoonIndex = selectedMoonId
        ? planet.moons.findIndex((m) => m.id === selectedMoonId)
        : -1;

      // Cycle to next moon, or first moon if none selected
      const nextMoonIndex = (currentMoonIndex + 1) % planet.moons.length;
      const nextMoon = planet.moons[nextMoonIndex];

      if (nextMoon) {
        setSelectedObject({ id: nextMoon.id, type: "moon" });

        // Calculate moon position for focus
        const moonAngle = nextMoon.orbitalAngle;
        const moonDistance = nextMoon.orbitalDistance;

        // Get planet's actual orbital position from planetsToRender
        const planetRenderData = planetsToRender.find(
          (p) => p.planet.id === planet.id
        );
        if (!planetRenderData) return;

        const planetPos = new THREE.Vector3(
          Math.cos(planetRenderData.angle) * planetRenderData.distance,
          0,
          Math.sin(planetRenderData.angle) * planetRenderData.distance
        );

        // Calculate moon position relative to planet
        const moonPos = new THREE.Vector3(
          planetPos.x + Math.cos(moonAngle) * moonDistance,
          planetPos.y,
          planetPos.z + Math.sin(moonAngle) * moonDistance
        );

        setSelectedPos(moonPos);

        // Focus on the moon with close-up distance
        const focusDistance = 0.2;
        if (controlsRef.current) {
          const controls = controlsRef.current;
          const cam = controls.object as THREE.PerspectiveCamera;
          const offset = cam.position.clone().sub(controls.target);
          const dir =
            offset.length() > 0
              ? offset.clone().normalize()
              : new THREE.Vector3(0, 0, 1);
          zoomAnimRef.current = {
            active: true,
            start: performance.now(),
            duration: 700,
            fromDistance: offset.length(),
            toDistance: focusDistance,
            dir,
          };
        }
      }
    };

    window.addEventListener("cycleMoons", onCycleMoons as EventListener);
    return () =>
      window.removeEventListener("cycleMoons", onCycleMoons as EventListener);
  }, [
    currentSystem,
    setSelectedObject,
    setSelectedPos,
    planetsToRender,
    selectedMoonId,
  ]);

  // Listen for focus Home planet event (from clicking Home button)
  useEffect(() => {
    const handleFocusHome = () => {
      if (!currentSystem) return;

      // Focus on the home planet - prioritize earth-like planets
      const homePlanet =
        currentSystem?.planets?.find((p) => p.type === "earth_like") ||
        currentSystem?.planets?.find((p) =>
          ["earth_like", "terrestrial", "ocean_world"].includes(p.type)
        ) ||
        currentSystem?.planets?.[0];

      if (homePlanet) {
        const SUN_RADIUS_UNITS = currentSystem?.star?.size || 1;
        const renderScale = Math.min(
          0.16,
          (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, homePlanet.radius / 6371)
        );
        const radiusUnits = (homePlanet.radius / 6371) * renderScale;
        const atmosphereRadius = radiusUnits * 1.06;
        const minSafeDistance = (atmosphereRadius * 2) / 0.6;
        const focusDistance = Math.max(
          minSafeDistance,
          Math.min(4, radiusUnits * 2.5)
        );

        // Store the focus distance for when we get the position update
        pendingFocusDistanceRef.current = focusDistance;

        // Set selected ID - the frame loop will update position via onSelectedFrame
        setSelectedObject({ id: homePlanet.id, type: "planet" });
        // Emit to server if connected
        if (isConnected) {
          emitPlanetSelected(homePlanet.id);
        }
      }
    };
    window.addEventListener("focusHomePlanet", handleFocusHome);
    return () => window.removeEventListener("focusHomePlanet", handleFocusHome);
  }, [currentSystem, isConnected, emitPlanetSelected, setSelectedObject]);

  // Visual radius for the sun (scene units) - from star data
  const SUN_RADIUS_UNITS = currentSystem?.star.size ?? 0.6;
  const SUN_COLOR = currentSystem?.star.color ?? "#ffd700";
  const SUN_GLOW_COLOR = currentSystem?.star.glowColor ?? "#ffcc00";

  // If no current system, show loading or empty state
  if (!currentSystem) {
    return (
      <group>
        <ambientLight intensity={0.5} />
      </group>
    );
  }

  // Handle clicking on empty space - deselect all objects
  const handleDeselectAll = () => {
    setSelectedObject(null);
    setSelectedPos(null);

    // Emit to server if connected
    if (isConnected) {
      emitPlanetSelected(null);
      // TODO: Add asteroid/moon/sun deselection socket event
    }
  };

  // Camera following for selected spaceship (throttled)
  useEffect(() => {
    if (!selectedSpaceshipId || !controlsRef.current) return;

    const selectedSpaceship = spaceships.find(
      (s) => s.id === selectedSpaceshipId
    );
    if (!selectedSpaceship) return;

    // Throttle camera updates to avoid performance issues
    const now = Date.now();
    if (now - (window.lastCameraUpdate || 0) < 33) {
      // ~30fps max
      return;
    }
    window.lastCameraUpdate = now;

    // Update camera target to follow the spaceship
    setSelectedPos(selectedSpaceship.position.clone());

    // Focus on the spaceship with appropriate distance
    const controls = controlsRef.current;
    const targetPosition = selectedSpaceship.position.clone();

    // Smooth camera movement to spaceship
    const currentTarget = controls.target.clone();
    const direction = targetPosition.clone().sub(currentTarget);
    const distance = direction.length();

    if (distance > 0.1) {
      // Smooth interpolation to spaceship position
      const lerpFactor = Math.min(0.1, 1.0); // Faster following
      controls.target.lerp(targetPosition, lerpFactor);
      controls.update();
    }
  }, [selectedSpaceshipId, spaceships]);

  const handleTravelToSystem = (
    toSystemId: string,
    gatePosition: [number, number, number]
  ) => {
    if (!currentSystemId || !controlsRef.current) return;

    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

    // Clear selection when traveling
    setSelectedObject(null);

    // Start travel animation with approach phase
    setTravelState({
      active: true,
      fromSystemId: currentSystemId,
      toSystemId: toSystemId,
      gatePosition,
      phase: "approach",
      startTime: Date.now(),
      initialCameraPos: cam.position.clone(),
      initialCameraTarget: controls.target.clone(),
    });
  };

  const handleUndiscoveredGateClick = (
    gatePosition: [number, number, number]
  ) => {
    if (!currentSystemId || !controlsRef.current) return;

    const currentSys = currentSystem;
    if (!currentSys) return;

    // Check if we can add more connections
    if (!canAddConnection(currentSystemId)) {
      alert(
        `This system has reached the maximum of ${currentSys.maxConnections} connections!`
      );
      return;
    }

    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

    try {
      // Generate new system WITHOUT connecting it yet - we'll connect during warp phase
      const newSystem = generateAndAddSystem(currentSystemId);
      console.log(
        `Generated new system: ${newSystem.name} (ID: ${newSystem.id})`
      );

      // Clear selection when traveling
      setSelectedObject(null);

      // Start travel animation with approach phase, marking it as a new system
      setTravelState({
        active: true,
        fromSystemId: currentSystemId,
        toSystemId: newSystem.id,
        gatePosition,
        phase: "approach",
        startTime: Date.now(),
        initialCameraPos: cam.position.clone(),
        initialCameraTarget: controls.target.clone(),
        isNewSystem: true, // Mark this as a newly discovered system
      });

      // Emit to server if connected
      if (isConnected) {
        // TODO: emit system generated event
      }
    } catch (error) {
      console.error("Failed to generate system:", error);
      alert("Failed to generate new system");
    }
  };

  const completeTravelAnimation = () => {
    // Clear travel state
    setTravelState(null);
  };

  // Calculate tunnel gate data for connected systems and undiscovered gates
  const { tunnelGates, undiscoveredGates } = useMemo(() => {
    if (!currentSystem) return { tunnelGates: [], undiscoveredGates: [] };

    // If we're traveling to a newly discovered system from THIS system, hide that connection and show it as undiscovered
    // Only apply this filter when we're still in the origin system (not after we've arrived at destination)
    const pendingSystemId =
      travelState?.isNewSystem && travelState.fromSystemId === currentSystemId
        ? travelState.toSystemId
        : null;

    // Calculate total gates needed (connected + undiscovered)
    const totalGates = currentSystem.maxConnections;

    // Filter out the pending connection when counting (only in origin system during travel)
    const actualConnections = currentSystem.connections.filter(
      (id) => id !== pendingSystemId
    );
    const connectedCount = actualConnections.length;
    const undiscoveredCount = totalGates - connectedCount;

    // Calculate angle step for evenly spacing all gates
    const angleStep = (Math.PI * 2) / totalGates;

    // Calculate gate distance dynamically to avoid planet orbits and asteroid belts
    // Planets and asteroids are rendered at orbitalDistance * 1.5
    let gateDistance = 15; // Default fallback

    // Collect all occupied orbital distances (planets and asteroid belts)
    const occupiedDistances: number[] = [];

    if (currentSystem.planets && currentSystem.planets.length > 0) {
      currentSystem.planets.forEach((p) => {
        occupiedDistances.push(p.orbitalDistance * 1.5);
      });
    }

    if (currentSystem.asteroidBelts && currentSystem.asteroidBelts.length > 0) {
      currentSystem.asteroidBelts.forEach((belt) => {
        // Add both inner and outer radius of each belt (scaled by 1.5)
        occupiedDistances.push(belt.innerRadius * 1.5);
        occupiedDistances.push(belt.outerRadius * 1.5);
      });
    }

    if (occupiedDistances.length > 0) {
      const minOccupiedDistance = Math.min(...occupiedDistances);
      const maxOccupiedDistance = Math.max(...occupiedDistances);

      // Place gates either inside the innermost orbit or outside the outermost orbit
      // Prefer inside if there's enough space (> 3 units), otherwise place outside
      const innerGateDistance = minOccupiedDistance - 1.5; // 1.5 units inside innermost object
      const outerGateDistance = maxOccupiedDistance + 2.0; // 2 units outside outermost object

      if (innerGateDistance > 3.0) {
        // Enough space inside - place gates there
        gateDistance = innerGateDistance;
      } else {
        // Not enough space inside - place gates outside all objects
        gateDistance = outerGateDistance;
      }
    }

    // Connected gates (excluding the pending one)
    const connectedGates = actualConnections
      .map((connectedSystemId, index) => {
        const connectedSystem = solarSystems.find(
          (s) => s.id === connectedSystemId
        );
        if (!connectedSystem) return null;

        const angle = index * angleStep;
        const position: [number, number, number] = [
          Math.cos(angle) * gateDistance,
          0,
          Math.sin(angle) * gateDistance,
        ];

        // Use accretion disk color for black holes instead of pure black
        const gateColor =
          connectedSystem.star.type === "black_hole" &&
          connectedSystem.star.blackHole?.accretionDiskColor
            ? connectedSystem.star.blackHole.accretionDiskColor
            : connectedSystem.star.color;

        return {
          id: connectedSystemId,
          position,
          connectedSystemName: connectedSystem.name,
          connectedStarColor: gateColor,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      position: [number, number, number];
      connectedSystemName: string;
      connectedStarColor: string;
    }>;

    // Undiscovered gates (start after connected gates)
    // This will include the pending connection as undiscovered during travel
    const undiscovered = Array.from({ length: undiscoveredCount }, (_, i) => {
      const gateIndex = connectedCount + i;
      const angle = gateIndex * angleStep;
      const position: [number, number, number] = [
        Math.cos(angle) * gateDistance,
        0,
        Math.sin(angle) * gateDistance,
      ];

      return {
        id: `undiscovered-${gateIndex}`,
        position,
      };
    });

    return { tunnelGates: connectedGates, undiscoveredGates: undiscovered };
  }, [currentSystem, solarSystems, travelState, currentSystemId]);

  // Determine if we're in the tunnel phase
  const isInTunnelPhase = travelState?.active && travelState.phase === "warp";

  // If in tunnel warp phase, show only the tunnel animation
  if (isInTunnelPhase) {
    const fromSystem = solarSystems.find(
      (s) => s.id === travelState.fromSystemId
    );
    const toSystem = solarSystems.find((s) => s.id === travelState.toSystemId);

    if (fromSystem && toSystem) {
      return (
        <TravelAnimation
          fromSystemName={fromSystem.name}
          toSystemName={toSystem.name}
          fromStarColor={fromSystem.star.color}
          toStarColor={toSystem.star.color}
          onComplete={() => {
            // Switch to new system and move to exit phase
            if (travelState.toSystemId !== currentSystemId) {
              setCurrentSystem(travelState.toSystemId);
              // Emit to server if connected
              if (isConnected) {
                emitCurrentSystemChanged(travelState.toSystemId);
              }
            }
            // Clear isNewSystem flag when we arrive - the discovery is complete!
            setTravelState((prev) =>
              prev
                ? {
                    ...prev,
                    phase: "exit",
                    startTime: Date.now(),
                    isNewSystem: false,
                  }
                : null
            );
          }}
        />
      );
    }
  }

  return (
    <group onPointerMissed={handleDeselectAll}>
      {/* Starfield background that adapts to star type */}
      <Starfield starType={currentSystem?.star?.type || "yellow_star"} />

      {/* Nebulae - Render in the background */}
      {currentSystem.nebulae?.map((nebula) => (
        <Nebula key={nebula.id} nebula={nebula} timeScale={timeScale} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.3}
        maxDistance={maxCameraDistance}
        autoRotate={false}
        // Two-finger trackpad gestures for panning
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.PAN, // Two-finger pan instead of zoom
        }}
      />

      {/* Render Black Hole or Regular Star */}
      {currentSystem.star.type === "black_hole" &&
      currentSystem.star.blackHole ? (
        <BlackHole
          blackHoleData={currentSystem.star.blackHole}
          size={SUN_RADIUS_UNITS}
          timeScale={timeScale}
        />
      ) : (
        <>
          {/* Sun with enhanced glow layers */}
          <Sphere
            ref={sunRef}
            args={[SUN_RADIUS_UNITS, 32, 32]}
            position={[0, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedObject({ id: currentSystem.star.id, type: "sun" });
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "auto";
            }}
          >
            <meshBasicMaterial color={SUN_COLOR} />
          </Sphere>

          {/* Inner glow - bright */}
          <Sphere
            args={[SUN_RADIUS_UNITS * 1.15, 32, 32]}
            position={[0, 0, 0]}
            renderOrder={10}
            raycast={() => null}
          >
            <meshBasicMaterial
              color={SUN_COLOR}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </Sphere>

          {/* Middle glow */}
          <Sphere
            args={[SUN_RADIUS_UNITS * 1.4, 32, 32]}
            position={[0, 0, 0]}
            renderOrder={10}
            raycast={() => null}
          >
            <meshBasicMaterial
              color={SUN_GLOW_COLOR}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </Sphere>

          {/* Outer glow - soft halo */}
          <Sphere
            args={[SUN_RADIUS_UNITS * 1.8, 32, 32]}
            position={[0, 0, 0]}
            renderOrder={10}
            raycast={() => null}
          >
            <meshBasicMaterial
              color={SUN_GLOW_COLOR}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </Sphere>

          {/* Far glow - atmospheric effect */}
          <Sphere
            args={[SUN_RADIUS_UNITS * 2.5, 32, 32]}
            position={[0, 0, 0]}
            renderOrder={10}
            raycast={() => null}
          >
            <meshBasicMaterial
              color={SUN_GLOW_COLOR}
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </Sphere>
        </>
      )}

      {/* Render companion star for binary systems */}
      {currentSystem.star.type === "binary_star" &&
        currentSystem.star.companion && (
          <BinaryStar
            companion={currentSystem.star.companion}
            timeScale={timeScale}
          />
        )}

      {/* Dyson Sphere - Rare megastructure */}
      {currentSystem.dysonSphere && (
        <DysonSphere
          starSize={SUN_RADIUS_UNITS}
          starColor={SUN_COLOR}
          timeScale={timeScale}
          completionPercentage={currentSystem.dysonSphere.completionPercentage}
        />
      )}

      {/* Procedurally generated planets */}
      {planetsToRender.map((g) => {
        const renderScale = Math.min(
          0.16,
          (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, g.planet.radius / 6371)
        );

        return (
          <Planet
            key={g.planet.id}
            planet={g.planet}
            distance={g.distance}
            speed={g.speed}
            angle={g.angle}
            timeScale={timeScale}
            selectedId={selectedPlanetId || undefined}
            selectedMoonId={selectedMoonId || undefined}
            onSelect={(id, pos) => {
              // Find the clicked planet by ID
              const clickedPlanetData = planetsToRender.find(
                (p) => p.planet.id === id
              );
              if (!clickedPlanetData) return;

              setSelectedObject({ id, type: "planet" });
              setSelectedPos(pos.clone());
              // Emit to server if connected
              if (isConnected) {
                emitPlanetSelected(id);
              }

              // Calculate focus distance for the clicked planet
              const clickedRenderScale = Math.min(
                0.16,
                (SUN_RADIUS_UNITS * 0.7) /
                  Math.max(0.001, clickedPlanetData.planet.radius / 6371)
              );
              const radiusUnits =
                (clickedPlanetData.planet.radius / 6371) * clickedRenderScale;
              const atmosphereRadius = radiusUnits * 1.06;
              const minSafeDistance = (atmosphereRadius * 2) / 0.6;
              const focusDistance = Math.max(
                minSafeDistance,
                Math.min(4, radiusUnits * 2.5)
              );

              // Begin smooth zoom toward planet
              if (controlsRef.current) {
                const controls = controlsRef.current;
                const cam = controls.object as THREE.PerspectiveCamera;
                const offset = cam.position.clone().sub(controls.target);
                const dir =
                  offset.length() > 0
                    ? offset.clone().normalize()
                    : new THREE.Vector3(0, 0, 1);
                zoomAnimRef.current = {
                  active: true,
                  start: performance.now(),
                  duration: 700,
                  fromDistance: offset.length(),
                  toDistance: focusDistance,
                  dir,
                };
              }
            }}
            onSelectedFrame={(id, pos) => {
              if (selectedPlanetId === id) {
                setSelectedPos(pos.clone());
                // If there's a pending focus distance (from Home button), trigger zoom
                if (
                  pendingFocusDistanceRef.current !== null &&
                  controlsRef.current
                ) {
                  const controls = controlsRef.current;
                  const cam = controls.object as THREE.PerspectiveCamera;
                  const offset = cam.position.clone().sub(controls.target);
                  const dir =
                    offset.length() > 0
                      ? offset.clone().normalize()
                      : new THREE.Vector3(0, 0, 1);
                  zoomAnimRef.current = {
                    active: true,
                    start: performance.now(),
                    duration: 700,
                    fromDistance: offset.length(),
                    toDistance: pendingFocusDistanceRef.current,
                    dir,
                  };
                  pendingFocusDistanceRef.current = null;
                }
              }
            }}
            onMoonSelect={(moonId, moonPos) => {
              setSelectedObject({ id: moonId, type: "moon" });
              setSelectedPos(moonPos.clone());

              // Calculate focus distance for the clicked moon
              const focusDistance = 0.2; // Close-up for moons
              if (controlsRef.current) {
                const controls = controlsRef.current;
                const cam = controls.object as THREE.PerspectiveCamera;
                const offset = cam.position.clone().sub(controls.target);
                const dir =
                  offset.length() > 0
                    ? offset.clone().normalize()
                    : new THREE.Vector3(0, 0, 1);
                zoomAnimRef.current = {
                  active: true,
                  start: performance.now(),
                  duration: 700,
                  fromDistance: offset.length(),
                  toDistance: focusDistance,
                  dir,
                };
              }
            }}
            onMoonSelectedFrame={(moonId, moonPos) => {
              if (selectedMoonId === moonId) {
                setSelectedPos(moonPos.clone());
              }
            }}
            renderScale={renderScale}
            showOrbit={shouldShowPlanetOrbits}
          />
        );
      })}

      {/* Asteroid Belts */}
      {currentSystem.asteroidBelts?.map((belt) => (
        <AsteroidBelt
          key={belt.id}
          belt={belt}
          timeScale={timeScale}
          selectedId={selectedAsteroidId || undefined}
          showBeltRing={shouldShowPlanetOrbits}
          planetPositions={planetsToRender.map(
            (p) =>
              new THREE.Vector3(
                Math.cos(p.angle) * p.distance,
                0,
                Math.sin(p.angle) * p.distance
              )
          )}
          onAsteroidSelect={(asteroidId) => {
            // Use the helper function to focus with zoom animation
            focusOnAsteroid(asteroidId);
            // Selection is already handled by setSelectedObject above
            // Emit to server if connected
            if (isConnected) {
              // TODO: Add asteroid selection socket event
            }
          }}
          onSelectedFrame={(asteroidId, position) => {
            // Continuously update position for camera tracking while asteroid is selected
            if (selectedAsteroidId === asteroidId) {
              setSelectedPos(position);
            }
          }}
        />
      ))}

      {/* Tunnel Gates for connected systems */}
      {tunnelGates.map((gate) => (
        <TunnelGate
          key={gate.id}
          position={gate.position}
          connectedSystemName={gate.connectedSystemName}
          connectedStarColor={gate.connectedStarColor}
          onClick={() => handleTravelToSystem(gate.id, gate.position)}
        />
      ))}

      {/* Undiscovered Gates for future connections */}
      {undiscoveredGates.map((gate) => (
        <UndiscoveredGate
          key={gate.id}
          position={gate.position}
          onClick={() => handleUndiscoveredGateClick(gate.position)}
        />
      ))}

      {/* Spaceships */}
      <SpaceshipManager />

      {/* Comets */}
      {currentSystem.comets?.map((comet) => (
        <Comet
          key={comet.id}
          comet={comet}
          timeScale={timeScale}
          selectedId={selectedCometId || undefined}
          showOrbit={shouldShowPlanetOrbits}
          companionStar={
            currentSystem.star.type === "binary_star"
              ? currentSystem.star.companion
              : undefined
          }
          onSelect={(id, pos) => {
            setSelectedObject({ id, type: "comet" });
            setSelectedPos(pos.clone());

            // Zoom to comet
            if (controlsRef.current) {
              const controls = controlsRef.current;
              const cam = controls.object as THREE.PerspectiveCamera;
              const offset = cam.position.clone().sub(controls.target);
              const dir =
                offset.length() > 0
                  ? offset.clone().normalize()
                  : new THREE.Vector3(0, 0, 1);
              zoomAnimRef.current = {
                active: true,
                start: performance.now(),
                duration: 700,
                fromDistance: offset.length(),
                toDistance: 0.5, // Close-up view for comets
                dir,
              };
            }

            // Emit to server if connected
            if (isConnected) {
              // TODO: Add comet selection socket event
            }
          }}
          onSelectedFrame={(id, pos) => {
            if (selectedCometId === id) {
              setSelectedPos(pos.clone());
            }
          }}
        />
      ))}

      {/* Simple asteroid size test - disabled to reduce clutter */}
      {/* {process.env.NODE_ENV === "development" && <SimpleAsteroidTest />} */}

      {/* Star Name Display - Top of screen */}
      <Html fullscreen style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,40,0.85) 100%)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "20px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              border: `2px solid ${SUN_COLOR}`,
              boxShadow: `0 0 20px ${SUN_COLOR}60, 0 4px 15px rgba(0,0,0,0.5)`,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "22px", marginBottom: "2px" }}>
                {currentSystem?.name || "Unknown System"}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: SUN_COLOR,
                  opacity: 0.9,
                  fontWeight: "normal",
                }}
              >
                {currentSystem?.star?.name || "Unknown Star"}
              </div>
            </div>
          </div>
        </div>
      </Html>

      {/* Lighting - ambient light tinted by star color for atmosphere */}
      <ambientLight
        intensity={
          currentSystem.star.type === "black_hole"
            ? 0.1
            : currentSystem.dysonSphere
            ? // Reduce ambient light based on Dyson sphere completion (0-100%)
              // At 0%: full light (0.5), at 100%: minimal light (0.05)
              0.5 *
              (1 - (currentSystem.dysonSphere.completionPercentage / 100) * 0.9)
            : 0.5
        }
        color={currentSystem.star.type === "black_hole" ? "#1a1a2e" : SUN_COLOR}
      />
      {/* Primary star light (or accretion disk light for black holes) */}
      {currentSystem.star.type !== "black_hole" && (
        <pointLight
          position={[0, 0, 0]}
          intensity={
            currentSystem.star.type === "binary_star"
              ? (currentSystem?.star?.luminosity || 1) * 50
              : (currentSystem?.star?.luminosity || 1) * 12
          }
          distance={0}
          decay={currentSystem.star.type === "binary_star" ? 0.5 : 1.2}
          color={SUN_COLOR}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-radius={2}
        />
      )}
    </group>
  );
};

export default SolarSystemView;
