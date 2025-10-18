import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetOrbitProps {
  children: React.ReactNode;
  distance: number;
  speed: number;
  angle: number;
  timeScale: number;
  showOrbit?: boolean;
  onPositionUpdate?: (position: THREE.Vector3) => void;
}

/**
 * Handles orbital movement of a planet around the sun.
 * Keeps the planet at the correct distance and moves it along its orbit.
 */
export const PlanetOrbit: React.FC<PlanetOrbitProps> = ({
  children,
  distance,
  speed,
  angle,
  timeScale,
  showOrbit = true,
  onPositionUpdate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);

  // Set initial position
  useEffect(() => {
    if (groupRef.current) {
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      groupRef.current.position.set(x, 0, z);
    }
  }, [angle, distance]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Accumulate orbital phase
    phaseRef.current += delta * speed * timeScale;

    // Calculate new position
    const x = Math.cos(phaseRef.current + angle) * distance;
    const z = Math.sin(phaseRef.current + angle) * distance;
    groupRef.current.position.set(x, 0, z);

    // Notify parent of position change
    if (onPositionUpdate) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      onPositionUpdate(worldPos);
    }
  });

  return (
    <>
      {/* Orbital path ring */}
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

      {/* Planet at orbital position */}
      <group ref={groupRef}>{children}</group>
    </>
  );
};


