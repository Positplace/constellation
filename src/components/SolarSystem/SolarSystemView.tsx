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
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const { isPlaying, gameTime } = useGameStore();

  // Start the game loop so gameTime advances when playing
  useGameLoop();

  // Rotate Sun slowly
  useFrame((state, delta) => {
    if (sunRef.current && isPlaying) {
      sunRef.current.rotation.y += delta * 0.2;
    }
  });

  useEffect(() => {
    if (controlsRef.current && selectedPos) {
      // Center on selected planet
      controlsRef.current.target.copy(selectedPos);

      // If we have a desired viewing distance, place camera accordingly
      if (selectedDistance != null) {
        const cam = controlsRef.current.object as THREE.PerspectiveCamera;
        const currentTarget = controlsRef.current.target as THREE.Vector3;
        const dir = cam.position.clone().sub(currentTarget).normalize();
        const desiredPos = selectedPos
          .clone()
          .add(dir.multiplyScalar(selectedDistance));
        cam.position.copy(desiredPos);
      }

      controlsRef.current.update();
    }
  }, [selectedPos, selectedDistance]);

  // Static planet specs - do not change across renders
  const planetSpecs = useMemo(
    () => [
      { type: "terrestrial" as const, distance: 1.5, speed: 0.8, seed: 101 },
      { type: "desert_world" as const, distance: 2.0, speed: 0.6, seed: 202 },
      { type: "ocean_world" as const, distance: 2.5, speed: 0.5, seed: 303 },
      { type: "ice_world" as const, distance: 3.0, speed: 0.4, seed: 404 },
      { type: "gas_giant" as const, distance: 4.5, speed: 0.2, seed: 505 },
    ],
    []
  );

  // Generate planets once
  const generated = useMemo(
    () =>
      planetSpecs.map((p, idx) => ({
        planet: createPlanet({
          type: p.type,
          size: "medium",
          age: "mature",
          habitability: "marginal",
          seed: p.seed,
        }),
        distance: p.distance,
        speed: p.speed,
        angle: (idx * Math.PI) / 4,
      })),
    [planetSpecs]
  );

  // Visual radius for the sun (scene units)
  const SUN_RADIUS_UNITS = 0.6; // larger sun

  return (
    <group
      onPointerMissed={() => {
        setSelectedId(null);
        setSelectedPos(null);
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
      >
        <meshBasicMaterial color="#ffd700" />
      </Sphere>

      {/* Sun glow effect */}
      <Sphere args={[SUN_RADIUS_UNITS * 1.2, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
      </Sphere>

      {/* Procedurally generated planets */}
      {generated.map((g, index) => {
        const renderScale = Math.min(
          0.16,
          (SUN_RADIUS_UNITS * 0.7) / Math.max(0.001, g.planet.radius / 6371)
        );
        const radiusUnits = (g.planet.radius / 6371) * renderScale;
        const viewDistance = Math.max(0.4, Math.min(5, radiusUnits * 2.2));

        return (
          <ProceduralPlanetOrbit
            key={g.planet.id}
            planet={g.planet}
            distance={g.distance}
            speed={g.speed}
            angle={g.angle}
            paused={!!selectedId || !isPlaying}
            selectedId={selectedId || undefined}
            onSelect={(id, pos) => {
              setSelectedId(id);
              setSelectedPos(pos.clone());
              setSelectedDistance(viewDistance);
            }}
            renderScale={renderScale}
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
