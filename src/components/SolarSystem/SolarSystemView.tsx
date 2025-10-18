import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import Planet from "../Planets/Planet";
import TunnelGate from "./TunnelGate";
import TravelAnimation from "./TravelAnimation";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";

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
  } | null>(null);
  // Track selection; camera distance should remain user-controlled
  const {
    isPlaying,
    timeScale,
    solarSystems,
    currentSystemId,
    selectedPlanetId,
    setSelectedPlanet,
    setCurrentSystem,
    setActiveView,
  } = useGameStore();
  const { emitPlanetSelected, emitCurrentSystemChanged, changeView } =
    useSocket();
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
      setSelectedPlanet(null);
      setSelectedPos(new THREE.Vector3(0, 0, 0));
      // Emit to server if connected
      if (isConnected) {
        emitPlanetSelected(null);
      }
    };
    window.addEventListener("resetSolarView", handleReset);
    return () => window.removeEventListener("resetSolarView", handleReset);
  }, [isConnected, emitPlanetSelected]);

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

        // Animate camera to gate
        if (travelState.initialCameraPos) {
          cam.position.lerpVectors(
            travelState.initialCameraPos,
            targetPos,
            eased
          );
        }

        // Look at the gate
        controls.target.copy(gatePos);
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

        // Get the exit gate position
        const exitGatePos = new THREE.Vector3(...travelState.gatePosition);
        const finalTarget = new THREE.Vector3(0, 0, 0);

        // Calculate final position to maintain original camera angle and distance
        let finalPos = new THREE.Vector3(0, 12, 0);
        if (travelState.initialCameraPos && travelState.initialCameraTarget) {
          // Calculate the original offset from center
          const originalOffset = travelState.initialCameraPos
            .clone()
            .sub(travelState.initialCameraTarget);
          // Apply same offset to new system's center
          finalPos = finalTarget.clone().add(originalOffset);
        }

        // Start slightly ahead of the gate
        const startPos = exitGatePos
          .clone()
          .add(
            new THREE.Vector3(
              -travelState.gatePosition[0] * 0.1,
              0,
              -travelState.gatePosition[2] * 0.1
            )
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

      // Focus on the home planet - prioritize colonized earth-like planets
      const homePlanet =
        currentSystem.planets.find((p) => p.colonized) ||
        currentSystem.planets.find((p) => p.type === "earth_like") ||
        currentSystem.planets[0];

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
        setSelectedPlanet(homePlanet.id);
        // Emit to server if connected
        if (isConnected) {
          emitPlanetSelected(homePlanet.id);
        }
      }
    };
    window.addEventListener("focusHomePlanet", handleFocusHome);
    return () => window.removeEventListener("focusHomePlanet", handleFocusHome);
  }, [currentSystem, isConnected, emitPlanetSelected]);

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
    setSelectedPlanet(null);
    setSelectedPos(new THREE.Vector3(0, 0, 0));
  };

  const handleTravelToSystem = (
    toSystemId: string,
    gatePosition: [number, number, number]
  ) => {
    if (!currentSystemId || !controlsRef.current) return;

    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

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

  const completeTravelAnimation = () => {
    // Clear travel state
    setTravelState(null);
  };

  // Calculate tunnel gate data for connected systems
  const tunnelGates = useMemo(() => {
    if (!currentSystem) return [];

    return currentSystem.connections
      .map((connectedSystemId, index) => {
        const connectedSystem = solarSystems.find(
          (s) => s.id === connectedSystemId
        );
        if (!connectedSystem) return null;

        // Calculate position for tunnel gate (evenly spaced around the system)
        const angleStep = (Math.PI * 2) / currentSystem.connections.length;
        const angle = index * angleStep;
        const gateDistance = 15; // Distance from sun
        const position: [number, number, number] = [
          Math.cos(angle) * gateDistance,
          0,
          Math.sin(angle) * gateDistance,
        ];

        return {
          id: connectedSystemId,
          position,
          connectedSystemName: connectedSystem.name,
          connectedStarColor: connectedSystem.star.color,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      position: [number, number, number];
      connectedSystemName: string;
      connectedStarColor: string;
    }>;
  }, [currentSystem, solarSystems]);

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
            setTravelState((prev) =>
              prev ? { ...prev, phase: "exit", startTime: Date.now() } : null
            );
          }}
        />
      );
    }
  }

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

      {/* Star Name Display - Top of screen */}
      <Html fullscreen>
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
                {currentSystem.name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: SUN_COLOR,
                  opacity: 0.9,
                  fontWeight: "normal",
                }}
              >
                {currentSystem.star.name}
              </div>
            </div>
          </div>
        </div>
      </Html>

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
