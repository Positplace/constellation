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
      const inclinationRad = (inclination * Math.PI) / 180;
      // Moon orbits in a plane tilted around the X-axis
      const x = Math.cos(angle) * distance;
      const y = -Math.sin(angle) * distance * Math.sin(inclinationRad);
      const z = Math.sin(angle) * distance * Math.cos(inclinationRad);
      groupRef.current.position.set(x, y, z);
    }
  }, [angle, distance, inclination]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Accumulate orbital phase
    phaseRef.current += delta * speed * timeScale;

    // Calculate new position with proper inclination
    // The orbit is a circle in a plane tilted around the X-axis
    // This matches the ring rotation: [Math.PI / 2 + inclinationRad, 0, 0]
    const inclinationRad = (inclination * Math.PI) / 180;
    const orbitAngle = phaseRef.current + angle;

    // Start with XZ plane orbit, then tilt around X-axis
    const x = Math.cos(orbitAngle) * distance;
    const y = -Math.sin(orbitAngle) * distance * Math.sin(inclinationRad);
    const z = Math.sin(orbitAngle) * distance * Math.cos(inclinationRad);

    groupRef.current.position.set(x, y, z);

    // Notify parent of position change
    if (onPositionUpdate) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      onPositionUpdate(worldPos);
    }
  });

  // Calculate rotation for the orbital ring to match the inclined orbit
  const inclinationRad = (inclination * Math.PI) / 180;

  return (
    <>
      {/* Orbital path ring around the planet - tilted to match inclination */}
      {showOrbit && (
        <group>
          <mesh rotation={[Math.PI / 2 + inclinationRad, 0, 0]}>
            <ringGeometry args={[distance - 0.01, distance + 0.01, 64]} />
            <meshBasicMaterial
              color="#a0a0a0"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Moon at orbital position */}
      <group ref={groupRef}>{children}</group>
    </>
  );
};
