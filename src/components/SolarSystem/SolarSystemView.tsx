import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import Planet from "../Planets/Planet";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";

const SolarSystemView: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const [selectedPos, setSelectedPos] = useState<THREE.Vector3 | null>(null);
  // Track selection; camera distance should remain user-controlled
  const {
    isPlaying,
    timeScale,
    solarSystems,
    currentSystemId,
    selectedPlanetId,
    setSelectedPlanet,
  } = useGameStore();
  const { emitPlanetSelected } = useSocket();
  const { isConnected } = useMultiplayerStore();

  const selectedId = selectedPlanetId;

  // Get current system
  const currentSystem = useMemo(() => {
    return solarSystems.find((s) => s.id === currentSystemId);
  }, [solarSystems, currentSystemId]);

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

  // Set default top-down camera view on mount
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;
      controls.target.set(0, 0, 0);
      cam.position.set(0, 12, 0); // top-down view from above
      controls.update();
    }
  }, []);

  // Listen for reset solar view event (from clicking active System tab)
  useEffect(() => {
    const handleReset = () => {
      if (controlsRef.current) {
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
          // Keep the current view direction initially, will interpolate to top-down
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
      }
      setSelectedId(null);
      setSelectedPos(new THREE.Vector3(0, 0, 0));
    };
    window.addEventListener("resetSolarView", handleReset);
    return () => window.removeEventListener("resetSolarView", handleReset);
  }, []);

  // Rotate Sun slowly
  useFrame((_state, delta) => {
    if (sunRef.current && isPlaying) {
      sunRef.current.rotation.y += delta * 0.2;
    }
  });

  useEffect(() => {
    if (controlsRef.current && selectedPos) {
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

    return currentSystem.planets.map((planet, idx) => ({
      planet,
      distance: planet.orbitalDistance * 1.5, // Scale for visualization
      speed: planet.orbitalSpeed * 0.1, // Slow down for easier interaction
      angle: (idx * Math.PI) / currentSystem.planets.length,
    }));
  }, [currentSystem]);

  // Listen for focus Home planet event (from clicking Home button)
  useEffect(() => {
    const handleFocusHome = () => {
      if (!currentSystem) return;

      // Focus on the first colonized planet or first planet
      const homePlanet =
        currentSystem.planets.find(
          (p) => p.type === "earth_like" || currentSystem.colonized
        ) || currentSystem.planets[0];

      if (homePlanet) {
        const SUN_RADIUS_UNITS = currentSystem.star.size;
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
        setSelectedId(homePlanet.id);
      }
    };
    window.addEventListener("focusHomePlanet", handleFocusHome);
    return () => window.removeEventListener("focusHomePlanet", handleFocusHome);
  }, [currentSystem]);

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

  const handleResetView = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;

      // Current state
      const currentTarget = controls.target.clone();
      const currentOffset = cam.position.clone().sub(currentTarget);
      const currentDistance = currentOffset.length();
      const targetDistance = 12; // Overview distance

      // Target state (overview from above)
      const targetTarget = new THREE.Vector3(0, 0, 0);
      const targetDir = new THREE.Vector3(0, 1, 0);

      // Animate smoothly from current position to overview
      const fromDir =
        currentOffset.length() > 0
          ? currentOffset.clone().normalize()
          : new THREE.Vector3(0, 1, 0);

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
    setSelectedId(null);
    setSelectedPos(new THREE.Vector3(0, 0, 0));
  };

  return (
    <group onPointerMissed={handleResetView}>
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.3}
        maxDistance={20}
        autoRotate={false}
      />

      {/* Sun */}
      <Sphere
        ref={sunRef}
        args={[SUN_RADIUS_UNITS, 32, 32]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleResetView();
        }}
      >
        <meshBasicMaterial color={SUN_COLOR} />
      </Sphere>

      {/* Sun glow effect */}
      <Sphere
        args={[SUN_RADIUS_UNITS * 1.2, 32, 32]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleResetView();
        }}
      >
        <meshBasicMaterial color={SUN_GLOW_COLOR} transparent opacity={0.3} />
      </Sphere>

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
            selectedId={selectedId || undefined}
            onSelect={(id, pos) => {
              // Find the clicked planet by ID
              const clickedPlanetData = planetsToRender.find(
                (p) => p.planet.id === id
              );
              if (!clickedPlanetData) return;

              setSelectedPlanet(id);
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
              if (selectedId === id) {
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
            renderScale={renderScale}
            showOrbit={!selectedId}
          />
        );
      })}

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight
        position={[0, 0, 0]}
        intensity={currentSystem.star.luminosity * 2}
        color={SUN_COLOR}
      />
    </group>
  );
};

export default SolarSystemView;
