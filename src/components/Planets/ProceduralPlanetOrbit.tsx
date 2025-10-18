import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import PlanetRenderer from "./PlanetRenderer";
import { PlanetData } from "../../types/planet.types";

interface ProceduralPlanetOrbitProps {
  planet: PlanetData;
  distance: number;
  speed: number;
  angle: number;
  paused?: boolean;
  selectedId?: string;
  onSelect?: (planetId: string, worldPos: THREE.Vector3) => void;
  renderScale?: number;
  onSelectedFrame?: (planetId: string, worldPos: THREE.Vector3) => void;
  showOrbit?: boolean;
  timeScale?: number;
}

const ProceduralPlanetOrbit: React.FC<ProceduralPlanetOrbitProps> = ({
  planet,
  distance,
  speed,
  angle,
  paused = false,
  selectedId,
  onSelect,
  renderScale,
  onSelectedFrame,
  showOrbit = true,
  timeScale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  // Track accumulated orbital phase using timeScale-aware delta
  const phaseRef = useRef(0);

  // Ensure an initial position even when paused so planets are visible immediately
  useEffect(() => {
    if (groupRef.current) {
      const x0 = Math.cos(angle) * distance;
      const z0 = Math.sin(angle) * distance;
      groupRef.current.position.set(x0, 0, z0);
    }
  }, [angle, distance]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Accumulate phase using timeScale so pausing/playing is smooth
      phaseRef.current += delta * speed * timeScale;
      const x = Math.cos(phaseRef.current + angle) * distance;
      const z = Math.sin(phaseRef.current + angle) * distance;
      groupRef.current.position.set(x, 0, z);

      // Apply planet self spin scaled by timeScale
      const axis: THREE.Vector3 | undefined = (
        groupRef.current.children[0] as any
      )?.userData?.spinAxis;
      const spinSpeed: number | undefined = (
        groupRef.current.children[0] as any
      )?.userData?.spinSpeed;
      if (axis && spinSpeed) {
        groupRef.current.children[0].rotateOnAxis(
          axis,
          spinSpeed * delta * timeScale
        );
      }

      // When this planet is selected, continuously emit its world position so the camera can track it while the system keeps spinning
      if (selectedId === planet.id && onSelectedFrame) {
        const world = new THREE.Vector3();
        groupRef.current.getWorldPosition(world);
        onSelectedFrame(planet.id, world);
      }
    }
  });

  return (
    <group>
      {/* Orbital path */}
      {showOrbit && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[distance - 0.01, distance + 0.01, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Planet at animated position */}
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!groupRef.current) return;
          const world = new THREE.Vector3();
          groupRef.current.getWorldPosition(world);
          onSelect && onSelect(planet.id, world);
        }}
      >
        <PlanetRenderer planet={planet} renderScale={renderScale} />
      </group>
    </group>
  );
};

export default ProceduralPlanetOrbit;
