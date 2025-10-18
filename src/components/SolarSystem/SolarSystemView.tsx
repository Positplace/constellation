import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import PlanetOrbit from "./PlanetOrbit";
import ProceduralPlanetOrbit from "../Planets/ProceduralPlanetOrbit";
import { createPlanet } from "../../utils/planetFactory";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";

const SolarSystemView: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<THREE.Vector3 | null>(null);
  // Track selection; camera distance should remain user-controlled
  const { isPlaying, timeScale } = useGameStore();
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
  useFrame((state, delta) => {
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

  // Static planet specs - do not change across renders
  const planetSpecs = useMemo(
    () => [
      {
        type: "terrestrial" as const,
        distance: 1.5,
        speed: 0.8,
        seed: 101,
        name: undefined,
      },
      {
        type: "desert_world" as const,
        distance: 2.0,
        speed: 0.6,
        seed: 202,
        name: undefined,
      },
      {
        type: "earth_like" as const,
        distance: 2.5,
        speed: 0.5,
        seed: 303,
        name: "Home",
      },
      {
        type: "ice_world" as const,
        distance: 3.0,
        speed: 0.4,
        seed: 404,
        name: undefined,
      },
      {
        type: "gas_giant" as const,
        distance: 4.5,
        speed: 0.2,
        seed: 505,
        name: undefined,
      },
    ],
    []
  );

  // Generate planets once
  const generated = useMemo(
    () =>
      planetSpecs.map((p, idx) => ({
        planet: createPlanet(
          {
            type: p.type,
            size: "medium",
            age: "mature",
            habitability: p.type === "earth_like" ? "ideal" : "marginal",
            seed: p.seed,
          },
          p.name
        ),
        distance: p.distance,
        // Slow down orbital speed to make clicking easier
        speed: p.speed * 0.2,
        angle: (idx * Math.PI) / 4,
      })),
    [planetSpecs]
  );

  // Listen for focus Home planet event (from clicking Home button)
  useEffect(() => {
    const handleFocusHome = () => {
      const homePlanetIndex = generated.findIndex(
        (g) => g.planet.name === "Home"
      );
      if (homePlanetIndex !== -1) {
        const homePlanetData = generated[homePlanetIndex];
        const renderScale = Math.min(
          0.16,
          (0.6 * 0.7) / Math.max(0.001, homePlanetData.planet.radius / 6371)
        );
        const radiusUnits = (homePlanetData.planet.radius / 6371) * renderScale;
        const atmosphereRadius = radiusUnits * 1.06;
        const minSafeDistance = (atmosphereRadius * 2) / 0.6;
        const focusDistance = Math.max(
          minSafeDistance,
          Math.min(4, radiusUnits * 2.5)
        );

        // Store the focus distance for when we get the position update
        pendingFocusDistanceRef.current = focusDistance;

        // Set selected ID - the frame loop will update position via onSelectedFrame
        setSelectedId(homePlanetData.planet.id);
      }
    };
    window.addEventListener("focusHomePlanet", handleFocusHome);
    return () => window.removeEventListener("focusHomePlanet", handleFocusHome);
  }, [generated]);

  // Visual radius for the sun (scene units)
  const SUN_RADIUS_UNITS = 0.6; // larger sun

  return (
    <group
      onPointerMissed={() => {
        // Reset selection and smoothly zoom back to overview
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
      }}
    >
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
        }}
      >
        <meshBasicMaterial color="#ffd700" />
      </Sphere>

      {/* Sun glow effect */}
      <Sphere
        args={[SUN_RADIUS_UNITS * 1.2, 32, 32]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
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
        }}
      >
        <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
      </Sphere>

      {/* Procedurally generated planets */}
      {generated.map((g, index) => {
        const renderScale = Math.min(
          0.16,
          (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, g.planet.radius / 6371)
        );
        const radiusUnits = (g.planet.radius / 6371) * renderScale;
        // Calculate safe minimum distance: planet + atmosphere + safe margin
        // Camera FOV is typically 60deg, so visible height at distance d is ~2*d*tan(30deg) = d*1.15
        // We want planet (with atmosphere at 1.06x) to take ~60% of screen height
        const atmosphereRadius = radiusUnits * 1.06;
        const minSafeDistance = (atmosphereRadius * 2) / 0.6; // planet takes 60% of view
        const focusDistance = Math.max(
          minSafeDistance,
          Math.min(4, radiusUnits * 2.5)
        );

        return (
          <ProceduralPlanetOrbit
            key={g.planet.id}
            planet={g.planet}
            distance={g.distance}
            speed={g.speed}
            angle={g.angle}
            paused={!isPlaying}
            selectedId={selectedId || undefined}
            onSelect={(id, pos) => {
              setSelectedId(id);
              setSelectedPos(pos.clone());
              // If selecting Home planet, set focus; otherwise reset it
              if (g.planet.name === "Home") {
                window.dispatchEvent(new CustomEvent("focusHomePlanet"));
              } else {
                window.dispatchEvent(new CustomEvent("resetHomeFocus"));
              }
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
            timeScale={timeScale}
          />
        );
      })}

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffd700" />
    </group>
  );
};

export default SolarSystemView;
