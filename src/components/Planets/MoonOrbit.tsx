import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MoonOrbitProps {
  children: React.ReactNode;
  distance: number;
  speed: number;
  angle: number;
  timeScale: number;
  showOrbit?: boolean;
  onPositionUpdate?: (position: THREE.Vector3) => void;
  inclination?: number; // Orbital inclination in degrees
}

/**
 * Handles orbital movement of a moon around its parent planet.
 * Similar to PlanetOrbit but scaled for moons.
 */
export const MoonOrbit: React.FC<MoonOrbitProps> = ({
  children,
  distance,
  speed,
  angle,
  timeScale,
  showOrbit = false, // Moons don't show orbit rings by default
  onPositionUpdate,
  inclination = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);

  // Set initial position with inclination
  useEffect(() => {
    if (groupRef.current) {
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = Math.sin((inclination * Math.PI) / 180) * distance;
      groupRef.current.position.set(x, y, z);
    }
  }, [angle, distance, inclination]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Accumulate orbital phase
    phaseRef.current += delta * speed * timeScale;

    // Calculate new position with inclination
    const x = Math.cos(phaseRef.current + angle) * distance;
    const z = Math.sin(phaseRef.current + angle) * distance;
    const y = Math.sin((inclination * Math.PI) / 180) * distance;
    groupRef.current.position.set(x, y, z);

    // Notify parent of position change
    if (onPositionUpdate) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      onPositionUpdate(worldPos);
    }
  });

  return (
    <>
      {/* Orbital path ring - much smaller for moons */}
      {showOrbit && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.08, 16]} />
          <meshBasicMaterial
            color="#a0a0a0"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Moon at orbital position */}
      <group ref={groupRef}>{children}</group>
    </>
  );
};
